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
    
    // Track the last posted rankings message for cleanup
    lastRankingsMessage: null,
    
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
        
        // Build ranking description with proper alignment and formatting
        let description = '';
        const medals = ['🥇', '🥈', '🥉'];
        
        // Fetch guild members in batch to avoid API rate limits
        const memberCache = new Map();
        
        for (let i = 0; i < users.length && i < 10; i++) {
            const user = users[i];
            
            // Get guild member with caching
            let guildMember = memberCache.get(user.user_id);
            if (!guildMember) {
                guildMember = await guild.members.fetch(user.user_id).catch(() => null);
                if (guildMember) {
                    memberCache.set(user.user_id, guildMember);
                }
            }
            
            const displayName = guildMember ? guildMember.displayName : user.username;
            const value = valueFormatter(user);
            
            // Position indicator (medal for top 3, number for rest)
            const position = i < 3 ? medals[i] : `**${i + 1}.**`;
            
            // Add visual emphasis for top 3 using bold and different formatting
            if (i === 0) {
                // 1st place: Bold name and value with special formatting
                description += `${position} **\`${displayName}\`** • **${value}**\n`;
            } else if (i === 1) {
                // 2nd place: Bold name with emphasis
                description += `${position} **${displayName}** • **${value}**\n`;
            } else if (i === 2) {
                // 3rd place: Bold name
                description += `${position} **${displayName}** • ${value}\n`;
            } else {
                // 4-10: Regular formatting
                description += `${position} ${displayName} • ${value}\n`;
            }
        }
        
        embed.setDescription(description);
        
        // Set thumbnail to first place user's avatar
        if (users.length > 0) {
            const firstUser = users[0];
            // Check if we already fetched this member in the loop above
            const firstMember = memberCache.get(firstUser.user_id);
            
            if (firstMember) {
                try {
                    embed.setThumbnail(firstMember.displayAvatarURL({ extension: 'png', size: 128 }));
                } catch (error) {
                    // Avatar fetch failed, embed will work without thumbnail
                    console.log('   ⚠️ Could not set avatar thumbnail:', error.message);
                }
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
            console.log("Channel fetched:", channel);
            console.log(`📊 Fetching rankings data for channel: ${channel.id}`);
            
            // Ensure we have a guild context (rankings only work in guilds, not DMs)
            if (!channel.guild) {
                console.error('   ❌ Channel is not in a guild context');
                await channel.send('❌ Cette commande ne fonctionne que dans un serveur.');
                return null;
            }
            
            // Get top 10 users by LC and Level (no minimum threshold filtering)
            const topLC = await db.getTopLC(10);
            const topLevels = await db.getTopLevels(10);
            
            // Data validation logging as requested in problem statement
            console.log("Fetched LC Ranking:", topLC);
            console.log("Fetched Level Ranking:", topLevels);
            
            console.log(`   - Fetched ${topLC.length} LC rankings`);
            console.log(`   - Fetched ${topLevels.length} level rankings`);
            
            // Check if there's any ranking data available
            if (topLC.length === 0 && topLevels.length === 0) {
                console.log(`   ⚠️ No ranking data available`);
                await channel.send('Aucun classement n\'est disponible pour l\'instant.');
                return null;
            }

            // Create ranking embeds
            console.log('🎨 Creating ranking embeds...');
            
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
            
            // Send both embeds together
            console.log('📤 Sending ranking embeds...');
            const sentMessage = await channel.send({ 
                content: '🏆 **Classements Discord** 🏆',
                embeds: [lcEmbed, levelEmbed] 
            });
            
            console.log('✅ Ranking embeds sent successfully');
            return sentMessage;

        } catch (error) {
            console.error(ERROR_MESSAGES.CRITICAL_DISPLAY_ERROR, error);
            console.error('   Channel ID:', channel?.id);
            console.error('   Stack:', error.stack);
            
            // Send helpful error message to the channel with error details
            try {
                await channel.send("⛔ Une erreur critique est survenue : " + error.message);
            } catch (sendError) {
                console.error('   Failed to send error message to channel:', sendError.message);
            }
            throw error;
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
            console.log(`🔍 Attempting to update rankings in channel: ${rankingsChannelId}`);
            
            if (!rankingsChannelId) {
                console.error('❌ Rankings channel not configured in config.json');
                return;
            }

            console.log(`📡 Fetching channel ${rankingsChannelId}...`);
            channel = await client.channels.fetch(rankingsChannelId);
            
            // Detailed channel logging as requested in problem statement
            console.log("Channel fetched:", channel);
            
            if (!channel) {
                console.error(`❌ Could not fetch rankings channel: ${rankingsChannelId}`);
                console.error('   - Verify the channel ID is correct');
                console.error('   - Ensure the bot has access to this channel');
                return;
            }
            
            console.log(`✅ Channel fetched successfully: #${channel.name}`);
            console.log(`   - Channel type: ${channel.type}`);
            console.log(`   - Channel guild: ${channel.guild?.name || 'N/A'}`);
            
            // Verify bot permissions
            const permissions = channel.permissionsFor(client.user);
            const requiredPermissions = ['ViewChannel', 'SendMessages', 'EmbedLinks', 'ManageMessages'];
            const missingPermissions = requiredPermissions.filter(perm => !permissions.has(perm));
            
            if (missingPermissions.length > 0) {
                console.error(`❌ Missing required permissions in channel ${rankingsChannelId}:`);
                missingPermissions.forEach(perm => console.error(`   - ${perm}`));
                return;
            }
            
            console.log('✅ Bot has all required permissions (View, Send, Embed, Manage)');

            // Delete previous rankings message if it exists
            if (this.lastRankingsMessage) {
                console.log('🧹 Deleting previous rankings message...');
                try {
                    await this.lastRankingsMessage.delete();
                    console.log('   ✅ Previous rankings message deleted successfully');
                } catch (deleteError) {
                    // Message might already be deleted or doesn't exist
                    console.log('   ⚠️ Could not delete previous message:', deleteError.message);
                }
                this.lastRankingsMessage = null;
            }

            // Display new rankings
            console.log('📊 Displaying new rankings...');
            const sentMessage = await this.displayRankings(channel);
            
            // Track the new message for future deletion
            if (sentMessage) {
                this.lastRankingsMessage = sentMessage;
                console.log('   ✅ New rankings message tracked for future cleanup');
            }
            
            console.log(`✅ Rankings successfully updated in channel #${channel.name} (${rankingsChannelId})`);
        } catch (error) {
            console.error(ERROR_MESSAGES.CRITICAL_DISPLAY_ERROR, error.message);
            console.error('   Channel ID:', config.channels.rankings);
            console.error('   Stack:', error.stack);
            
            // Log Discord API errors specifically
            if (error.code) {
                console.error(`   Discord API Error Code: ${error.code}`);
            }
            if (error.httpStatus) {
                console.error(`   HTTP Status: ${error.httpStatus}`);
            }
            
            // Try to send error notification to the channel if possible with error details
            try {
                if (channel) {
                    await channel.send("⛔ Une erreur critique est survenue : " + error.message);
                }
            } catch (notifyError) {
                console.error('   Could not send error notification to channel:', notifyError.message);
            }
        }
    }
};
