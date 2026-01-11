const { EmbedBuilder } = require('discord.js');
const { db } = require('../database/db');
const config = require('../config.json');
const { isAdmin } = require('../utils/adminHelper');

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
            console.log(`📊 Fetching rankings data for channel: ${channel.id}`);
            
            // Get top users
            const topLC = await db.getTopLC(10);
            const topLevels = await db.getTopLevels(10);
            
            // Detailed logging as requested in problem statement
            console.log("Data fetched for LC Ranking:", topLC);
            console.log("Data fetched for Level Ranking:", topLevels);
            
            console.log(`   - Fetched ${topLC.length} LC rankings`);
            console.log(`   - Fetched ${topLevels.length} level rankings`);
            
            // Check if there's any ranking data available
            if (topLC.length === 0 && topLevels.length === 0) {
                console.log(`   ⚠️ No ranking data available`);
                await channel.send('Aucun classement n\'est disponible pour l\'instant.');
                return;
            }

            // Create LC Podium Embed
            console.log('💰 Creating LC Podium embed...');
            const lcPodiumEmbed = await this.createPodiumEmbed(
                channel.client,
                topLC.slice(0, 3),
                'LC',
                '💰 Podium LC',
                config.colors.gold,
                (user) => `${user.balance} LC`
            );

            // Create Levels Podium Embed
            console.log('⭐ Creating Levels Podium embed...');
            const levelsPodiumEmbed = await this.createPodiumEmbed(
                channel.client,
                topLevels.slice(0, 3),
                'Levels',
                '⭐ Podium Niveaux',
                config.colors.primary,
                (user) => `Niveau ${user.level}`
            );

            // Create LC Rankings Table Embed
            console.log('📊 Creating LC Rankings table...');
            const lcRankingsEmbed = this.createRankingsTableEmbed(
                topLC,
                '📊 Classement LC - Top 10',
                config.colors.blue,
                (user) => `${user.balance} LC`
            );

            // Create Levels Rankings Table Embed
            console.log('🏆 Creating Levels Rankings table...');
            const levelsRankingsEmbed = this.createRankingsTableEmbed(
                topLevels,
                '🏆 Classement Niveaux - Top 10',
                config.colors.primary,
                (user) => `Niveau ${user.level}`
            );

            // Send the embeds
            console.log('📤 Sending LC podium embed...');
            await channel.send({ embeds: [lcPodiumEmbed] });
            
            console.log('📤 Sending Levels podium embed...');
            await channel.send({ embeds: [levelsPodiumEmbed] });
            
            console.log('📤 Sending rankings tables (side by side)...');
            await channel.send({ embeds: [lcRankingsEmbed, levelsRankingsEmbed] });
            
            console.log('✅ All rankings embeds sent successfully');

        } catch (error) {
            console.error('Critical error in ranking display:', error);
            console.error('   Channel ID:', channel?.id);
            console.error('   Stack:', error.stack);
            
            // Send helpful error message to the channel
            try {
                await channel.send("Une erreur critique est survenue. Contactez un administrateur.");
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
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
            
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
                    embed.setThumbnail(discordUser.displayAvatarURL({ size: 128, dynamic: true }));
                    console.log(`   🖼️ Set 1st place avatar: ${username} (128px thumbnail)`);
                }
            } else if (i === 1) {
                // Second place - 96px avatar as image
                description += `\n**${medal} ${username}**\n`;
                description += `└─ ${value}\n`;
                if (discordUser) {
                    embed.setImage(discordUser.displayAvatarURL({ size: 96, dynamic: true }));
                    console.log(`   🖼️ Set 2nd place avatar: ${username} (96px image)`);
                }
            } else {
                // Third place - 64px avatar in author section (alternative to footer)
                description += `\n**${medal} ${username}**\n`;
                description += `└─ ${value}\n`;
                if (discordUser) {
                    embed.setAuthor({
                        name: `🥉 ${username}`,
                        iconURL: discordUser.displayAvatarURL({ size: 64, dynamic: true })
                    });
                    console.log(`   🖼️ Set 3rd place avatar: ${username} (64px author icon)`);
                }
            }
        }

        embed.setDescription(description || 'Aucune donnée disponible');
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
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
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
                const testMessage = await channel.send("Test: Classement affichage fonctionnel.");
                console.log('   ✅ Test message sent successfully');
                // Delete the test message after a short delay using a self-contained async function
                // Note: This is intentionally a floating promise - we don't want to block on cleanup
                (async () => {
                    try {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        await testMessage.delete();
                        console.log('   🧹 Test message cleaned up');
                    } catch (deleteError) {
                        console.log('   ⚠️ Could not delete test message:', deleteError.message);
                    }
                })();
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
            console.error('Critical error in ranking display:', error.message);
            console.error('   Channel ID:', config.channels.rankings);
            console.error('   Stack:', error.stack);
            
            // Log Discord API errors specifically
            if (error.code) {
                console.error(`   Discord API Error Code: ${error.code}`);
            }
            if (error.httpStatus) {
                console.error(`   HTTP Status: ${error.httpStatus}`);
            }
            
            // Try to send error notification to the channel if possible
            try {
                if (channel) {
                    await channel.send("Une erreur critique est survenue lors de la mise à jour du classement. Contactez un administrateur.");
                }
            } catch (notifyError) {
                console.error('   Could not send error notification to channel:', notifyError.message);
            }
        }
    }
};
