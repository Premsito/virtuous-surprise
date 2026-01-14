/**
 * Game XP Integration Helper
 * 
 * This module provides a centralized way for game commands to grant XP
 * for game participation (wins and losses).
 */

const { db } = require('../database/db');
const { getGameXP, getLevelFromXP, getXPProgress } = require('./xpHelper');
const { calculateLevelReward } = require('./rewardHelper');
const config = require('../config.json');
const { EmbedBuilder } = require('discord.js');

/**
 * Grant XP for game participation and check for level up
 * @param {string} userId - User ID
 * @param {string} username - Username for user creation if needed
 * @param {string} result - 'win' or 'loss'
 * @param {Object} message - Discord message object (optional, for level up notification)
 * @returns {Object} - { xpGained, oldLevel, newLevel, leveledUp }
 */
async function grantGameXP(userId, username, result, message = null) {
    try {
        // Ensure user exists
        let user = await db.getUser(userId);
        if (!user) {
            user = await db.createUser(userId, username);
        }
        
        // Calculate XP
        const xpGained = getGameXP(result);
        
        if (xpGained > 0) {
            const oldLevel = getLevelFromXP(user.xp || 0);
            
            // Grant XP
            const updatedUser = await db.addXP(userId, xpGained);
            const newLevel = getLevelFromXP(updatedUser.xp);
            
            // Check for level up
            const leveledUp = newLevel > oldLevel;
            if (leveledUp) {
                await db.updateLevel(userId, newLevel);
                
                // Send detailed level up notification to the dedicated #niveaux channel
                if (message && message.client) {
                    try {
                        const levelUpChannelId = config.channels.levelUpNotification;
                        
                        // Validate channel ID
                        if (!levelUpChannelId) {
                            console.error(`[ERROR] Level-up channel (#niveaux) not configured in config.json`);
                        } else {
                            console.log(`[LEVEL-UP] Game XP triggered level-up for ${username} (Level ${newLevel})`);
                            
                            const levelUpChannel = await message.client.channels.fetch(levelUpChannelId).catch(err => {
                                console.error(`[ERROR] Level-up channel (#niveaux) not found with ID ${levelUpChannelId}:`, err.message);
                                return null;
                            });
                            
                            if (levelUpChannel) {
                                // Calculate reward for this level
                                const reward = calculateLevelReward(newLevel);
                                console.log(`[LEVEL-UP] Reward calculated for game level-up: ${JSON.stringify(reward)}`);
                                
                                // Apply LC reward if applicable
                                if (reward.lcAmount > 0 && reward.type !== 'milestone') {
                                    console.log(`[LEVEL-UP] Granting ${reward.lcAmount} LC from game to ${username}`);
                                    await db.updateBalance(userId, reward.lcAmount, 'level_up');
                                    await db.recordTransaction(null, userId, reward.lcAmount, 'level_up', `Niveau ${newLevel} atteint`);
                                }
                                
                                // Apply boost if applicable
                                if (reward.boost) {
                                    console.log(`[LEVEL-UP] Activating ${reward.boost.type.toUpperCase()} x${reward.boost.multiplier} boost from game (${reward.boost.duration}s)`);
                                    await db.activateBoost(userId, reward.boost.type, reward.boost.multiplier, reward.boost.duration);
                                }
                                
                                // Get XP progress
                                const progress = getXPProgress(updatedUser.xp);
                                
                                // Determine embed color based on reward type
                                let embedColor = config.colors.primary;
                                if (reward.type === 'milestone') {
                                    embedColor = config.colors.gold;
                                }
                                
                                // Create progress bar visualization
                                const progressBarLength = 20;
                                const filledBars = Math.floor((progress.progress / 100) * progressBarLength);
                                const emptyBars = progressBarLength - filledBars;
                                const progressBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);
                                
                                // Create detailed embed matching bot.js format
                                const embed = new EmbedBuilder()
                                    .setColor(embedColor)
                                    .setTitle('🎉 Niveau supérieur atteint ! 🎊')
                                    .setDescription(
                                        `Félicitations <@${userId}> ! 🎯\n` +
                                        `Tu viens de passer **Niveau ${newLevel}** ! 🏆`
                                    )
                                    .addFields(
                                        {
                                            name: '🎁 Récompense débloquée',
                                            value: reward.description,
                                            inline: false
                                        },
                                        {
                                            name: '📊 Progression XP',
                                            value: `**${progress.currentLevelXP}** / **${progress.nextLevelXP}** XP (**${progress.progress}%**)\n` +
                                                   `${progressBar}`,
                                            inline: false
                                        }
                                    )
                                    .setFooter({ 
                                        text: '💡 Gagner de l\'XP ? Fait des !missions, participe à des jeux, envoie des messages et surtout participe à des vocs!' 
                                    })
                                    .setTimestamp();
                                
                                await levelUpChannel.send({
                                    content: `<@${userId}>`,
                                    embeds: [embed]
                                });
                                console.log(`✅ [LEVEL-UP] Successfully sent detailed level-up message from game for ${username} (Level ${newLevel})`);
                            } else {
                                console.error(`[ERROR] Level-up channel (#niveaux) not found with ID ${levelUpChannelId}`);
                            }
                        }
                    } catch (error) {
                        console.error('[ERROR] Error sending level up notification from game:', error.message);
                        console.error('  Error stack:', error.stack);
                    }
                }
            }
            
            return {
                xpGained,
                oldLevel,
                newLevel,
                leveledUp
            };
        }
        
        return {
            xpGained: 0,
            oldLevel: getLevelFromXP(user.xp || 0),
            newLevel: getLevelFromXP(user.xp || 0),
            leveledUp: false
        };
    } catch (error) {
        console.error('Error granting game XP:', error);
        return {
            xpGained: 0,
            oldLevel: 0,
            newLevel: 0,
            leveledUp: false
        };
    }
}

module.exports = {
    grantGameXP
};
