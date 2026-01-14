const { EventEmitter } = require('events');

/**
 * Centralized event emitter for Niveau (level) changes
 * This allows different parts of the application to react to level changes
 * in real-time without tight coupling
 */
class NiveauEventEmitter extends EventEmitter {
    /**
     * Emit a Niveau change event
     * @param {string} userId - User ID whose level changed
     * @param {number} oldLevel - Previous level
     * @param {number} newLevel - New level
     * @param {string} reason - Reason for the change (e.g., 'xp_gain', 'admin_set')
     */
    emitNiveauChange(userId, oldLevel, newLevel, reason = 'unknown') {
        this.emit('niveauChange', {
            userId,
            oldLevel,
            newLevel,
            change: newLevel - oldLevel,
            reason,
            timestamp: Date.now()
        });
    }

    /**
     * Subscribe to Niveau change events
     * @param {Function} callback - Callback function to handle Niveau changes
     */
    onNiveauChange(callback) {
        this.on('niveauChange', callback);
    }

    /**
     * Unsubscribe from Niveau change events
     * @param {Function} callback - Callback function to remove
     */
    offNiveauChange(callback) {
        this.off('niveauChange', callback);
    }
}

// Export a singleton instance
const niveauEventEmitter = new NiveauEventEmitter();
module.exports = niveauEventEmitter;
