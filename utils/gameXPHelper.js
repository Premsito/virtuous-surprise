/**
 * Game XP Integration Helper
 * 
 * This module provides a centralized way for game commands to grant XP
 * for game participation (wins and losses).
 */

const { db } = require('../database/db');
const { getGameXP, getLevelFromXP } = require('./xpHelper');
const { generateLevelUpCard } = require('./levelUpCardHelper');
const config = require('../config.json');

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
                // Give trésor reward for level up
                await db.addInventoryItem(userId, 'tresor', 1);
                
                // Send card-based level up notification to dedicated channel
                if (message && message.client) {
                    try {
                        const levelUpChannelId = config.channels.levelUpNotification;
                        const levelUpChannel = await message.client.channels.fetch(levelUpChannelId);
                        if (levelUpChannel) {
                            const member = await message.guild.members.fetch(userId);
                            const card = await generateLevelUpCard({
                                username: member.user.username,
                                avatarURL: member.user.displayAvatarURL({ extension: 'png', size: 256 }),
                                level: newLevel,
                                xp: updatedUser.xp,
                                reward: 'Trésor 🗝️'
                            });
                            await levelUpChannel.send({
                                content: `🎉 **Bravo <@${userId}>** 🎉`,
                                files: [card]
                            });
                        }
                    } catch (error) {
                        console.error('Error sending level up notification:', error.message);
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
