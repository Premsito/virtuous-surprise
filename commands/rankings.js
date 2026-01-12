const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { db } = require('../database/db');
const config = require('../config.json');
const { isAdmin } = require('../utils/adminHelper');
const { generateRankingsImage } = require('../utils/rankingsImage');

// Error message constants
const ERROR_MESSAGES = {
    CRITICAL_DISPLAY_ERROR: 'Critical error in ranking display:',
    USER_ERROR_MESSAGE: '⛔ Une erreur critique est survenue. Contactez un administrateur.',
    USER_UPDATE_ERROR_MESSAGE: 'Une erreur critique est survenue lors de la mise à jour du classement. Contactez un administrateur.'
};

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
            
            // Ensure we have a guild context (rankings only work in guilds, not DMs)
            if (!channel.guild) {
                console.error('   ❌ Channel is not in a guild context');
                await channel.send('❌ Cette commande ne fonctionne que dans un serveur.');
                return;
            }
            
            // Get top users (fetch more to account for filtering)
            const topLC = await db.getTopLC(50);
            const topLevels = await db.getTopLevels(50);
            
            // Data validation logging as requested in problem statement
            console.log("Fetched LC Ranking:", topLC);
            console.log("Fetched Level Ranking:", topLevels);
            
            console.log(`   - Fetched ${topLC.length} LC rankings`);
            console.log(`   - Fetched ${topLevels.length} level rankings`);
            
            // Apply ranking filters as per requirements
            const filteredLC = topLC.filter(user => user.balance >= 200);
            const filteredLevels = topLevels.filter(user => user.level >= 2);
            
            console.log(`   - Filtered to ${filteredLC.length} LC users (>= 200 LC)`);
            console.log(`   - Filtered to ${filteredLevels.length} level users (>= Level 2)`);
            
            // Take top 10 after filtering
            const finalLC = filteredLC.slice(0, 10);
            const finalLevels = filteredLevels.slice(0, 10);
            
            // Check if there's any ranking data available after filtering
            if (finalLC.length === 0 && finalLevels.length === 0) {
                console.log(`   ⚠️ No ranking data available after filtering`);
                await channel.send('Aucun classement n\'est disponible pour l\'instant.');
                return;
            }

            // Generate rankings image (pancarte)
            console.log('🖼️ Generating rankings image...');
            const imageBuffer = await generateRankingsImage(
                finalLC,
                finalLevels,
                channel.guild
            );
            
            // Create attachment
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'classements.png' });
            
            // Send the image
            console.log('📤 Sending rankings image...');
            await channel.send({ files: [attachment] });
            
            console.log('✅ Rankings image sent successfully');

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
