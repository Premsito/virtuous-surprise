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

/**
 * Helper function to get medal or position number for rankings
 * @param {number} position - Zero-based position (0 = first place)
 * @returns {string} Medal emoji or position number
 */
function getMedalForPosition(position) {
    if (position === 0) return '🥇';
    if (position === 1) return '🥈';
    if (position === 2) return '🥉';
    return `${position + 1}.`;
}

module.exports = {
    name: 'rankings',
    description: 'Display LC and Level rankings with podiums (Admin only)',
    
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
     * Display the rankings in a channel
     * @param {TextChannel} channel - The channel to display rankings in
     */
    async displayRankings(channel) {
        try {
            // Channel validation logging as requested in problem statement
            console.log("Channel fetched:", channel);
            console.log(`📊 Fetching rankings data for channel: ${channel.id}`);
            
            // Get top users
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
                return;
            }

            // Create consolidated podiums embed
            console.log('🏆 Creating consolidated podiums embed...');
            const podiumsEmbed = await this.createConsolidatedPodiumsEmbed(
                channel.client,
                topLC.slice(0, 3),
                topLevels.slice(0, 3)
            );

            // Create consolidated rankings embed with inline fields
            console.log('📊 Creating consolidated rankings embed...');
            const rankingsEmbed = this.createConsolidatedRankingsEmbed(
                topLC,
                topLevels
            );

            // Send the embeds
            console.log('📤 Sending consolidated podiums embed...');
            await channel.send({ embeds: [podiumsEmbed] });
            
            console.log('📤 Sending consolidated rankings embed...');
            await channel.send({ embeds: [rankingsEmbed] });
            
            console.log('✅ All rankings embeds sent successfully');

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
     * Create a podium embed with profile pictures
     * @param {Client} client - Discord client
     * @param {Array} topUsers - Top 3 users
     * @param {string} type - Type of ranking (LC or Levels)
     * @param {string} title - Embed title
     * @param {string} color - Embed color
     * @param {Function} valueFormatter - Function to format the value display
     */
    async createPodiumEmbed(client, topUsers, type, title, color, valueFormatter) {
        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(title)
            .setTimestamp();

        let description = '';

        for (let i = 0; i < Math.min(3, topUsers.length); i++) {
            const user = topUsers[i];
            const medal = getMedalForPosition(i);
            
            // Fetch user from Discord to get avatar
            let discordUser;
            try {
                discordUser = await client.users.fetch(user.user_id);
                console.log(`   ✓ Fetched user ${discordUser.username} (${medal}) for podium`);
            } catch (error) {
                console.error(`   ⚠️ Could not fetch user ${user.user_id}:`, error.message);
            }

            const username = discordUser ? discordUser.username : user.username;
            const value = valueFormatter(user);

            // Add to description with appropriate spacing based on position
            if (i === 0) {
                // First place - 128px avatar as thumbnail
                description += `\n**${medal} ${username}**\n`;
                description += `└─ ${value}\n`;
                if (discordUser) {
                    try {
                        const avatarUrl = discordUser.displayAvatarURL({ size: 128, dynamic: true });
                        embed.setThumbnail(avatarUrl);
                        console.log(`   🖼️ Set 1st place avatar: ${username} (128px thumbnail)`);
                    } catch (error) {
                        console.error(`   ⚠️ Avatar size error for ${username}:`, error.message);
                        // Continue without setting the thumbnail
                    }
                }
            } else if (i === 1) {
                // Second place - 128px avatar as image
                description += `\n**${medal} ${username}**\n`;
                description += `└─ ${value}\n`;
                if (discordUser) {
                    try {
                        const avatarUrl = discordUser.displayAvatarURL({ size: 128, dynamic: true });
                        embed.setImage(avatarUrl);
                        console.log(`   🖼️ Set 2nd place avatar: ${username} (128px image)`);
                    } catch (error) {
                        console.error(`   ⚠️ Avatar size error for ${username}:`, error.message);
                        // Continue without setting the image
                    }
                }
            } else {
                // Third place - 64px avatar in author section (alternative to footer)
                description += `\n**${medal} ${username}**\n`;
                description += `└─ ${value}\n`;
                if (discordUser) {
                    try {
                        const avatarUrl = discordUser.displayAvatarURL({ size: 64, dynamic: true });
                        embed.setAuthor({
                            name: `🥉 ${username}`,
                            iconURL: avatarUrl
                        });
                        console.log(`   🖼️ Set 3rd place avatar: ${username} (64px author icon)`);
                    } catch (error) {
                        console.error(`   ⚠️ Avatar size error for ${username}:`, error.message);
                        // Continue without setting the author avatar
                    }
                }
            }
        }

        embed.setDescription(description || 'Aucune donnée disponible');
        return embed;
    },

    /**
     * Create a consolidated podiums embed with both LC and Levels podiums
     * @param {Client} client - Discord client
     * @param {Array} topLC - Top 3 LC users
     * @param {Array} topLevels - Top 3 Level users
     * @returns {Promise<EmbedBuilder>} The consolidated podiums embed
     */
    async createConsolidatedPodiumsEmbed(client, topLC, topLevels) {
        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setTitle('🏆 Classements Discord')
            .setTimestamp();

        // Build LC podium data
        let podiumLCData = '';
        for (let i = 0; i < Math.min(3, topLC.length); i++) {
            const user = topLC[i];
            const medal = getMedalForPosition(i);
            
            let discordUser;
            try {
                discordUser = await client.users.fetch(user.user_id);
                console.log(`   ✓ Fetched LC user ${discordUser.username} (${medal}) for podium`);
            } catch (error) {
                console.error(`   ⚠️ Could not fetch LC user ${user.user_id}:`, error.message);
            }

            const username = discordUser ? discordUser.username : user.username;
            const value = `${user.balance} LC`;
            
            podiumLCData += `${medal} **${username}** → ${value}\n`;

            // Set first place LC avatar at 128px (consistent display rule)
            if (i === 0 && discordUser) {
                try {
                    const avatarUrl = discordUser.displayAvatarURL({ size: 128, dynamic: true });
                    embed.setThumbnail(avatarUrl);
                    console.log(`   🖼️ Set LC 1st place avatar: ${username} (128px thumbnail)`);
                } catch (error) {
                    console.error(`   ⚠️ Avatar size error for ${username}:`, error.message);
                }
            }
        }

        // Build Levels podium data
        let podiumLevelData = '';
        for (let i = 0; i < Math.min(3, topLevels.length); i++) {
            const user = topLevels[i];
            const medal = getMedalForPosition(i);
            
            let discordUser;
            try {
                discordUser = await client.users.fetch(user.user_id);
                console.log(`   ✓ Fetched Level user ${discordUser.username} (${medal}) for podium`);
            } catch (error) {
                console.error(`   ⚠️ Could not fetch Level user ${user.user_id}:`, error.message);
            }

            const username = discordUser ? discordUser.username : user.username;
            const value = `Niveau ${user.level}`;
            
            podiumLevelData += `${medal} **${username}** → ${value}\n`;
        }

        // Add fields to embed
        embed.addFields(
            { name: '🥇 Podium LC', value: podiumLCData || 'Aucune donnée disponible', inline: false },
            { name: '🏆 Podium Niveaux', value: podiumLevelData || 'Aucune donnée disponible', inline: false }
        );

        return embed;
    },

    /**
     * Create a consolidated rankings embed with both LC and Levels rankings
     * @param {Array} topLC - Top 10 LC users
     * @param {Array} topLevels - Top 10 Level users
     * @returns {EmbedBuilder} The consolidated rankings embed
     */
    createConsolidatedRankingsEmbed(topLC, topLevels) {
        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setTitle('📊 Classements Discord')
            .setTimestamp();

        // Build LC rankings data
        let lcRankingData = '';
        for (let i = 0; i < Math.min(10, topLC.length); i++) {
            const user = topLC[i];
            const medal = getMedalForPosition(i);
            lcRankingData += `${medal} **${user.username}** → ${user.balance} LC\n`;
        }

        // Build Level rankings data
        let levelRankingData = '';
        for (let i = 0; i < Math.min(10, topLevels.length); i++) {
            const user = topLevels[i];
            const medal = getMedalForPosition(i);
            levelRankingData += `${medal} **${user.username}** → Niveau ${user.level}\n`;
        }

        // Add inline fields for side-by-side display
        embed.addFields(
            { name: 'Classement LC - Top 10', value: lcRankingData || 'Aucune donnée disponible', inline: true },
            { name: 'Classement Niveaux - Top 10', value: levelRankingData || 'Aucune donnée disponible', inline: true }
        );

        return embed;
    },

    /**
     * Create a rankings table embed
     * @param {Array} topUsers - Top 10 users
     * @param {string} title - Embed title
     * @param {string} color - Embed color
     * @param {Function} valueFormatter - Function to format the value display
     */
    createRankingsTableEmbed(topUsers, title, color, valueFormatter) {
        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(title)
            .setTimestamp();

        let description = '';

        for (let i = 0; i < Math.min(10, topUsers.length); i++) {
            const user = topUsers[i];
            const medal = getMedalForPosition(i);
            const value = valueFormatter(user);
            
            description += `${medal} **${user.username}** → ${value}\n`;
        }

        if (description === '') {
            description = 'Aucune donnée disponible';
        }

        embed.setDescription(description);
        return embed;
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
            
            // Test basic message sending functionality as requested in problem statement
            console.log('🧪 Testing basic message sending functionality...');
            try {
                const testMessage = await channel.send("Test unitaire : Classement affichage opérationnel.");
                console.log('   ✅ Test message sent successfully');
                // Delete the test message after a short delay (simplified pattern)
                setTimeout(() => { 
                    testMessage.delete().catch((err) => {
                        console.log('   ⚠️ Could not delete test message:', err.message);
                    });
                }, 2000);
            } catch (testError) {
                console.error('   ❌ Failed to send test message:', testError.message);
                throw new Error(`Cannot send messages to channel ${rankingsChannelId}: ${testError.message}`);
            }

            // Delete previous messages in the channel (clean slate)
            console.log('🧹 Cleaning old messages from rankings channel...');
            // Fetch only recent messages (50 limit to reduce load)
            const messages = await channel.messages.fetch({ limit: 50 });
            console.log(`   - Found ${messages.size} messages to clean`);
            
            // Try bulk delete first (works for messages < 14 days old)
            try {
                const deleted = await channel.bulkDelete(messages, true);
                console.log(`   ✅ Bulk deleted ${deleted.size} messages`);
            } catch (bulkDeleteError) {
                // If bulk delete fails, delete individually with rate limiting
                console.log('   ⚠️ Bulk delete failed, deleting messages individually...');
                let deleteCount = 0;
                const maxIndividualDeletes = 20; // Limit individual deletes to prevent rate limits
                
                for (const [, msg] of messages) {
                    if (deleteCount >= maxIndividualDeletes) break;
                    
                    try {
                        await msg.delete();
                        deleteCount++;
                        // Small delay to avoid rate limits
                        await new Promise(resolve => setTimeout(resolve, 100));
                    } catch (deleteError) {
                        // Silently continue if individual delete fails
                        console.log(`   ⚠️ Could not delete message ${msg.id}: ${deleteError.message}`);
                    }
                }
                console.log(`   ✅ Individually deleted ${deleteCount} messages`);
            }

            // Display new rankings
            console.log('📊 Displaying new rankings...');
            await this.displayRankings(channel);
            
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
