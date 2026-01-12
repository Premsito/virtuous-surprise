require('dotenv').config();
const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const { db } = require('./database/db');
const config = require('./config.json');
const { getResponse } = require('./utils/responseHelper');
const { getMessageXP, canGrantMessageXP, getLevelFromXP, getVoiceXP, getReactionXP, XP_CONFIG, getXPProgress } = require('./utils/xpHelper');
const { calculateLevelReward, formatRewardEmbed } = require('./utils/rewardHelper');
const rankingsManager = require('./utils/rankingsManager');

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
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessageReactions
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
const menuCommand = require('./commands/menu');
const rapideCommand = require('./commands/rapide');
const pfcCommand = require('./commands/pfc');
const quizCommand = require('./commands/quiz');
const quizduoCommand = require('./commands/quizduo');
const c21Command = require('./commands/c21');
const game007Command = require('./commands/007');
const sacCommand = require('./commands/sac');
const niveauCommand = require('./commands/niveau');
const giveawayCommand = require('./commands/giveaway');
const rankingsCommand = require('./commands/rankings');

client.commands.set(lcCommand.name, lcCommand);
client.commands.set(invitesCommand.name, invitesCommand);
client.commands.set(jeuCommand.name, jeuCommand);
client.commands.set(moderationCommand.name, moderationCommand);
client.commands.set(statsCommand.name, statsCommand);
client.commands.set(cadeauCommand.name, cadeauCommand);
client.commands.set(casinoCommand.name, casinoCommand);
client.commands.set(lotoCommand.name, lotoCommand);
client.commands.set(menuCommand.name, menuCommand);
client.commands.set(rapideCommand.name, rapideCommand);
client.commands.set(pfcCommand.name, pfcCommand);
client.commands.set(quizCommand.name, quizCommand);
client.commands.set(quizduoCommand.name, quizduoCommand);
client.commands.set(c21Command.name, c21Command);
client.commands.set(game007Command.name, game007Command);
client.commands.set(sacCommand.name, sacCommand);
client.commands.set(niveauCommand.name, niveauCommand);
client.commands.set(giveawayCommand.name, giveawayCommand);
client.commands.set(rankingsCommand.name, rankingsCommand);


// Store invites for tracking
const invites = new Map();

// Message count cache to reduce database load
const messageCountCache = new Map();
const MESSAGE_COUNT_BATCH_SIZE = 10; // Update DB every 10 messages

// Voice session tracking to calculate time spent in voice channels
const voiceSessions = new Map(); // Maps userId to join timestamp

// Voice XP tracking - Maps userId to XP session info
const voiceXPSessions = new Map(); // Maps userId to { sessionId, lastXPGrant, totalMinutes }

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

/**
 * Send level-up notification embed (pancarte) to the designated channel
 * @param {Client} client - Discord client
 * @param {string} userId - User ID who leveled up
 * @param {Object} user - Discord user object
 * @param {number} newLevel - New level reached
 * @param {number} totalXP - Total XP
 * @param {object} rewardInfo - Reward information object from calculateLevelReward
 */
async function sendLevelUpCard(client, userId, user, newLevel, totalXP, rewardInfo) {
    try {
        const levelUpChannelId = config.channels.levelUpNotification;
        const levelUpChannel = await client.channels.fetch(levelUpChannelId);
        
        if (levelUpChannel) {
            // Get XP progress for the new level
            const progress = getXPProgress(totalXP);
            
            // Determine embed color based on reward type
            let embedColor = config.colors.primary;
            if (rewardInfo.type === 'milestone') {
                embedColor = config.colors.gold; // Golden for milestone rewards
            } else if (rewardInfo.type === 'boost') {
                embedColor = rewardInfo.boost.type === 'xp' ? config.colors.warning : config.colors.success;
            }
            
            // Create the embed pancarte
            const embed = new EmbedBuilder()
                .setColor(embedColor)
                .setTitle('🎉 Félicitations 🎉')
                .setDescription(`**Tu as atteint le Niveau ${newLevel}** 🏆`)
                .setThumbnail(user.displayAvatarURL({ size: 256 }))
                .addFields(
                    {
                        name: '📊 Progression XP',
                        value: `${progress.currentLevelXP} / ${progress.nextLevelXP} XP (${progress.progress}%)`,
                        inline: true
                    },
                    {
                        name: '🎁 Récompense',
                        value: rewardInfo.description,
                        inline: true
                    }
                )
                .setTimestamp();
            
            // Add special message for milestone levels
            if (rewardInfo.type === 'milestone') {
                const nextMilestone = Math.ceil((newLevel + 1) / 5) * 5;
                embed.setFooter({ 
                    text: `Continue jusqu'au niveau ${nextMilestone} pour le prochain trésor ! 💎` 
                });
            } else {
                embed.setFooter({ 
                    text: '💡 Les !missions permettent de gagner de l\'XP et des LC !' 
                });
            }
            
            // Send with mention
            await levelUpChannel.send({
                content: `<@${userId}>`,
                embeds: [embed]
            });
            
            console.log(`✅ Sent level-up pancarte for ${user.username} (Level ${newLevel})`);
        }
    } catch (error) {
        console.error('Error sending level up pancarte:', error.message);
        console.error('  Channel ID:', config.channels.levelUpNotification);
        console.error('  User:', userId);
        // Fallback to text notification
        try {
            const levelUpChannel = await client.channels.fetch(config.channels.levelUpNotification);
            if (levelUpChannel) {
                await levelUpChannel.send(
                    `🎉 **Bravo <@${userId}>** 🎉\n` +
                    `Tu as atteint le **Niveau ${newLevel}** 🏆 !\n` +
                    `💝 Récompense : **${rewardInfo.description}** 🚀 !`
                );
            }
        } catch (fallbackError) {
            console.error('Error sending fallback level up notification:', fallbackError.message);
        }
    }
}

/**
 * Handle level-up rewards and notifications
 * @param {Client} client - Discord client
 * @param {string} userId - User ID who leveled up
 * @param {Object} user - Discord user object
 * @param {number} newLevel - New level reached
 * @param {number} totalXP - Total XP
 */
async function handleLevelUp(client, userId, user, newLevel, totalXP) {
    try {
        // Calculate reward for this level
        const reward = calculateLevelReward(newLevel);
        
        // Apply LC reward if applicable
        if (reward.lcAmount > 0) {
            await db.updateBalance(userId, reward.lcAmount, 'level_up');
            await db.recordTransaction(null, userId, reward.lcAmount, 'level_up', `Niveau ${newLevel} atteint`);
        }
        
        // Apply boost if applicable
        if (reward.boost) {
            await db.activateBoost(userId, reward.boost.type, reward.boost.multiplier, reward.boost.duration);
            console.log(`✅ Activated ${reward.boost.type.toUpperCase()} x${reward.boost.multiplier} boost for ${user.username} (${reward.boost.duration}s)`);
        }
        
        // Send level-up notification with reward object
        await sendLevelUpCard(client, userId, user, newLevel, totalXP, reward);
        
    } catch (error) {
        console.error('Error handling level up:', error.message);
    }
}

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
        
        // Start lottery draw checker with smart scheduling
        async function scheduleLotteryCheck() {
            try {
                const lotteryState = await db.getLotteryState();
                if (lotteryState) {
                    const now = new Date();
                    const drawTime = new Date(lotteryState.next_draw_time);
                    const msUntilDraw = drawTime.getTime() - now.getTime();
                    
                    // If draw time has passed, check immediately
                    if (msUntilDraw <= 0) {
                        await lotoCommand.checkDrawTime(client);
                        // Reschedule for next draw
                        setTimeout(scheduleLotteryCheck, 60000);
                    } else if (msUntilDraw < 60000) {
                        // If less than 1 minute away, wait and then check
                        setTimeout(async () => {
                            await lotoCommand.checkDrawTime(client);
                            scheduleLotteryCheck();
                        }, msUntilDraw + 1000);
                    } else {
                        // Otherwise, check in 1 hour or when close to draw time
                        const checkInterval = Math.min(msUntilDraw - 60000, 3600000); // Check 1 minute before or every hour
                        setTimeout(scheduleLotteryCheck, checkInterval);
                    }
                }
            } catch (error) {
                console.error('Error scheduling lottery check:', error);
                // Retry in 1 minute on error
                setTimeout(scheduleLotteryCheck, 60000);
            }
        }
        
        // Start the lottery scheduler
        scheduleLotteryCheck();
        
        // Start voice XP grant checker (every 2 minutes)
        setInterval(async () => {
            try {
                // Process each active voice XP session
                const sessionPromises = Array.from(voiceXPSessions.entries()).map(async ([userId, xpSession]) => {
                    try {
                        const now = Date.now();
                        const lastGrant = new Date(xpSession.lastXPGrant).getTime();
                        const timeSinceLastGrant = now - lastGrant;
                        
                        // Check if 2 minutes have passed
                        if (timeSinceLastGrant >= XP_CONFIG.VOICE_XP_INTERVAL_MS) {
                            // Find the user in voice channels using cached guild data
                            let userInVoice = null;
                            let channelMemberCount = 0;
                            
                            for (const guild of client.guilds.cache.values()) {
                                // Use cache instead of fetching
                                const member = guild.members.cache.get(userId);
                                if (member && member.voice.channelId) {
                                    userInVoice = member;
                                    channelMemberCount = member.voice.channel.members.filter(m => !m.user.bot).size;
                                    break;
                                }
                            }
                            
                            if (userInVoice && channelMemberCount >= XP_CONFIG.VOICE_MIN_USERS) {
                                // Calculate XP based on user count
                                const xpGained = getVoiceXP(channelMemberCount);
                                
                                // Update total minutes
                                const minutesElapsed = Math.floor(timeSinceLastGrant / 60000);
                                const newTotalMinutes = xpSession.totalMinutes + minutesElapsed;
                                
                                // Grant XP
                                let user = await db.getUser(userId);
                                if (!user) {
                                    user = await db.createUser(userId, userInVoice.user.username);
                                }
                                
                                const oldLevel = getLevelFromXP(user.xp || 0);
                                const updatedUser = await db.addXP(userId, xpGained);
                                const newLevel = getLevelFromXP(updatedUser.xp);
                                
                                // Check for hourly bonus (60 minutes)
                                if (newTotalMinutes >= 60 && xpSession.totalMinutes < 60) {
                                    await db.addXP(userId, XP_CONFIG.VOICE_HOUR_BONUS);
                                    console.log(`Granted hourly voice bonus to ${userId}: ${XP_CONFIG.VOICE_HOUR_BONUS} XP`);
                                }
                                
                                // Update session tracking
                                const nowDate = new Date();
                                await db.updateVoiceXPSession(xpSession.sessionId, nowDate, newTotalMinutes);
                                xpSession.lastXPGrant = nowDate;
                                xpSession.totalMinutes = newTotalMinutes;
                                
                                // Check for level up
                                if (newLevel > oldLevel) {
                                    await db.updateLevel(userId, newLevel);
                                    
                                    // Handle level-up rewards
                                    await handleLevelUp(client, userId, userInVoice.user, newLevel, updatedUser.xp);
                                }
                            }
                        }
                    } catch (sessionError) {
                        console.error(`Error processing voice XP for user ${userId}:`, sessionError.message);
                    }
                });
                
                // Wait for all sessions to be processed
                await Promise.allSettled(sessionPromises);
            } catch (error) {
                if (shouldLogError('voice_xp_grant')) {
                    console.error('Error granting voice XP (throttled):', error.message);
                }
            }
        }, XP_CONFIG.VOICE_XP_INTERVAL_MS);
        
        // Initialize dynamic rankings manager
        await rankingsManager.initialize(client, rankingsCommand);
        console.log('✅ Dynamic LC rankings synchronization enabled');
        
        // Start rankings auto-update (every 5 minutes)
        const RANKINGS_UPDATE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes in milliseconds
        const RANKINGS_RETRY_DELAY_MS = 30 * 1000; // 30 seconds retry delay on error
        const RANKINGS_MAX_RETRIES = 3; // Maximum retry attempts per update cycle
        
        console.log(`⏰ Rankings auto-update interval configured: 5 minutes (${RANKINGS_UPDATE_INTERVAL_MS}ms)`);
        console.log(`   - Retry delay on error: ${RANKINGS_RETRY_DELAY_MS / 1000} seconds`);
        console.log(`   - Max retries per cycle: ${RANKINGS_MAX_RETRIES}`);
        
        /**
         * Update rankings with retry logic
         * @param {number} retryCount - Current retry attempt number
         */
        async function updateRankingsWithRetry(retryCount = 0) {
            try {
                const now = new Date();
                console.log(`\n${'='.repeat(60)}`);
                console.log(`🔄 [${now.toISOString()}] Starting scheduled rankings update...`);
                console.log(`   Interval: Every 5 minutes`);
                if (retryCount > 0) {
                    console.log(`   Retry attempt: ${retryCount}/${RANKINGS_MAX_RETRIES}`);
                }
                console.log(`${'='.repeat(60)}\n`);
                
                await rankingsCommand.updateRankingsChannel(client);
                
                const completedAt = new Date();
                console.log(`\n✅ [${completedAt.toISOString()}] Scheduled rankings update completed`);
                console.log(`   Duration: ${completedAt - now}ms`);
                console.log(`   Next update: ${new Date(completedAt.getTime() + RANKINGS_UPDATE_INTERVAL_MS).toISOString()}\n`);
            } catch (error) {
                const errorTime = new Date();
                console.error(`\n❌ [${errorTime.toISOString()}] Error updating rankings:`, error.message);
                console.error('   Error type:', error.name);
                console.error('   Stack:', error.stack);
                
                // Retry logic for transient errors
                if (retryCount < RANKINGS_MAX_RETRIES) {
                    const nextRetry = retryCount + 1;
                    console.log(`⏰ [RETRY] Scheduling retry ${nextRetry}/${RANKINGS_MAX_RETRIES} in ${RANKINGS_RETRY_DELAY_MS / 1000} seconds...`);
                    
                    setTimeout(async () => {
                        await updateRankingsWithRetry(nextRetry);
                    }, RANKINGS_RETRY_DELAY_MS);
                } else {
                    console.error(`❌ [FAILED] Max retries (${RANKINGS_MAX_RETRIES}) reached. Will try again on next scheduled interval.`);
                    console.error(`   Next attempt: ${new Date(errorTime.getTime() + RANKINGS_UPDATE_INTERVAL_MS).toISOString()}`);
                }
            }
        }
        
        // Set up the interval for rankings updates
        setInterval(() => {
            updateRankingsWithRetry(0).catch(err => {
                console.error('❌ Unhandled error in rankings update interval:', err.message);
            });
        }, RANKINGS_UPDATE_INTERVAL_MS);
        
        // Initial rankings update
        setTimeout(() => {
            let retryCount = 0;
            const maxInitialRetries = 3;
            
            async function displayInitialRankings() {
                try {
                    console.log('\n🎯 Displaying initial rankings (5 seconds after bot ready)...');
                    if (retryCount > 0) {
                        console.log(`   Retry attempt: ${retryCount}/${maxInitialRetries}`);
                    }
                    
                    await rankingsCommand.updateRankingsChannel(client);
                    console.log('✅ Initial rankings displayed successfully\n');
                } catch (error) {
                    console.error('❌ Error displaying initial rankings:', error.message);
                    console.error('   Stack:', error.stack);
                    
                    // Retry for initial display
                    if (retryCount < maxInitialRetries) {
                        retryCount++;
                        console.log(`⏰ Retrying initial rankings display in 10 seconds... (${retryCount}/${maxInitialRetries})`);
                        setTimeout(() => {
                            displayInitialRankings().catch(err => {
                                console.error('❌ Unhandled error in retry:', err.message);
                            });
                        }, 10000);
                    } else {
                        console.error(`❌ Failed to display initial rankings after ${maxInitialRetries} attempts.`);
                        console.error('   Rankings will be updated on next scheduled interval.');
                    }
                }
            }
            
            // Start initial display with error handling
            displayInitialRankings().catch(err => {
                console.error('❌ Unhandled error in initial rankings display:', err.message);
            });
        }, 5000); // Wait 5 seconds after bot ready to ensure everything is initialized
        
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
            await db.updateBalance(inviterId, config.currency.inviteReward, 'invite_reward');
            await db.updateBalance(invitedId, config.currency.inviteReward, 'invite_joined');
            
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
            
            // Start XP tracking session
            const now = new Date();
            const session = await db.createVoiceXPSession(userId, now);
            voiceXPSessions.set(userId, {
                sessionId: session.id,
                lastXPGrant: now,
                totalMinutes: 0
            });
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
            
            // Clean up XP tracking session
            const xpSession = voiceXPSessions.get(userId);
            if (xpSession) {
                await db.deleteVoiceXPSession(xpSession.sessionId);
                voiceXPSessions.delete(userId);
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

// Reaction add event (XP tracking)
client.on('messageReactionAdd', async (reaction, user) => {
    try {
        // Ignore bot reactions
        if (user.bot) return;
        
        // Fetch the message if it's partial
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Error fetching reaction:', error);
                return;
            }
        }
        
        // Get the message author
        const messageAuthor = reaction.message.author;
        if (!messageAuthor || messageAuthor.bot) return;
        
        const messageId = reaction.message.id;
        const authorId = messageAuthor.id;
        
        // Get or create message reaction XP tracking
        let messageReactionData = await db.getMessageReactionXP(messageId);
        const currentXP = messageReactionData ? messageReactionData.xp_earned : 0;
        
        // Check if we can still grant XP (max 10 XP per message)
        if (currentXP >= XP_CONFIG.REACTION_MAX_PER_MESSAGE) {
            return; // Already at max XP for this message
        }
        
        // Calculate XP to grant
        const xpToGrant = getReactionXP(1, currentXP);
        
        if (xpToGrant > 0) {
            // Ensure user exists
            let authorUser = await db.getUser(authorId);
            if (!authorUser) {
                authorUser = await db.createUser(authorId, messageAuthor.username);
            }
            
            // Grant XP to message author
            const oldLevel = getLevelFromXP(authorUser.xp || 0);
            const updatedUser = await db.addXP(authorId, xpToGrant);
            const newLevel = getLevelFromXP(updatedUser.xp);
            
            // Update message reaction XP tracking
            if (messageReactionData) {
                await db.updateMessageReactionXP(messageId, xpToGrant);
            } else {
                await db.createMessageReactionXP(messageId, authorId, xpToGrant);
            }
            
            // Check for level up
            if (newLevel > oldLevel) {
                await db.updateLevel(authorId, newLevel);
                
                // Handle level-up rewards
                await handleLevelUp(client, authorId, messageAuthor, newLevel, updatedUser.xp);
            }
        }
    } catch (error) {
        if (shouldLogError('reaction_xp')) {
            console.error('Error granting reaction XP (throttled):', error.message);
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

        // XP System: Grant XP for message activity (with anti-spam)
        if (canGrantMessageXP(user.last_message_xp_time)) {
            const xpGained = getMessageXP();
            const oldLevel = getLevelFromXP(user.xp || 0);
            
            // Grant XP
            const updatedUser = await db.addXP(userId, xpGained);
            await db.updateLastMessageXPTime(userId, new Date());
            
            const newLevel = getLevelFromXP(updatedUser.xp);
            
            // Check for level up
            if (newLevel > oldLevel) {
                await db.updateLevel(userId, newLevel);
                
                // Handle level-up rewards
                await handleLevelUp(client, userId, message.author, newLevel, updatedUser.xp);
            }
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
        } else if (commandName === 'giveitem' || commandName === 'givebonus') {
            const command = client.commands.get('moderation');
            await command.execute(message, args, 'giveitem');
        } else if (commandName === 'topinvites') {
            const invitesCommand = require('./commands/invites');
            await invitesCommand.handleTopInvites(message, args);
        } else if (commandName === 'stats') {
            const command = client.commands.get('stats');
            await command.execute(message, args);
        } else if (commandName === 'loto') {
            const command = client.commands.get('loto');
            await command.execute(message, args);
        } else if (commandName === 'menu') {
            const command = client.commands.get('menu');
            await command.execute(message, args);
        } else if (commandName === 'rapide') {
            const command = client.commands.get('rapide');
            await command.execute(message, args);
        } else if (commandName === 'quizduo') {
            const command = client.commands.get('quizduo');
            await command.execute(message, args);
        } else if (commandName === 'pfc') {
            const command = client.commands.get('pfc');
            await command.execute(message, args);
        } else if (commandName === '007') {
            const command = client.commands.get('007');
            await command.execute(message, args);
        } else if (commandName === 'sac') {
            const command = client.commands.get('sac');
            await command.execute(message, args);
        } else if (commandName === 'niveau') {
            const command = client.commands.get('niveau');
            await command.execute(message, args);
        } else if (commandName === 'giveaway') {
            const command = client.commands.get('giveaway');
            await command.execute(message, args);
        } else if (commandName === 'rankings' || commandName === 'classement') {
            const command = client.commands.get('rankings');
            await command.execute(message, args);
        } else if (commandName === 'help' || commandName === 'aide') {
            await showHelp(message);
        }
    } catch (error) {
        console.error('Error executing command:', error);
        message.reply(getResponse('errors.commandExecutionError')).catch(console.error);
    }
});

// Button interaction handler for inventory items
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    // Handle inventory button interactions
    const inventoryButtons = ['use_tresor', 'use_multiplier_x2', 'use_multiplier_x3'];
    if (inventoryButtons.includes(interaction.customId)) {
        const sacCommand = require('./commands/sac');
        await sacCommand.handleButtonInteraction(interaction);
    }

    // Handle giveaway button interactions (both participation and menu)
    if (interaction.customId.startsWith('giveaway_join_') || interaction.customId.startsWith('giveaway_menu_')) {
        await giveawayCommand.handleButtonInteraction(interaction);
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
                name: getResponse('help.sections.menu.title'),
                value: getResponse('help.sections.menu.commands'),
                inline: false
            },
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
                name: getResponse('help.sections.loto.title'),
                value: getResponse('help.sections.loto.commands'),
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
        
        // Cleanup rankings manager
        console.log('🔌 Cleaning up rankings manager...');
        rankingsManager.destroy();
        
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
