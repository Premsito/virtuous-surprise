const { EmbedBuilder } = require('discord.js');
const { db } = require('../database/db');
const config = require('../config.json');
const { isAdmin } = require('../utils/adminHelper');

// Error message constants
const ERROR_MESSAGES = {
    CRITICAL_DISPLAY_ERROR: 'Critical error in ranking display:',
    USER_ERROR_MESSAGE: '⛔ Une erreur critique est survenue. Contactez un administrateur.',
    USER_UPDATE_ERROR_MESSAGE: 'Une erreur critique est survenue lors de la mise à jour du classement. Contactez un administrateur.'
};

module.exports = {
    name: 'rankings',
    description: 'Display LC and Level rankings with podiums (Admin only)',
    
    // Track the last posted rankings message for cleanup (module-level cache)
    // Note: This is also persisted to database for recovery after restarts
    lastRankingsMessage: null,
    
    // Flag to track if we've loaded the message from DB
    hasLoadedFromDB: false,
    
    async execute(message, args) {
        try {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`📊 [MANUAL] Rankings command called by ${message.author.username} (${message.author.id})`);
            console.log(`   - Timestamp: ${new Date().toISOString()}`);
            console.log(`   - Channel: #${message.channel.name} (${message.channel.id})`);
            console.log(`${'='.repeat(60)}\n`);
            
            // Check if user has admin permissions
            if (!isAdmin(message.author.id)) {
                console.log(`   ❌ Permission denied - user is not an admin`);
                return message.reply('❌ Cette commande est réservée aux administrateurs.');
            }
            
            console.log(`   ✅ Permission granted - displaying rankings manually`);
            const startTime = Date.now();
            await this.displayRankings(message.channel);
            const duration = Date.now() - startTime;
            
            // Delete the command message to keep the channel clean
            await message.delete().catch(() => {});
            console.log(`\n✅ [MANUAL] Rankings command completed successfully`);
            console.log(`   - Duration: ${duration}ms`);
            console.log(`   - Timestamp: ${new Date().toISOString()}\n`);
        } catch (error) {
            console.error('\n❌ [ERROR] Error displaying rankings via manual command');
            console.error('   User:', message.author.username);
            console.error('   User ID:', message.author.id);
            console.error('   Channel:', message.channel.id);
            console.error('   Error:', error.message);
            console.error('   Stack:', error.stack);
            await message.reply('❌ Une erreur est survenue lors de l\'affichage des classements.');
        }
    },

    /**
     * Create a ranking embed with medals and user info
     * @param {Array} users - Array of user objects
     * @param {string} title - Embed title
     * @param {string} color - Embed color
     * @param {Function} valueFormatter - Function to format user value
     * @param {Guild} guild - Discord guild
     * @returns {EmbedBuilder} - Formatted embed
     */
    async createRankingEmbed(users, title, color, valueFormatter, guild) {
        const embed = new EmbedBuilder()
            .setTitle(`🏆 ${title}`)
            .setColor(color)
            .setTimestamp()
            .setFooter({ text: 'Mise à jour automatique toutes les 5 minutes' });
        
        // Handle empty rankings
        if (!users || users.length === 0) {
            embed.setDescription('Aucun classement disponible pour l\'instant.');
            return embed;
        }
        
        // Build ranking description with proper alignment and formatting
        let description = '';
        const medals = ['🥇', '🥈', '🥉'];
        
        for (let i = 0; i < users.length && i < 10; i++) {
            const user = users[i];
            
            // Use Discord mention format for better user experience and performance (no API calls needed)
            const userMention = user.user_id ? `<@${user.user_id}>` : user.username;
            const value = valueFormatter(user);
            
            // Position indicator (medal for top 3, number for rest)
            const position = i < 3 ? medals[i] : `**${i + 1}.**`;
            
            // Add visual emphasis for top 3 using bold and different formatting
            if (i === 0) {
                // 1st place: Bold mention and value with special formatting
                description += `${position} **${userMention}** • **${value}**\n`;
            } else if (i === 1) {
                // 2nd place: Bold mention with emphasis
                description += `${position} **${userMention}** • **${value}**\n`;
            } else if (i === 2) {
                // 3rd place: Bold mention
                description += `${position} **${userMention}** • ${value}\n`;
            } else {
                // 4-10: Regular formatting
                description += `${position} ${userMention} • ${value}\n`;
            }
        }
        
        embed.setDescription(description);
        
        // Set thumbnail to first place user's avatar
        if (users.length > 0 && users[0].user_id) {
            const firstUser = users[0];
            // Fetch only the first place user for avatar
            const firstMember = await guild.members.fetch(firstUser.user_id).catch((err) => {
                console.log('   ⚠️ Could not fetch first place user for avatar:', err.message);
                return null;
            });
            if (firstMember) {
                embed.setThumbnail(firstMember.displayAvatarURL({ extension: 'png', size: 128 }));
            }
        }
        
        return embed;
    },

    /**
     * Display the rankings in a channel
     * @param {TextChannel} channel - The channel to display rankings in
     * @returns {Promise<Message|null>} The sent message, or null if an error occurred or no data available
     */
    async displayRankings(channel) {
        try {
            // Channel validation logging as requested in problem statement
            console.log(`📊 [DISPLAY] Displaying rankings for channel: ${channel.id}`);
            console.log(`   📝 Channel Name: ${channel.name}`);
            console.log(`   📝 Channel Type: ${channel.type}`);
            console.log(`   📝 Guild: ${channel.guild?.name || 'N/A'}`);
            
            // Ensure we have a guild context (rankings only work in guilds, not DMs)
            if (!channel.guild) {
                console.error('   ❌ [ERROR] Channel is not in a guild context');
                await channel.send('❌ Cette commande ne fonctionne que dans un serveur.');
                return null;
            }
            
            // Get top 10 users by LC and Level (no minimum threshold filtering)
            console.log('📊 [DATABASE] Fetching top 10 LC rankings from database...');
            const topLC = await db.getTopLC(10);
            console.log(`   ✅ Successfully fetched ${topLC.length} LC rankings`);
            if (topLC.length > 0) {
                console.log(`   📝 Top 3 LC Rankings:`);
                topLC.slice(0, 3).forEach((u, idx) => {
                    console.log(`      ${idx + 1}. ${u.username} (${u.user_id}): ${u.balance} LC`);
                });
            }
            
            console.log('📊 [DATABASE] Fetching top 10 Niveau rankings from database...');
            const topLevels = await db.getTopLevels(10);
            console.log(`   ✅ Successfully fetched ${topLevels.length} Niveau rankings`);
            if (topLevels.length > 0) {
                console.log(`   📝 Top 3 Niveau Rankings:`);
                topLevels.slice(0, 3).forEach((u, idx) => {
                    console.log(`      ${idx + 1}. ${u.username} (${u.user_id}): Niveau ${u.level} (${u.xp} XP)`);
                });
            }
            
            // Check if there's any ranking data available
            if (topLC.length === 0 && topLevels.length === 0) {
                console.log(`   ⚠️ [WARNING] No ranking data available`);
                await channel.send('Aucun classement n\'est disponible pour l\'instant.');
                return null;
            }

            // Create ranking embeds
            console.log('🎨 [EMBEDS] Creating ranking embeds...');
            
            const lcEmbed = await this.createRankingEmbed(
                topLC,
                '💰 Classement LC - Top 10',
                config.colors.gold,
                (user) => `${user.balance} LC`,
                channel.guild
            );
            console.log('   ✅ LC embed created');
            
            const levelEmbed = await this.createRankingEmbed(
                topLevels,
                '📊 Classement Niveaux - Top 10',
                config.colors.primary,
                (user) => `Niveau ${user.level}`,
                channel.guild
            );
            console.log('   ✅ Niveau embed created');
            
            // Send both embeds together
            console.log('📤 [SEND] Sending ranking embeds to channel...');
            const sentMessage = await channel.send({ 
                content: '🏆 **Classements Discord** 🏆',
                embeds: [lcEmbed, levelEmbed] 
            });
            
            console.log('✅ [SUCCESS] Ranking embeds sent successfully');
            console.log(`   📝 Message ID: ${sentMessage.id}`);
            return sentMessage;

        } catch (error) {
            console.error(ERROR_MESSAGES.CRITICAL_DISPLAY_ERROR, error);
            console.error('   Error Type:', error.name);
            console.error('   Channel ID:', channel?.id);
            console.error('   Channel Name:', channel?.name);
            console.error('   Timestamp:', new Date().toISOString());
            console.error('   Stack:', error.stack);
            
            // Send helpful error message to the channel with error details
            try {
                await channel.send(`⛔ Une erreur critique est survenue : ${error.message}\n\nContactez un administrateur si le problème persiste.`);
            } catch (sendError) {
                console.error('   ❌ [ERROR] Failed to send error message to channel:', sendError.message);
            }
            throw error;
        }
    },

    /**
     * Load the last rankings message from database and cache it in memory
     * This is called on bot startup to recover message tracking after restarts
     * @param {Client} client - Discord client
     */
    async loadLastMessageFromDB(client) {
        try {
            console.log('🔍 [RECOVERY] Loading last rankings message from database...');
            
            const rankingsChannelId = config.channels.rankings;
            if (!rankingsChannelId) {
                console.log('   ⚠️ Rankings channel not configured');
                this.hasLoadedFromDB = true;
                return;
            }

            // Get stored message ID from database
            const messageId = await db.getBotState('rankings_message_id');
            
            if (!messageId) {
                console.log('   ℹ️ No rankings message ID found in database (first run or no previous message)');
                this.hasLoadedFromDB = true;
                return;
            }

            console.log(`   📝 Found stored message ID: ${messageId}`);

            // Fetch the channel
            console.log(`   📡 Fetching channel ${rankingsChannelId}...`);
            const channel = await client.channels.fetch(rankingsChannelId).catch((err) => {
                console.log(`   ⚠️ Could not fetch rankings channel: ${err.message}`);
                return null;
            });
            
            if (!channel) {
                console.log('   ⚠️ Rankings channel not accessible');
                // Clear the invalid message ID from database
                await db.setBotState('rankings_message_id', null);
                this.hasLoadedFromDB = true;
                return;
            }

            console.log(`   ✅ Channel fetched: #${channel.name}`);

            // Try to fetch the message
            try {
                console.log(`   📡 Fetching message ${messageId} from channel...`);
                const message = await channel.messages.fetch(messageId);
                this.lastRankingsMessage = message;
                console.log('   ✅ Successfully loaded rankings message from database');
                console.log(`   📊 Message will be edited on next update instead of reposting`);
            } catch (fetchError) {
                // Message doesn't exist anymore (was manually deleted)
                console.log(`   ⚠️ Message not found in channel: ${fetchError.message}`);
                console.log('   ℹ️ Message may have been manually deleted - will create new message');
                // Clear the invalid message ID from database
                await db.setBotState('rankings_message_id', null);
                this.lastRankingsMessage = null;
            }

            this.hasLoadedFromDB = true;
        } catch (error) {
            console.error('❌ [ERROR] Error loading last rankings message:', error.message);
            console.error('   Stack:', error.stack);
            this.hasLoadedFromDB = true; // Mark as attempted to avoid infinite retry
        }
    },

    /**
     * Update rankings in the configured channel
     * @param {Client} client - Discord client
     */
    async updateRankingsChannel(client) {
        let channel = null;
        try {
            const rankingsChannelId = config.channels.rankings;
            console.log(`🔍 [UPDATE] Attempting to update rankings in channel: ${rankingsChannelId}`);
            console.log(`   - Timestamp: ${new Date().toISOString()}`);
            
            if (!rankingsChannelId) {
                console.error('❌ [ERROR] Rankings channel not configured in config.json');
                console.error('   Please add "rankings" channel ID to config.json under "channels" section');
                return;
            }

            console.log(`📡 [FETCH] Fetching channel ${rankingsChannelId}...`);
            
            // Fetch channel with detailed error handling
            try {
                channel = await client.channels.fetch(rankingsChannelId);
            } catch (fetchError) {
                console.error(`❌ [ERROR] Failed to fetch rankings channel: ${fetchError.message}`);
                console.error('   Channel ID:', rankingsChannelId);
                console.error('   Error Code:', fetchError.code);
                
                if (fetchError.code === 10003) {
                    console.error('   ⚠️ Channel does not exist - check if channel ID is correct in config.json');
                } else if (fetchError.code === 50001) {
                    console.error('   ⚠️ Bot does not have access to the channel - check channel permissions');
                }
                
                throw fetchError;
            }
            
            // Detailed channel logging as requested in problem statement
            console.log(`   ✅ Channel fetched:`, {
                id: channel.id,
                name: channel.name,
                type: channel.type,
                guild: channel.guild?.name || 'N/A'
            });
            
            // Verify bot permissions
            // Note: We need SendMessages and EmbedLinks to post rankings
            // We also need ManageMessages if we want to delete old messages
            const permissions = channel.permissionsFor(client.user);
            const requiredPermissions = ['ViewChannel', 'SendMessages', 'EmbedLinks'];
            const optionalPermissions = ['ManageMessages']; // For deleting old messages
            
            const missingPermissions = requiredPermissions.filter(perm => !permissions.has(perm));
            
            if (missingPermissions.length > 0) {
                console.error(`❌ [ERROR] Missing required permissions in channel ${rankingsChannelId}:`);
                missingPermissions.forEach(perm => console.error(`   - ${perm}`));
                console.error('   ⚠️ Please grant these permissions to the bot in the channel settings');
                return;
            }
            
            // Check optional permissions and log warnings
            const missingOptionalPerms = optionalPermissions.filter(perm => !permissions.has(perm));
            if (missingOptionalPerms.length > 0) {
                console.warn(`⚠️ [WARNING] Missing optional permissions in channel ${rankingsChannelId}:`);
                missingOptionalPerms.forEach(perm => console.warn(`   - ${perm}`));
                console.warn('   ℹ️ The bot can still function but may not be able to delete old messages');
            }
            
            console.log('✅ [PERMISSIONS] Bot has all required permissions (View, Send, Embed)');
            if (permissions.has('ManageMessages')) {
                console.log('   ✅ Optional: ManageMessages permission granted (can delete old messages)');
            }

            // Load last message from database if not already loaded (handles bot restarts)
            if (!this.hasLoadedFromDB) {
                console.log('🔄 [RECOVERY] First update after bot start - loading last message from database...');
                await this.loadLastMessageFromDB(client);
            }

            // Delete existing message instead of editing
            if (this.lastRankingsMessage) {
                console.log(`🗑️ [DELETE] Deleting old rankings message (ID: ${this.lastRankingsMessage.id})...`);
                try {
                    await this.lastRankingsMessage.delete();
                    console.log('   ✅ Old rankings message deleted successfully');
                } catch (deleteError) {
                    console.log(`   ⚠️ Could not delete message (${deleteError.message}), will post new message anyway`);
                }
                this.lastRankingsMessage = null;
            } else {
                console.log('ℹ️ [DELETE] No previous rankings message to delete (first run or message was already deleted)');
            }

            // Get top 10 users by LC and Level
            console.log('📊 [DATABASE] Fetching rankings data...');
            
            console.log('   📊 Fetching top 10 LC rankings from database...');
            const topLC = await db.getTopLC(10);
            console.log(`      ✅ Successfully fetched ${topLC.length} LC rankings`);
            console.log(`      📝 LC Data:`, JSON.stringify(topLC.map(u => ({ user_id: u.user_id, username: u.username, balance: u.balance })), null, 2));
            
            console.log('   📊 Fetching top 10 Niveau rankings from database...');
            const topLevels = await db.getTopLevels(10);
            console.log(`      ✅ Successfully fetched ${topLevels.length} Niveau rankings`);
            console.log(`      📝 Niveau Data:`, JSON.stringify(topLevels.map(u => ({ user_id: u.user_id, username: u.username, level: u.level, xp: u.xp })), null, 2));
            
            // Check if there's any ranking data available
            if (topLC.length === 0 && topLevels.length === 0) {
                console.log(`   ⚠️ No ranking data available - skipping update`);
                console.log(`   📝 Rankings will be displayed once users have activity`);
                return;
            }

            // Create ranking embeds
            console.log('🎨 [EMBEDS] Creating ranking embeds...');
            
            const lcEmbed = await this.createRankingEmbed(
                topLC,
                '💰 Classement LC - Top 10',
                config.colors.gold,
                (user) => `${user.balance} LC`,
                channel.guild
            );
            
            const levelEmbed = await this.createRankingEmbed(
                topLevels,
                '📊 Classement Niveaux - Top 10',
                config.colors.primary,
                (user) => `Niveau ${user.level}`,
                channel.guild
            );
            
            // Post new rankings message
            console.log('📤 [POST] Posting new rankings message...');
            const sentMessage = await channel.send({ 
                content: '🏆 **Classements Discord** 🏆',
                embeds: [lcEmbed, levelEmbed] 
            });
            
            console.log('   ✅ New rankings message posted successfully');
            console.log(`   📝 Message ID: ${sentMessage.id}`);
            
            // Track the new message for future deletion (in-memory and database)
            this.lastRankingsMessage = sentMessage;
            
            // Persist message ID to database for recovery after bot restarts
            await db.setBotState('rankings_message_id', sentMessage.id);
            console.log('   💾 Message ID saved to database for future updates');
            
            console.log(`✅ [SUCCESS] Rankings successfully updated in channel #${channel.name} (${rankingsChannelId})`);
        } catch (error) {
            console.error(`❌ [ERROR] ${ERROR_MESSAGES.CRITICAL_DISPLAY_ERROR}`, error.message);
            console.error('   Error Type:', error.name);
            console.error('   Channel ID:', config.channels.rankings);
            console.error('   Timestamp:', new Date().toISOString());
            console.error('   Stack:', error.stack);
            
            // Log Discord API errors specifically
            if (error.code) {
                console.error(`   Discord API Error Code: ${error.code}`);
            }
            if (error.httpStatus) {
                console.error(`   HTTP Status: ${error.httpStatus}`);
            }
            
            // Provide helpful troubleshooting information
            if (error.code === 10003) {
                console.error('   ⚠️ Troubleshooting: Channel not found - check if channel ID is correct in config.json');
            } else if (error.code === 50001) {
                console.error('   ⚠️ Troubleshooting: Missing access - check bot has access to the channel');
            } else if (error.code === 50013) {
                console.error('   ⚠️ Troubleshooting: Missing permissions - check bot has required permissions');
            } else if (error.message.includes('Unknown Message')) {
                console.error('   ⚠️ Troubleshooting: Message was already deleted - this is expected behavior');
            }
            
            // Re-throw error so interval handler can catch it and potentially restart
            throw error;
        }
    }
};
