require('dotenv').config();
const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const { db } = require('./database/db');
const config = require('./config.json');
const { getResponse } = require('./utils/responseHelper');

// Log npm configuration for debugging deployment issues
console.log('🔍 NPM Configuration Debug:');
console.log('  - Node version:', process.version);
console.log('  - NPM version:', process.env.npm_config_user_agent || 'N/A');
console.log('  - NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('  - npm_config_production:', process.env.npm_config_production || 'not set');
console.log('  - npm_config_omit:', process.env.npm_config_omit || 'not set');
console.log('');

// Create Discord client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates
    ]
});

// Load commands
client.commands = new Collection();
const lcCommand = require('./commands/lc');
const invitesCommand = require('./commands/invites');
const jeuCommand = require('./commands/jeu');
const moderationCommand = require('./commands/moderation');
const statsCommand = require('./commands/stats');
const cadeauCommand = require('./commands/cadeau');
const casinoCommand = require('./commands/casino');
const lotoCommand = require('./commands/loto');

client.commands.set(lcCommand.name, lcCommand);
client.commands.set(invitesCommand.name, invitesCommand);
client.commands.set(jeuCommand.name, jeuCommand);
client.commands.set(moderationCommand.name, moderationCommand);
client.commands.set(statsCommand.name, statsCommand);
client.commands.set(cadeauCommand.name, cadeauCommand);
client.commands.set(casinoCommand.name, casinoCommand);
client.commands.set(lotoCommand.name, lotoCommand);

// Store invites for tracking
const invites = new Map();

// Message count cache to reduce database load
const messageCountCache = new Map();
const MESSAGE_COUNT_BATCH_SIZE = 10; // Update DB every 10 messages

// Voice session tracking to calculate time spent in voice channels
const voiceSessions = new Map(); // Maps userId to join timestamp

// Error throttling to prevent log flooding
const errorThrottleMap = new Map();
const ERROR_THROTTLE_INTERVAL_MS = 60000; // Only log same error type once per minute
const ERROR_THROTTLE_CLEANUP_INTERVAL_MS = 600000; // Clean up old entries every 10 minutes
const ERROR_THROTTLE_CLEANUP_MULTIPLIER = 2; // Keep entries for 2x the throttle interval

function shouldLogError(errorType) {
    const now = Date.now();
    const lastLogged = errorThrottleMap.get(errorType);
    
    if (!lastLogged || (now - lastLogged) > ERROR_THROTTLE_INTERVAL_MS) {
        errorThrottleMap.set(errorType, now);
        return true;
    }
    return false;
}

// Periodic cleanup of old error throttle entries to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    const cutoffTime = now - ERROR_THROTTLE_INTERVAL_MS * ERROR_THROTTLE_CLEANUP_MULTIPLIER;
    
    for (const [errorType, timestamp] of errorThrottleMap.entries()) {
        if (timestamp < cutoffTime) {
            errorThrottleMap.delete(errorType);
        }
    }
}, ERROR_THROTTLE_CLEANUP_INTERVAL_MS);

// Bot ready event
client.once('clientReady', async () => {
    console.log('🤖 Bot is online!');
    console.log(`📝 Logged in as ${client.user.tag}`);
    
    try {
        // Initialize database
        await db.initialize();
        
        // Cache invites for all guilds
        for (const guild of client.guilds.cache.values()) {
            const guildInvites = await guild.invites.fetch();
            invites.set(guild.id, new Map(guildInvites.map(invite => [invite.code, invite.uses])));
            console.log(`✅ Cached invites for guild: ${guild.name}`);
        }
        
        // Start lottery draw checker (check every minute)
        setInterval(() => {
            lotoCommand.checkDrawTime(client);
        }, 60000); // Check every minute
        
        console.log('✅ Bot is fully ready!');
    } catch (error) {
        console.error('❌ Error during initialization:', error);
    }
});

// Helper function to send duplicate invite notification
async function sendDuplicateInviteNotification(client, member, inviter) {
    const inviteChannelId = config.channels.inviteTracker;
    if (inviteChannelId) {
        try {
            const inviteChannel = await client.channels.fetch(inviteChannelId);
            if (inviteChannel) {
                await inviteChannel.send(
                    `🔴 L'invitation de ${inviter} pour ${member.user} n'a pas été comptée, car ${member.user} est déjà membre du serveur !`
                );
                console.log(`Sent duplicate invite notification to channel ${inviteChannelId}`);
            }
        } catch (error) {
            console.error('Error sending duplicate invite message:', error);
        }
    }
}

// Guild member add event (invite tracking)
client.on('guildMemberAdd', async (member) => {
    try {
        const guildId = member.guild.id;
        const cachedInvites = invites.get(guildId);
        const newInvites = await member.guild.invites.fetch();
        
        // Find which invite was used
        let usedInvite = null;
        for (const [code, invite] of newInvites) {
            const cachedUses = cachedInvites.get(code) || 0;
            if (invite.uses > cachedUses) {
                usedInvite = invite;
                break;
            }
        }
        
        // Update cache
        invites.set(guildId, new Map(newInvites.map(invite => [invite.code, invite.uses])));
        
        if (usedInvite && usedInvite.inviter) {
            const inviterId = usedInvite.inviter.id;
            const invitedId = member.id;
            
            // Debugging logs
            console.log(`Inviter ID: ${inviterId}, Invited ID: ${invitedId}`);
            console.log(`Verifying invitation from ${usedInvite.inviter.username} for ${member.user.username}`);
            
            // Don't track bot invites
            if (member.user.bot) return;
            
            // Get inviter member object for mentions
            const inviterMember = await member.guild.members.fetch(inviterId).catch(() => null);
            
            // Anti-cheat: Check if this invite already exists in history
            console.log(`Checking invite history for duplicates...`);
            const alreadyInvited = await db.checkInviteHistory(inviterId, invitedId);
            
            if (alreadyInvited) {
                console.log(`🚫 Duplicate invite blocked: ${usedInvite.inviter.username} -> ${member.user.username}`);
                await sendDuplicateInviteNotification(client, member, inviterMember || usedInvite.inviter);
                return;
            }
            
            console.log(`✅ Invite validation passed - invite is unique`);
            
            // Create or get inviter
            console.log(`Creating/fetching inviter user record...`);
            let inviter = await db.getUser(inviterId);
            if (!inviter) {
                inviter = await db.createUser(inviterId, usedInvite.inviter.username);
                console.log(`Created new inviter record for ${usedInvite.inviter.username}`);
            } else {
                console.log(`Found existing inviter record for ${usedInvite.inviter.username}`);
            }
            
            // Create or get invited user
            console.log(`Creating/fetching invited user record...`);
            let invited = await db.getUser(invitedId);
            if (!invited) {
                invited = await db.createUser(invitedId, member.user.username, inviterId);
                console.log(`Created new invited user record for ${member.user.username}`);
            } else {
                console.log(`Found existing invited user record for ${member.user.username}`);
            }
            
            // Anti-cheat: Add to invite history (double-check with unique constraint)
            console.log(`Adding invite to history table...`);
            const historyAdded = await db.addInviteHistory(inviterId, invitedId);
            
            if (!historyAdded) {
                // Race condition: invite was added between check and insert
                console.log(`🚫 Duplicate invite blocked (race condition): ${usedInvite.inviter.username} -> ${member.user.username}`);
                await sendDuplicateInviteNotification(client, member, inviterMember || usedInvite.inviter);
                return;
            }
            
            console.log(`✅ Invite successfully added to history`);
            
            // Increment inviter's invite count
            console.log(`Incrementing invite count for ${usedInvite.inviter.username}...`);
            await db.incrementInvites(inviterId);
            
            // Record the invite (legacy table)
            await db.recordInvite(inviterId, invitedId);
            
            // Reward both users with LC
            console.log(`Rewarding ${config.currency.inviteReward} LC to both users...`);
            await db.updateBalance(inviterId, config.currency.inviteReward);
            await db.updateBalance(invitedId, config.currency.inviteReward);
            
            // Record transactions
            await db.recordTransaction(null, inviterId, config.currency.inviteReward, 'invite_reward', 'Reward for inviting a member');
            await db.recordTransaction(null, invitedId, config.currency.inviteReward, 'invite_reward', 'Reward for joining via invite');
            
            // Get inviter's updated invite count after increment
            const inviterData = await db.getUser(inviterId);
            const totalInvites = inviterData ? inviterData.invites : 1;
            
            console.log(`✅ ${usedInvite.inviter.username} invited ${member.user.username} (unique invite)`);
            console.log(`   Total invites for ${usedInvite.inviter.username}: ${totalInvites}`);
            
            // Send invite tracking message to specific channel
            const inviteChannelId = config.channels.inviteTracker;
            if (inviteChannelId) {
                try {
                    const inviteChannel = await client.channels.fetch(inviteChannelId);
                    if (inviteChannel) {
                        
                        // Format message with emotes (try custom emojis, fallback to Unicode)
                        const invitePeopleEmote = client.emojis.cache.find(e => e.name === config.emotes.invitePeople) || '📨';
                        const boostGemsEmote = client.emojis.cache.find(e => e.name === config.emotes.boostGemsMonth) || '🔰';
                        
                        // Fix grammar for pluralization
                        const invitationText = totalInvites === 1 ? '1 invitation' : `${totalInvites} invitations`;
                        const messageContent = `${invitePeopleEmote} ${member.user} à rejoins l'équipe. Passe D de ${usedInvite.inviter} qui a maintenant ${invitationText}! ${boostGemsEmote}`;
                        
                        await inviteChannel.send(messageContent);
                    }
                } catch (error) {
                    console.error('Error sending invite tracking message:', error);
                }
            }
        }
    } catch (error) {
        console.error('Error tracking invite:', error);
    }
});

// Voice state update event (voice channel tracking)
client.on('voiceStateUpdate', async (oldState, newState) => {
    try {
        const userId = newState.id;
        const member = newState.member;
        
        // Ignore bot users
        if (member.user.bot) return;
        
        // User joined a voice channel
        if (!oldState.channelId && newState.channelId) {
            // Store join timestamp
            voiceSessions.set(userId, Date.now());
        }
        // User left a voice channel or switched channels
        else if (oldState.channelId && !newState.channelId) {
            // User left voice channel completely
            const joinTime = voiceSessions.get(userId);
            if (joinTime) {
                const timeSpent = Math.floor((Date.now() - joinTime) / 1000); // Convert to seconds
                
                // Only update if user spent at least 1 second
                if (timeSpent > 0) {
                    // Ensure user exists in database
                    let user = await db.getUser(userId);
                    if (!user) {
                        user = await db.createUser(userId, member.user.username);
                    }
                    
                    // Update voice time in database
                    await db.updateVoiceTime(userId, timeSpent);
                }
                
                // Remove from tracking
                voiceSessions.delete(userId);
            }
        }
        // User switched channels (moved from one voice channel to another)
        else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
            // Keep tracking - don't reset the timer when switching channels
            // This ensures continuous time tracking across channel switches
        }
    } catch (error) {
        // Throttle error logging to prevent log flooding
        if (shouldLogError('voice_tracking')) {
            console.error('Error tracking voice time (throttled - shown once per minute):', error.message);
        }
    }
});

// Message create event (command handling)
client.on('messageCreate', async (message) => {
    // Ignore bot messages
    if (message.author.bot) return;
    
    // Track message count for the user
    try {
        const userId = message.author.id;
        const username = message.author.username;
        
        // Ensure user exists
        let user = await db.getUser(userId);
        if (!user) {
            user = await db.createUser(userId, username);
        }
        
        // Use caching to reduce database load
        const currentCount = messageCountCache.get(userId) || 0;
        messageCountCache.set(userId, currentCount + 1);
        
        // Update database every MESSAGE_COUNT_BATCH_SIZE messages
        if (messageCountCache.get(userId) >= MESSAGE_COUNT_BATCH_SIZE) {
            const count = messageCountCache.get(userId);
            await db.incrementMessageCount(userId, count);
            messageCountCache.delete(userId);
        }
    } catch (error) {
        // Throttle error logging to prevent log flooding
        if (shouldLogError('message_tracking')) {
            console.error('Error tracking message (throttled - shown once per minute):', error.message);
        }
    }
    
    // Check if message starts with prefix
    if (!message.content.startsWith(config.prefix)) return;
    
    // Parse command and arguments
    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    try {
        // Handle commands
        if (commandName === 'lc') {
            const command = client.commands.get('lc');
            await command.execute(message, args);
        } else if (commandName === 'invites') {
            const command = client.commands.get('invites');
            await command.execute(message, args, client);
        } else if (commandName === 'jeu') {
            const command = client.commands.get('jeu');
            await command.execute(message, args);
        } else if (commandName === 'don') {
            const lcCommand = require('./commands/lc');
            await lcCommand.handleTransfer(message, args);
        } else if (commandName === 'cadeau') {
            const command = client.commands.get('cadeau');
            await command.execute(message, args);
        } else if (commandName === 'casino') {
            const command = client.commands.get('casino');
            await command.execute(message, args);
        } else if (commandName === 'roue') {
            const command = client.commands.get('casino');
            await command.handleRoue(message, args);
        } else if (commandName === 'bj') {
            const command = client.commands.get('casino');
            await command.handleBlackjack(message, args);
        } else if (commandName === 'machine') {
            const command = client.commands.get('casino');
            await command.handleMachine(message, args);
        } else if (commandName === 'setlc') {
            const command = client.commands.get('moderation');
            await command.execute(message, args, 'setlc');
        } else if (commandName === 'setinvites') {
            const command = client.commands.get('moderation');
            await command.execute(message, args, 'setinvites');
        } else if (commandName === 'topinvites') {
            const invitesCommand = require('./commands/invites');
            await invitesCommand.handleTopInvites(message, args);
        } else if (commandName === 'stats') {
            const command = client.commands.get('stats');
            await command.execute(message, args);
        } else if (commandName === 'loto') {
            const command = client.commands.get('loto');
            await command.execute(message, args);
        } else if (commandName === 'help' || commandName === 'aide') {
            await showHelp(message);
        }
    } catch (error) {
        console.error('Error executing command:', error);
        message.reply(getResponse('errors.commandExecutionError')).catch(console.error);
    }
});

// Help command
async function showHelp(message) {
    const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle(getResponse('help.title'))
        .setDescription(getResponse('help.description'))
        .addFields(
            {
                name: getResponse('help.sections.lc.title'),
                value: getResponse('help.sections.lc.commands'),
                inline: false
            },
            {
                name: getResponse('help.sections.invites.title'),
                value: getResponse('help.sections.invites.commands'),
                inline: false
            },
            {
                name: getResponse('help.sections.stats.title'),
                value: getResponse('help.sections.stats.commands'),
                inline: false
            },
            {
                name: getResponse('help.sections.games.title'),
                value: getResponse('help.sections.games.commands'),
                inline: false
            },
            {
                name: getResponse('help.sections.casino.title'),
                value: getResponse('help.sections.casino.commands'),
                inline: false
            },
            {
                name: getResponse('help.sections.moderation.title'),
                value: getResponse('help.sections.moderation.commands'),
                inline: false
            }
        )
        .setFooter({ text: getResponse('help.footer') })
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
}

// Error handling
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
    console.log('\n⏹️ Received SIGINT, shutting down gracefully...');
    await shutdown();
});

process.on('SIGTERM', async () => {
    console.log('\n⏹️ Received SIGTERM, shutting down gracefully...');
    await shutdown();
});

async function shutdown() {
    try {
        console.log('👋 Logging out from Discord...');
        client.destroy();
        
        console.log('🔌 Closing database connections...');
        
        // Flush any active voice sessions before shutdown
        if (voiceSessions.size > 0) {
            console.log(`⏰ Flushing ${voiceSessions.size} active voice sessions...`);
            const voiceFlushPromises = Array.from(voiceSessions.entries()).map(async ([userId, joinTime]) => {
                try {
                    const timeSpent = Math.floor((Date.now() - joinTime) / 1000);
                    if (timeSpent > 0) {
                        await db.updateVoiceTime(userId, timeSpent);
                    }
                } catch (error) {
                    console.error(`Error flushing voice time for user ${userId}:`, error.message);
                }
            });
            
            await Promise.allSettled(voiceFlushPromises);
            voiceSessions.clear();
            console.log('✅ Voice sessions flushed');
        }
        
        // Flush any cached message counts before shutdown (with timeout)
        const flushPromises = Array.from(messageCountCache.entries()).map(async ([userId, count]) => {
            try {
                await db.incrementMessageCount(userId, count);
            } catch (error) {
                console.error(`Error flushing message count for user ${userId}:`, error.message);
            }
        });
        
        // Wait for all flushes with a timeout to prevent hanging
        const flushTimeout = new Promise(resolve => {
            setTimeout(() => {
                console.warn('⚠️ Cache flush timeout reached, proceeding with shutdown...');
                resolve('timeout');
            }, 3000);
        });
        
        const result = await Promise.race([
            Promise.allSettled(flushPromises).then(() => 'completed'),
            flushTimeout
        ]);
        
        if (result === 'completed') {
            console.log('✅ Cache flushed successfully');
        }
        messageCountCache.clear();
        
        await db.close();
        
        console.log('✅ Shutdown complete');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
}

// Login to Discord
client.login(process.env.DISCORD_TOKEN).catch(error => {
    console.error('❌ Failed to login to Discord:', error);
    process.exit(1);
});
