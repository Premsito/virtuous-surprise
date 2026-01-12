const { EventEmitter } = require('events');

/**
 * Centralized event emitter for LC (balance) changes
 * This allows different parts of the application to react to balance changes
 * in real-time without tight coupling
 */
class LCEventEmitter extends EventEmitter {
    /**
     * Emit an LC change event
     * @param {string} userId - User ID whose balance changed
     * @param {number} oldBalance - Previous balance
     * @param {number} newBalance - New balance
     * @param {string} reason - Reason for the change (e.g., 'game_win', 'transfer', 'level_up')
     */
    emitLCChange(userId, oldBalance, newBalance, reason = 'unknown') {
        this.emit('lcChange', {
            userId,
            oldBalance,
            newBalance,
            change: newBalance - oldBalance,
            reason,
            timestamp: Date.now()
        });
    }

    /**
     * Subscribe to LC change events
     * @param {Function} callback - Callback function to handle LC changes
     */
    onLCChange(callback) {
        this.on('lcChange', callback);
    }

    /**
     * Unsubscribe from LC change events
     * @param {Function} callback - Callback function to remove
     */
    offLCChange(callback) {
        this.off('lcChange', callback);
    }
}

// Export a singleton instance
const lcEventEmitter = new LCEventEmitter();
module.exports = lcEventEmitter;
