/**
 * XP and Leveling System Helper
 * 
 * This module handles all XP calculations and level progression logic
 * for the virtuous-surprise bot's leveling system.
 */

// XP Configuration
const XP_CONFIG = {
    // Game participation XP
    GAME_WIN: 15,
    GAME_LOSS: 5,
    
    // Message activity XP
    MESSAGE_MIN: 1,
    MESSAGE_MAX: 3,
    MESSAGE_COOLDOWN_MS: 60000, // 1 minute
    
    // Voice chat XP
    VOICE_XP_INTERVAL_MS: 120000, // 2 minutes
    VOICE_XP_PER_INTERVAL: 1,
    VOICE_HOUR_BONUS: 25,
    VOICE_MIN_USERS: 2,
    VOICE_BONUS_PER_EXTRA_USER: 2,
    
    // Reaction XP
    REACTION_XP: 2,
    REACTION_MAX_PER_MESSAGE: 10,
};

/**
 * Calculate XP required for a given level
 * Uses a progressive formula: level * 100
 * @param {number} level - The level to calculate XP for
 * @returns {number} - XP required for that level
 */
function getXPForLevel(level) {
    return level * 100;
}

/**
 * Calculate the level for a given XP amount
 * @param {number} xp - Total XP
 * @returns {number} - Current level
 */
function getLevelFromXP(xp) {
    let level = 1;
    let totalXPNeeded = 0;
    
    while (totalXPNeeded + getXPForLevel(level) <= xp) {
        totalXPNeeded += getXPForLevel(level);
        level++;
    }
    
    return level;
}

/**
 * Calculate XP progress to next level
 * @param {number} xp - Total XP
 * @returns {object} - Object containing level, currentLevelXP, nextLevelXP, and progress percentage
 */
function getXPProgress(xp) {
    const level = getLevelFromXP(xp);
    
    // Calculate total XP needed up to current level
    let totalXPForCurrentLevel = 0;
    for (let i = 1; i < level; i++) {
        totalXPForCurrentLevel += getXPForLevel(i);
    }
    
    const currentLevelXP = xp - totalXPForCurrentLevel;
    const nextLevelXP = getXPForLevel(level);
    const progress = (currentLevelXP / nextLevelXP) * 100;
    
    return {
        level,
        currentLevelXP,
        nextLevelXP,
        progress: Math.floor(progress)
    };
}

/**
 * Calculate random XP for message activity (1-3 XP)
 * @returns {number} - Random XP amount
 */
function getMessageXP() {
    return Math.floor(Math.random() * (XP_CONFIG.MESSAGE_MAX - XP_CONFIG.MESSAGE_MIN + 1)) + XP_CONFIG.MESSAGE_MIN;
}

/**
 * Calculate game participation XP
 * @param {string} result - 'win' or 'loss'
 * @returns {number} - XP earned
 */
function getGameXP(result) {
    if (result === 'win') {
        return XP_CONFIG.GAME_WIN;
    } else if (result === 'loss') {
        return XP_CONFIG.GAME_LOSS;
    }
    return 0;
}

/**
 * Calculate voice chat XP based on user count
 * @param {number} userCount - Number of users in voice channel
 * @returns {number} - XP earned per interval
 */
function getVoiceXP(userCount) {
    if (userCount < XP_CONFIG.VOICE_MIN_USERS) {
        return 0;
    }
    
    const baseXP = XP_CONFIG.VOICE_XP_PER_INTERVAL;
    const extraUsers = Math.max(0, userCount - XP_CONFIG.VOICE_MIN_USERS);
    const bonusXP = extraUsers * XP_CONFIG.VOICE_BONUS_PER_EXTRA_USER;
    
    return baseXP + bonusXP;
}

/**
 * Check if enough time has passed since last message XP grant
 * @param {Date|null} lastMessageXPTime - Timestamp of last XP grant
 * @returns {boolean} - True if XP should be granted
 */
function canGrantMessageXP(lastMessageXPTime) {
    if (!lastMessageXPTime) {
        return true;
    }
    
    const now = Date.now();
    const lastTime = new Date(lastMessageXPTime).getTime();
    return (now - lastTime) >= XP_CONFIG.MESSAGE_COOLDOWN_MS;
}

/**
 * Calculate reaction XP (max 10 XP per message)
 * @param {number} reactionCount - Number of reactions received
 * @param {number} currentXP - XP already earned from this message
 * @returns {number} - Additional XP to grant
 */
function getReactionXP(reactionCount, currentXP = 0) {
    const potentialXP = reactionCount * XP_CONFIG.REACTION_XP;
    const maxAllowed = Math.max(0, XP_CONFIG.REACTION_MAX_PER_MESSAGE - currentXP);
    return Math.min(potentialXP, maxAllowed);
}

module.exports = {
    XP_CONFIG,
    getXPForLevel,
    getLevelFromXP,
    getXPProgress,
    getMessageXP,
    getGameXP,
    getVoiceXP,
    canGrantMessageXP,
    getReactionXP
};
