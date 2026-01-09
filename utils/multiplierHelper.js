const { db } = require('../database/db');

/**
 * Helper module for managing multiplier bonuses in games
 */
module.exports = {
    /**
     * Check if a player has an active multiplier and return its value
     * @param {string} userId - The user's Discord ID
     * @returns {Promise<{hasMultiplier: boolean, multiplier: number, gamesRemaining: number}>}
     */
    async getPlayerMultiplier(userId) {
        const activeMultiplier = await db.getActiveMultiplier(userId);
        
        if (activeMultiplier) {
            return {
                hasMultiplier: true,
                multiplier: activeMultiplier.multiplier_value,
                gamesRemaining: activeMultiplier.games_remaining
            };
        }
        
        return {
            hasMultiplier: false,
            multiplier: 1,
            gamesRemaining: 0
        };
    },

    /**
     * Apply multiplier to LC winnings and decrement games remaining
     * @param {string} userId - The user's Discord ID
     * @param {number} baseWinnings - The base LC winnings before multiplier
     * @returns {Promise<{finalWinnings: number, multiplierUsed: boolean, multiplierValue: number}>}
     */
    async applyMultiplier(userId, baseWinnings) {
        const activeMultiplier = await db.getActiveMultiplier(userId);
        
        if (!activeMultiplier || baseWinnings <= 0) {
            return {
                finalWinnings: baseWinnings,
                multiplierUsed: false,
                multiplierValue: 1
            };
        }

        // Calculate final winnings with multiplier
        const finalWinnings = Math.floor(baseWinnings * activeMultiplier.multiplier_value);

        // Decrement games remaining
        await db.decrementMultiplierGames(userId);

        // Clean up expired multipliers
        await db.deleteExpiredMultipliers(userId);

        return {
            finalWinnings,
            multiplierUsed: true,
            multiplierValue: activeMultiplier.multiplier_value
        };
    },

    /**
     * Get a notification message for active multiplier
     * @param {number} multiplierValue - The multiplier value (2 or 3)
     * @param {number} gamesRemaining - Number of games remaining
     * @returns {string}
     */
    getMultiplierNotification(multiplierValue, gamesRemaining) {
        return `🎫 **Multiplieur x${multiplierValue} activé!** Vos ${gamesRemaining} prochaine(s) partie(s) donneront **x${multiplierValue} LC**.`;
    },

    /**
     * Get a message indicating multiplier was applied to winnings
     * @param {number} baseWinnings - Base winnings before multiplier
     * @param {number} finalWinnings - Final winnings after multiplier
     * @param {number} multiplierValue - The multiplier value used
     * @returns {string}
     */
    getMultiplierAppliedMessage(baseWinnings, finalWinnings, multiplierValue) {
        return `🎫 Multiplieur x${multiplierValue} appliqué! (${baseWinnings} LC → ${finalWinnings} LC)`;
    }
};
