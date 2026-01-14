/**
 * Game XP Integration Helper
 * 
 * This module provides a centralized way for game commands to grant XP
 * for game participation (wins and losses).
 */

const { db } = require('../database/db');
const { getGameXP, getLevelFromXP } = require('./xpHelper');
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
                
                // Send level up notification to the dedicated #niveaux channel
                if (message && message.client) {
                    try {
                        const levelUpChannelId = config.channels.levelUpNotification;
                        
                        // Validate channel ID
                        if (!levelUpChannelId) {
                            console.error(`[ERROR] Level-up channel (#niveaux) not configured in config.json`);
                        } else {
                            const levelUpChannel = await message.client.channels.fetch(levelUpChannelId).catch(err => {
                                console.error(`[ERROR] Level-up channel (#niveaux) not found with ID ${levelUpChannelId}:`, err.message);
                                return null;
                            });
                            
                            if (levelUpChannel) {
                                const embed = new EmbedBuilder()
                                    .setTitle('🎉 Niveau supérieur atteint ! 🎊')
                                    .setColor('#3498DB')
                                    .setDescription(`<@${userId}> vient de passer **Niveau ${newLevel}** ! 🏆`)
                                    .setTimestamp();
                                
                                await levelUpChannel.send({ embeds: [embed] });
                                console.log(`[DEBUG] Level-up message sent: User ${userId} (${username || 'unknown'}) -> Level ${newLevel}`);
                            } else {
                                console.error(`[ERROR] Level-up channel (#niveaux) not found with ID ${levelUpChannelId}`);
                            }
                        }
                    } catch (error) {
                        console.error('[ERROR] Error sending level up notification from game:', error.message);
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
