/**
 * Reward System Helper
 * 
 * This module handles reward calculations for level-ups including:
 * - Fixed LC rewards for even levels
 * - Boost bonuses (x2 XP or x2 LC) for odd levels
 * - Milestone treasures with randomized ranges for special levels
 */

/**
 * Check if a level is a milestone level (1, 5, 10, 15, 20, etc.)
 * Milestones are at level 1 and every 5 levels thereafter
 * @param {number} level - The level to check
 * @returns {boolean} - True if milestone level
 */
function isMilestoneLevel(level) {
    return level === 1 || level % 5 === 0;
}

/**
 * Get milestone treasure configuration for a given level
 * @param {number} level - The milestone level
 * @returns {object|null} - Treasure config or null if not a milestone
 */
function getMilestoneTreasure(level) {
    if (level === 1) {
        return {
            name: 'Petit trésor',
            minLC: 15,
            maxLC: 35,
            boost: null
        };
    } else if (level === 5) {
        return {
            name: 'Grand trésor',
            minLC: 75,
            maxLC: 100,
            boost: null
        };
    } else if (level === 10) {
        return {
            name: 'Trésor épique',
            minLC: 200,
            maxLC: 300,
            boost: {
                type: 'xp',
                multiplier: 2,
                duration: 3600 // 1 hour in seconds
            }
        };
    } else if (level % 5 === 0) {
        // For levels 15, 20, 25, 30, etc. - legendary treasures
        const tier = Math.floor(level / 5);
        
        // Base values for legendary treasures (levels 15-20)
        const baseMinLC = 300;
        const baseMaxLC = 400;
        
        // Scale up for levels beyond 20 (tier > 4)
        const tierDiff = Math.max(0, tier - 4);
        
        return {
            name: 'Trésor légendaire',
            minLC: baseMinLC + tierDiff * 50,
            maxLC: baseMaxLC + tierDiff * 75,
            boost: {
                // Alternate between lc and xp boosts: odd tiers get lc, even get xp
                type: tier % 2 === 1 ? 'lc' : 'xp',
                multiplier: 2,
                duration: 3600
            }
        };
    }
    
    return null;
}

/**
 * Calculate reward for a level-up
 * @param {number} level - New level reached
 * @returns {object} - Reward object with type, amount, and description
 */
function calculateLevelReward(level) {
    // Check for milestone level first
    if (isMilestoneLevel(level)) {
        const treasure = getMilestoneTreasure(level);
        if (treasure) {
            // Random LC amount within range
            const lcAmount = Math.floor(Math.random() * (treasure.maxLC - treasure.minLC + 1)) + treasure.minLC;
            
            return {
                type: 'milestone',
                name: treasure.name,
                lcAmount: lcAmount,
                boost: treasure.boost,
                description: formatMilestoneReward(treasure, lcAmount)
            };
        }
    }
    
    // Normal progression rewards
    if (level % 2 === 0) {
        // Even levels: Fixed LC reward
        return {
            type: 'lc',
            lcAmount: 20,
            boost: null,
            description: '+20 LC 💰'
        };
    } else {
        // Odd levels: Boost (alternating between XP and LC)
        // Pattern: levels 1,9,17,25... get XP boost, levels 3,7,11,15,19,23... get LC boost
        // This is achieved by: (level % 4 === 1) gives XP, otherwise LC
        const boostType = (level % 4 === 1) ? 'xp' : 'lc';
        return {
            type: 'boost',
            lcAmount: 0,
            boost: {
                type: boostType,
                multiplier: 2,
                duration: 3600 // 1 hour
            },
            description: boostType === 'xp' ? 'x2 XP Boost (1h) ⚡' : 'x2 LC Boost (1h) 💎'
        };
    }
}

/**
 * Format milestone reward description
 * @param {object} treasure - Treasure configuration
 * @param {number} lcAmount - Actual LC amount awarded
 * @returns {string} - Formatted description
 */
function formatMilestoneReward(treasure, lcAmount) {
    let description = `${treasure.name}: ${lcAmount} LC 💰`;
    
    if (treasure.boost) {
        const boostIcon = treasure.boost.type === 'xp' ? '⚡' : '💎';
        description += ` + x${treasure.boost.multiplier} ${treasure.boost.type.toUpperCase()} Boost (1h) ${boostIcon}`;
    }
    
    return description;
}

/**
 * Format reward for embed display
 * @param {object} reward - Reward object from calculateLevelReward
 * @param {number} level - Current level
 * @returns {object} - Object with title and description for embed
 */
function formatRewardEmbed(reward, level) {
    let title = '🎁 Récompense débloquée';
    let description = '';
    
    if (reward.type === 'milestone') {
        title = `🎁 ${reward.name} débloqué !`;
        description = `Gain de **${reward.lcAmount} LC** 💰`;
        
        if (reward.boost) {
            const boostIcon = reward.boost.type === 'xp' ? '⚡' : '💎';
            description += `\n**x${reward.boost.multiplier} ${reward.boost.type.toUpperCase()} Boost activé** (1h) ${boostIcon}`;
        }
        
        // Add motivational text for milestones
        const nextMilestone = Math.ceil((level + 1) / 5) * 5;
        description += `\n\nContinuez à progresser pour atteindre le niveau ${nextMilestone} et débloquer un nouveau trésor !`;
    } else if (reward.type === 'boost') {
        const boostType = reward.boost.type === 'xp' ? 'XP' : 'LC';
        const boostIcon = reward.boost.type === 'xp' ? '⚡' : '💎';
        description = `**x${reward.boost.multiplier} ${boostType} Boost activé** (1h) ${boostIcon}`;
    } else if (reward.type === 'lc') {
        description = `Gain de **${reward.lcAmount} LC** 💰`;
    }
    
    return { title, description };
}

module.exports = {
    isMilestoneLevel,
    getMilestoneTreasure,
    calculateLevelReward,
    formatRewardEmbed
};
