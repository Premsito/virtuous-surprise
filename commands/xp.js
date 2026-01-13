const { EmbedBuilder } = require('discord.js');
const { db } = require('../database/db');
const config = require('../config.json');
const { isAdmin } = require('../utils/adminHelper');
const { getLevelFromXP, getXPProgress } = require('../utils/xpHelper');

module.exports = {
    name: 'xp',
    description: 'Manage XP for users (admin only)',
    
    async execute(message, args, client) {
        try {
            // Check if user is admin
            if (!isAdmin(message.author.id)) {
                await message.reply('❌ Vous devez être administrateur pour utiliser cette commande.');
                return;
            }
            
            // Check if subcommand is provided
            if (args.length < 1) {
                await message.reply('❌ Utilisation: `!xp add <montant> @utilisateur` ou `!xp remove <montant> @utilisateur`');
                return;
            }
            
            const subcommand = args[0].toLowerCase();
            
            if (subcommand === 'add') {
                await this.handleAddXP(message, args, client);
            } else if (subcommand === 'remove') {
                await this.handleRemoveXP(message, args, client);
            } else {
                await message.reply('❌ Sous-commande invalide. Utilisez `add` ou `remove`.');
            }
            
        } catch (error) {
            console.error('Error in xp command:', error);
            await message.reply('❌ Une erreur est survenue lors de l\'exécution de la commande.');
        }
    },
    
    async handleAddXP(message, args, client) {
        try {
            // Validate arguments: !xp add <amount> @user
            if (args.length < 3) {
                await message.reply('❌ Utilisation: `!xp add <montant> @utilisateur`');
                return;
            }
            
            // Parse amount
            const amount = parseInt(args[1]);
            if (isNaN(amount) || amount <= 0) {
                await message.reply('❌ Le montant doit être un nombre positif valide.');
                return;
            }
            
            // Get target user
            const targetUser = message.mentions.users.first();
            if (!targetUser) {
                await message.reply('❌ Vous devez mentionner un utilisateur valide.');
                return;
            }
            
            const userId = targetUser.id;
            
            // Ensure user exists in database
            let user = await db.getUser(userId);
            if (!user) {
                user = await db.createUser(userId, targetUser.username);
            }
            
            // Store old level for comparison
            const oldXP = user.xp || 0;
            const oldLevel = getLevelFromXP(oldXP);
            
            console.log(`[XP-ADD] Admin ${message.author.username} adding ${amount} XP to ${targetUser.username}`);
            console.log(`[XP-ADD] Current XP: ${oldXP}, Level: ${oldLevel}`);
            
            // Add XP
            const updatedUser = await db.addXP(userId, amount);
            const newXP = updatedUser.xp || 0;
            const newLevel = getLevelFromXP(newXP);
            
            console.log(`[XP-ADD] New XP: ${newXP}, New Level: ${newLevel}`);
            
            // Create success embed
            const embed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle('✅ XP Ajouté')
                .setDescription(
                    `**${amount} XP** a été ajouté à ${targetUser}\n\n` +
                    `**XP Total:** ${oldXP} ➜ ${newXP}\n` +
                    `**Niveau:** ${oldLevel} ➜ ${newLevel}`
                )
                .setTimestamp();
            
            await message.reply({ embeds: [embed] });
            
            // Check for level up
            if (newLevel > oldLevel) {
                console.log(`[XP-ADD] 🎉 Level up detected! ${targetUser.username} leveled up from ${oldLevel} to ${newLevel}`);
                
                // Import handleLevelUp from bot.js is not possible due to circular dependency
                // Instead, we'll trigger level-up notification manually
                await this.triggerLevelUp(client, userId, targetUser, oldLevel, newLevel, newXP);
            }
            
        } catch (error) {
            console.error('[XP-ADD] Error adding XP:', error);
            await message.reply('❌ Une erreur est survenue lors de l\'ajout d\'XP.');
        }
    },
    
    async handleRemoveXP(message, args, client) {
        try {
            // Validate arguments: !xp remove <amount> @user
            if (args.length < 3) {
                await message.reply('❌ Utilisation: `!xp remove <montant> @utilisateur`');
                return;
            }
            
            // Parse amount
            const amount = parseInt(args[1]);
            if (isNaN(amount) || amount <= 0) {
                await message.reply('❌ Le montant doit être un nombre positif valide.');
                return;
            }
            
            // Get target user
            const targetUser = message.mentions.users.first();
            if (!targetUser) {
                await message.reply('❌ Vous devez mentionner un utilisateur valide.');
                return;
            }
            
            const userId = targetUser.id;
            
            // Ensure user exists in database
            let user = await db.getUser(userId);
            if (!user) {
                await message.reply('❌ Cet utilisateur n\'existe pas dans la base de données.');
                return;
            }
            
            // Store old level for comparison
            const oldXP = user.xp || 0;
            const oldLevel = getLevelFromXP(oldXP);
            
            console.log(`[XP-REMOVE] Admin ${message.author.username} removing ${amount} XP from ${targetUser.username}`);
            console.log(`[XP-REMOVE] Current XP: ${oldXP}, Level: ${oldLevel}`);
            
            // Remove XP (negative amount)
            // Ensure XP doesn't go negative by clamping before database update
            const xpToRemove = Math.min(amount, oldXP); // Don't remove more than current XP
            const updatedUser = await db.addXP(userId, -xpToRemove);
            const newXP = updatedUser.xp || 0;
            const newLevel = getLevelFromXP(newXP);
            
            console.log(`[XP-REMOVE] New XP: ${newXP}, New Level: ${newLevel}`);
            
            // Create success embed
            const embed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setTitle('⚠️ XP Retiré')
                .setDescription(
                    `**${amount} XP** a été retiré de ${targetUser}\n\n` +
                    `**XP Total:** ${oldXP} ➜ ${newXP}\n` +
                    `**Niveau:** ${oldLevel} ➜ ${newLevel}`
                )
                .setTimestamp();
            
            await message.reply({ embeds: [embed] });
            
            // Check for level down
            if (newLevel < oldLevel) {
                console.log(`[XP-REMOVE] ⬇️ Level down detected! ${targetUser.username} went from ${oldLevel} to ${newLevel}`);
            }
            
        } catch (error) {
            console.error('[XP-REMOVE] Error removing XP:', error);
            await message.reply('❌ Une erreur est survenue lors du retrait d\'XP.');
        }
    },
    
    async triggerLevelUp(client, userId, user, oldLevel, newLevel, totalXP) {
        try {
            // Handle multiple level-ups
            for (let level = oldLevel + 1; level <= newLevel; level++) {
                console.log(`[XP-LEVELUP] Processing level ${level} for ${user.username}`);
                
                // Import and use the reward system
                const { calculateLevelReward } = require('../utils/rewardHelper');
                const reward = calculateLevelReward(level);
                
                console.log(`[XP-LEVELUP] Reward calculated for level ${level}:`, JSON.stringify(reward));
                
                // Apply LC reward if applicable
                if (reward.lcAmount && reward.lcAmount > 0) {
                    console.log(`[XP-LEVELUP] Granting ${reward.lcAmount} LC to ${user.username}`);
                    await db.updateBalance(userId, reward.lcAmount, 'level_up');
                    await db.recordTransaction(null, userId, reward.lcAmount, 'level_up', `Niveau ${level} atteint`);
                }
                
                // Apply boost if applicable
                if (reward.boost) {
                    console.log(`[XP-LEVELUP] Activating ${reward.boost.type.toUpperCase()} x${reward.boost.multiplier} boost for ${user.username}`);
                    await db.activateBoost(userId, reward.boost.type, reward.boost.multiplier, reward.boost.duration);
                }
                
                // Send level-up notification (text-only format)
                const levelsChannelId = config.channels.levelUpNotification;
                if (levelsChannelId) {
                    try {
                        const levelsChannel = await client.channels.fetch(levelsChannelId);
                        if (levelsChannel) {
                            // Get XP progress for the new level
                            const progress = getXPProgress(totalXP);
                            
                            // Determine embed color based on reward type
                            let embedColor = config.colors.primary;
                            if (reward.type === 'milestone') {
                                embedColor = config.colors.gold;
                            }
                            
                            // Create a simple, text-only embed (no thumbnails or styled canvas elements)
                            const embed = new EmbedBuilder()
                                .setColor(embedColor)
                                .setTitle('🎉 Niveau supérieur atteint ! 🎊')
                                .setDescription(
                                    `Bien bien @${userid} ! 🎯 Tu as atteint le **Niveau ${level}** ! 🏆\n\n` +
                                    `**🎁 Tiens ta récompense :** ${reward.description}\n\n` +
                                    `**📊 Progression :** ${progress.currentLevelXP} / ${progress.nextLevelXP} XP (${progress.progress}%)`
                                )
                                .setFooter({ 
                                    text: '💡Gagner de l\'XP ? Finis tes !missions, sois actif envoie des message, fais des vocs ça xp + vite et participe à des jeux!' 
                                })
                                .setTimestamp();
                            
                            // Send with mention
                            await levelsChannel.send({
                                content: `<@${userId}>`,
                                embeds: [embed]
                            });
                            
                            console.log(`✅ [XP-LEVELUP] Successfully sent level-up notification for ${user.username} (Level ${level})`);
                        }
                    } catch (error) {
                        console.error('❌ [XP-LEVELUP] Error sending level-up notification:', error.message);
                        
                        // Fallback to text notification
                        try {
                            const levelsChannel = await client.channels.fetch(levelsChannelId);
                            if (levelsChannel) {
                                const progress = getXPProgress(totalXP);
                                await levelsChannel.send(
                                    `🎉 Niveau supérieur atteint ! 🎊\n\n` +
                                    `Bien bien <@${userId}> ! 🎯 Tu as atteint le **Niveau ${level}** ! 🏆\n\n` +
                                    `**🎁 Tiens ta récompense :** ${reward.description}\n\n` +
                                    `**📊 Progression :** ${progress.currentLevelXP} / ${progress.nextLevelXP} XP (${progress.progress}%)\n\n` +
                                    `_💡Gagner de l\'XP ? Finis tes !missions, sois actif envoie des message, fais des vocs ça xp + vite et participe à des jeux!_`
                                );
                            }
                        } catch (fallbackError) {
                            console.error('❌ [XP-LEVELUP] Error sending fallback notification:', fallbackError.message);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('❌ [XP-LEVELUP] Error triggering level-up:', error.message);
            console.error('  Error stack:', error.stack);
        }
    }
};
