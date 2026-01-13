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
            // Treasure is now claimable instead of auto-assigned
            return {
                type: 'milestone',
                name: treasure.name,
                treasureRange: { min: treasure.minLC, max: treasure.maxLC },
                lcAmount: 0, // No automatic LC assignment
                boost: treasure.boost,
                description: formatMilestoneReward(treasure, null)
            };
        }
    }
    
    // Normal progression rewards - Progressive LC based on level
    // Systematic progression: each level adds +25 LC
    // Level 2: 25 LC, Level 3: 50 LC, Level 4: 75 LC
    // Level 6: 100 LC, Level 7: 125 LC, Level 8: 150 LC, Level 9: 175 LC
    
    // Calculate non-milestone count using math instead of loop for O(1) complexity
    // Formula: (level - 1) - floor(level / 5) gives count of non-milestone levels before this level
    // Examples: Level 2: (2-1) - floor(2/5) = 1-0 = 1 → 1*25 = 25 LC ✓
    //           Level 4: (4-1) - floor(4/5) = 3-0 = 3 → 3*25 = 75 LC ✓
    //           Level 6: (6-1) - floor(6/5) = 5-1 = 4 → 4*25 = 100 LC ✓
    const nonMilestoneCount = level - 1 - Math.floor(level / 5);
    
    const lcReward = nonMilestoneCount * 25;
    return {
        type: 'lc',
        lcAmount: lcReward,
        boost: null,
        description: `+${lcReward} LC 💰`
    };
}

/**
 * Format milestone reward description
 * @param {object} treasure - Treasure configuration
 * @param {number|null} lcAmount - Actual LC amount awarded (null if claimable)
 * @returns {string} - Formatted description
 */
function formatMilestoneReward(treasure, lcAmount) {
    let description = lcAmount !== null 
        ? `${treasure.name}: ${lcAmount} LC 💰`
        : `${treasure.name} 🗝️ (À réclamer)`;
    
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
        description = `Un **${reward.name}** est disponible ! 🗝️\nUtilisez la commande \`!trésor\` pour le réclamer et découvrir votre gain.`;
        
        if (reward.boost) {
            const boostIcon = reward.boost.type === 'xp' ? '⚡' : '💎';
            description += `\n\n**Bonus activé :** x${reward.boost.multiplier} ${reward.boost.type.toUpperCase()} Boost (1h) ${boostIcon}`;
        }
        
        // Add motivational text for milestones
        const nextMilestone = Math.ceil((level + 1) / 5) * 5;
        description += `\n\nContinuez à progresser pour atteindre le niveau ${nextMilestone} et débloquer un nouveau trésor !`;
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
