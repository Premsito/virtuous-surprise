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
            console.log(`📊 Rankings command called by ${message.author.username} (${message.author.id})`);
            
            // Check if user has admin permissions
            if (!isAdmin(message.author.id)) {
                console.log(`   ❌ Permission denied - user is not an admin`);
                return message.reply('❌ Cette commande est réservée aux administrateurs.');
            }
            
            console.log(`   ✅ Permission granted - displaying rankings`);
            await this.displayRankings(message.channel);
            
            // Delete the command message to keep the channel clean
            await message.delete().catch(() => {});
            console.log(`   ✅ Rankings command completed successfully`);
        } catch (error) {
            console.error('❌ Error displaying rankings:', error);
            console.error('   User:', message.author.username);
            console.error('   Channel:', message.channel.id);
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
        
        // Batch fetch all guild members efficiently to avoid rate limits
        const memberCache = new Map();
        const userIds = users.map(user => user.user_id).filter(id => id);
        
        if (userIds.length > 0) {
            console.log(`   🔍 Fetching ${userIds.length} guild members for display names...`);
            try {
                // Fetch all members in a single API call to avoid rate limits
                const members = await guild.members.fetch({ user: userIds });
                members.forEach((member, userId) => {
                    memberCache.set(userId, member);
                });
                console.log(`   ✅ Fetched ${memberCache.size}/${userIds.length} guild members`);
            } catch (error) {
                console.log(`   ⚠️ Error batch fetching members:`, error.message);
                console.log(`   ℹ️ Will use usernames as fallback`);
            }
        }
        
        // Build ranking description with proper alignment and formatting
        let description = '';
        const medals = ['🥇', '🥈', '🥉'];
        
        for (let i = 0; i < users.length && i < 10; i++) {
            const user = users[i];
            
            // Use displayName from guild member (no notifications triggered)
            // Fallback to username from database if member not found
            const guildMember = memberCache.get(user.user_id);
            const displayName = guildMember ? guildMember.displayName : user.username;
            const value = valueFormatter(user);
            
            // Position indicator (medal for top 3, number for rest)
            const position = i < 3 ? medals[i] : `**${i + 1}.**`;
            
            // Add visual emphasis for top 3 using bold and different formatting
            if (i === 0) {
                // 1st place: Bold displayName and value with special formatting
                description += `${position} **${displayName}** • **${value}**\n`;
            } else if (i === 1) {
                // 2nd place: Bold displayName with emphasis
                description += `${position} **${displayName}** • **${value}**\n`;
            } else if (i === 2) {
                // 3rd place: Bold displayName
                description += `${position} **${displayName}** • ${value}\n`;
            } else {
                // 4-10: Regular formatting
                description += `${position} ${displayName} • ${value}\n`;
            }
        }
        
        embed.setDescription(description);
        
        // Set thumbnail to first place user's avatar
        if (users.length > 0 && users[0].user_id) {
            const firstMember = memberCache.get(users[0].user_id);
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
            console.log(`📊 [DISPLAY] Starting rankings display for channel: ${channel.id}`);
            console.log(`   - Channel name: #${channel.name}`);
            console.log(`   - Guild: ${channel.guild?.name || 'N/A'}`);
            
            // Ensure we have a guild context (rankings only work in guilds, not DMs)
            if (!channel.guild) {
                console.error('   ❌ Channel is not in a guild context');
                await channel.send('❌ Cette commande ne fonctionne que dans un serveur.');
                return null;
            }
            
            // Get top 10 users by LC and Level (no minimum threshold filtering)
            console.log('🔍 [DATA] Fetching rankings from database...');
            const topLC = await db.getTopLC(10);
            const topLevels = await db.getTopLevels(10);
            
            // Data validation logging as requested in problem statement
            console.log(`📊 [DATA] Fetched LC Rankings (${topLC.length} users):`);
            topLC.slice(0, 3).forEach((user, i) => {
                console.log(`   ${i + 1}. ${user.username} (ID: ${user.user_id}) - ${user.balance} LC`);
            });
            
            console.log(`📊 [DATA] Fetched Niveau Rankings (${topLevels.length} users):`);
            topLevels.slice(0, 3).forEach((user, i) => {
                console.log(`   ${i + 1}. ${user.username} (ID: ${user.user_id}) - Level ${user.level}`);
            });
            
            // Check if there's any ranking data available
            if (topLC.length === 0 && topLevels.length === 0) {
                console.log(`   ⚠️ No ranking data available`);
                await channel.send('Aucun classement n\'est disponible pour l\'instant.');
                return null;
            }

            // Create ranking embeds
            console.log('🎨 [EMBEDS] Creating ranking embeds with display names...');
            
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
            
            console.log('   ✅ Embeds created successfully');
            
            // Send both embeds together
            console.log('📤 [SEND] Sending ranking embeds to channel...');
            const sentMessage = await channel.send({ 
                content: '🏆 **Classements Discord** 🏆',
                embeds: [lcEmbed, levelEmbed] 
            });
            
            console.log(`✅ [SUCCESS] Ranking embeds sent successfully (Message ID: ${sentMessage.id})`);
            return sentMessage;

        } catch (error) {
            console.error(`❌ [ERROR] ${ERROR_MESSAGES.CRITICAL_DISPLAY_ERROR}`, error.message);
            console.error('   Channel ID:', channel?.id);
            console.error('   Channel Name:', channel?.name);
            console.error('   Guild:', channel?.guild?.name);
            console.error('   Error Type:', error.name);
            console.error('   Stack:', error.stack);
            
            // Send generic error message to avoid exposing sensitive information
            try {
                await channel.send(ERROR_MESSAGES.USER_ERROR_MESSAGE);
            } catch (sendError) {
                console.error('   ❌ Failed to send error message to channel:', sendError.message);
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
                console.error('❌ [CONFIG] Rankings channel not configured in config.json');
                return;
            }

            console.log(`📡 [FETCH] Fetching channel ${rankingsChannelId}...`);
            channel = await client.channels.fetch(rankingsChannelId);
            
            // Detailed channel logging as requested in problem statement
            console.log(`   ✅ Channel fetched:`, {
                id: channel.id,
                name: channel.name,
                type: channel.type,
                guild: channel.guild?.name || 'N/A'
            });
            
            // Verify bot permissions
            // Required permissions:
            // - ViewChannel: See the rankings channel
            // - SendMessages: Post messages
            // - EmbedLinks: Send embedded rankings
            // - ManageMessages: Delete old messages
            const permissions = channel.permissionsFor(client.user);
            const requiredPermissions = ['ViewChannel', 'SendMessages', 'EmbedLinks', 'ManageMessages'];
            const missingPermissions = requiredPermissions.filter(perm => !permissions.has(perm));
            
            if (missingPermissions.length > 0) {
                console.error(`❌ [PERMISSIONS] Missing required permissions in channel ${rankingsChannelId}:`);
                missingPermissions.forEach(perm => console.error(`   - ${perm}`));
                return;
            }
            
            console.log('✅ [PERMISSIONS] Bot has all required permissions (View, Send, Embed, ManageMessages)');

            // Load last message from database if not already loaded (handles bot restarts)
            if (!this.hasLoadedFromDB) {
                console.log('🔄 [RECOVERY] Loading last message from database...');
                await this.loadLastMessageFromDB(client);
            }

            // Delete existing message before posting new one
            if (this.lastRankingsMessage) {
                console.log(`🧹 [DELETE] Deleting previous rankings message (ID: ${this.lastRankingsMessage.id})...`);
                try {
                    await this.lastRankingsMessage.delete();
                    console.log('   ✅ Previous rankings message deleted successfully');
                } catch (deleteError) {
                    // If delete fails (message already deleted, etc.), just log and continue
                    console.log(`   ⚠️ Could not delete message (${deleteError.message}), it may have been already deleted`);
                }
                // Clear the tracked message
                this.lastRankingsMessage = null;
                await db.setBotState('rankings_message_id', null);
            }

            // Post new message
            console.log('📤 [POST] Posting new rankings message...');
            const sentMessage = await this.displayRankings(channel);
            
            // Track the new message for future deletion (in-memory and database)
            if (sentMessage) {
                this.lastRankingsMessage = sentMessage;
                // Persist message ID to database for recovery after bot restarts
                await db.setBotState('rankings_message_id', sentMessage.id);
                console.log('   ✅ New rankings message posted and tracked');
                console.log(`   📝 Message ID ${sentMessage.id} saved to database for future deletion`);
            }
            
            console.log(`✅ [SUCCESS] Rankings successfully updated in channel #${channel.name} (${rankingsChannelId})`);
        } catch (error) {
            console.error(`❌ [ERROR] ${ERROR_MESSAGES.CRITICAL_DISPLAY_ERROR}`, error.message);
            console.error('   Channel ID:', config.channels.rankings);
            console.error('   Channel Name:', channel?.name || 'N/A');
            console.error('   Guild:', channel?.guild?.name || 'N/A');
            console.error('   Timestamp:', new Date().toISOString());
            console.error('   Error Type:', error.name);
            console.error('   Stack:', error.stack);
            
            // Log Discord API errors specifically
            if (error.code) {
                console.error(`   Discord API Error Code: ${error.code}`);
            }
            if (error.httpStatus) {
                console.error(`   HTTP Status: ${error.httpStatus}`);
            }
            
            // Re-throw error so interval handler can catch it and potentially restart
            throw error;
        }
    }
};
