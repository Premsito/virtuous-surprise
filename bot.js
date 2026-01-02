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
        GatewayIntentBits.GuildInvites
    ]
});

// Load commands
client.commands = new Collection();
const lcCommand = require('./commands/lc');
const invitesCommand = require('./commands/invites');
const jeuCommand = require('./commands/jeu');
const moderationCommand = require('./commands/moderation');
const statsCommand = require('./commands/stats');

client.commands.set(lcCommand.name, lcCommand);
client.commands.set(invitesCommand.name, invitesCommand);
client.commands.set(jeuCommand.name, jeuCommand);
client.commands.set(moderationCommand.name, moderationCommand);
client.commands.set(statsCommand.name, statsCommand);

// Store invites for tracking
const invites = new Map();

// Message count cache to reduce database load
const messageCountCache = new Map();
const MESSAGE_COUNT_BATCH_SIZE = 10; // Update DB every 10 messages

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
        
        console.log('✅ Bot is fully ready!');
    } catch (error) {
        console.error('❌ Error during initialization:', error);
    }
});

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
            
            // Don't track bot invites
            if (member.user.bot) return;
            
            // Create or get inviter
            let inviter = await db.getUser(inviterId);
            if (!inviter) {
                inviter = await db.createUser(inviterId, usedInvite.inviter.username);
            }
            
            // Create or get invited user
            let invited = await db.getUser(invitedId);
            if (!invited) {
                invited = await db.createUser(invitedId, member.user.username, inviterId);
            }
            
            // Increment inviter's invite count
            await db.incrementInvites(inviterId);
            
            // Record the invite
            await db.recordInvite(inviterId, invitedId);
            
            // Reward both users with LC
            await db.updateBalance(inviterId, config.currency.inviteReward);
            await db.updateBalance(invitedId, config.currency.inviteReward);
            
            // Record transactions
            await db.recordTransaction(null, inviterId, config.currency.inviteReward, 'invite_reward', 'Reward for inviting a member');
            await db.recordTransaction(null, invitedId, config.currency.inviteReward, 'invite_reward', 'Reward for joining via invite');
            
            // Get inviter's updated invite count after increment
            const inviterData = await db.getUser(inviterId);
            const totalInvites = inviterData ? inviterData.invites : 1;
            
            console.log(`✅ ${usedInvite.inviter.username} invited ${member.user.username}`);
            
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
                        const messageContent = `${invitePeopleEmote} ${member.user} joins the team. Credit to ${usedInvite.inviter} who now has ${invitationText}! ${boostGemsEmote}`;
                        
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
