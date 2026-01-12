const lcEventEmitter = require('./lcEventEmitter');
const { db } = require('../database/db');
const config = require('../config.json');

// Constants
const TOP_RANKINGS_LIMIT = 10;

/**
 * Rankings Manager
 * Handles dynamic rankings updates triggered by LC changes
 * Implements smart debouncing and position change detection
 */
class RankingsManager {
    constructor() {
        // Track recent LC changes
        this.pendingUpdates = new Set();
        
        // Debounce timer
        this.updateTimer = null;
        
        // Minimum time between updates (30 seconds to avoid spam)
        this.MIN_UPDATE_INTERVAL_MS = 30000;
        
        // Maximum time to wait before forcing an update (2 minutes)
        this.MAX_UPDATE_DELAY_MS = 120000;
        
        // Last update timestamp
        this.lastUpdateTime = 0;
        
        // Rankings command reference (will be set during initialization)
        this.rankingsCommand = null;
        this.client = null;
        
        // Cache for position tracking
        this.lastRankingsCache = new Map(); // userId -> position
        
        // Cache for rankings channel
        this.rankingsChannel = null;
        
        // Bind LC change handler
        this.handleLCChange = this.handleLCChange.bind(this);
    }

    /**
     * Initialize the rankings manager
     * @param {Client} client - Discord client
     * @param {Object} rankingsCommand - Rankings command module
     */
    async initialize(client, rankingsCommand) {
        // Validate parameters
        if (!client) {
            throw new Error('Rankings Manager: client parameter is required');
        }
        if (!rankingsCommand) {
            throw new Error('Rankings Manager: rankingsCommand parameter is required');
        }
        
        this.client = client;
        this.rankingsCommand = rankingsCommand;
        
        // Pre-fetch and cache the rankings channel
        const rankingsChannelId = config.channels.rankings;
        if (rankingsChannelId) {
            try {
                this.rankingsChannel = await client.channels.fetch(rankingsChannelId);
                console.log(`✅ Rankings channel cached: #${this.rankingsChannel.name}`);
            } catch (error) {
                console.error('⚠️ Failed to cache rankings channel:', error.message);
                console.error('   Rankings notifications will be disabled');
            }
        } else {
            console.warn('⚠️ Rankings channel ID not configured');
        }
        
        // Subscribe to LC change events
        lcEventEmitter.onLCChange(this.handleLCChange);
        
        console.log('✅ Rankings Manager initialized and listening for LC changes');
    }

    /**
     * Handle LC change events
     * @param {Object} changeEvent - LC change event data
     */
    handleLCChange(changeEvent) {
        const { userId, oldBalance, newBalance, reason } = changeEvent;
        
        console.log(`📊 LC Change detected: User ${userId}, ${oldBalance} -> ${newBalance} (${reason})`);
        
        // Add to pending updates
        this.pendingUpdates.add(userId);
        
        // Schedule an update
        this.scheduleUpdate();
    }

    /**
     * Schedule a rankings update with smart debouncing
     */
    scheduleUpdate() {
        const now = Date.now();
        const timeSinceLastUpdate = now - this.lastUpdateTime;
        
        // If we have a timer already, check if we should trigger early
        if (this.updateTimer) {
            const timeUntilMaxDelay = this.MAX_UPDATE_DELAY_MS - timeSinceLastUpdate;
            
            // If we're approaching max delay, trigger now
            if (timeUntilMaxDelay <= 1000) {
                clearTimeout(this.updateTimer);
                this.triggerUpdate();
                return;
            }
            
            // Otherwise, let the existing timer handle it
            return;
        }
        
        // Calculate delay before next update
        let delay;
        
        if (timeSinceLastUpdate < this.MIN_UPDATE_INTERVAL_MS) {
            // Too soon, wait for minimum interval
            delay = this.MIN_UPDATE_INTERVAL_MS - timeSinceLastUpdate;
        } else {
            // Can update now, but debounce for a bit to batch changes
            delay = 5000; // 5 second debounce
        }
        
        // Don't exceed max delay
        const maxAllowedDelay = Math.max(0, this.MAX_UPDATE_DELAY_MS - timeSinceLastUpdate);
        delay = Math.min(delay, maxAllowedDelay);
        
        console.log(`⏰ Scheduling rankings update in ${delay}ms`);
        
        // Schedule the update
        this.updateTimer = setTimeout(() => {
            this.triggerUpdate();
        }, delay);
    }

    /**
     * Trigger a rankings update
     */
    async triggerUpdate() {
        // Clear the timer
        this.updateTimer = null;
        
        if (this.pendingUpdates.size === 0) {
            return;
        }
        
        // Validate manager is initialized
        if (!this.client || !this.rankingsCommand) {
            console.error('❌ Rankings Manager not properly initialized, skipping update');
            this.pendingUpdates.clear();
            return;
        }
        
        try {
            console.log(`🔄 Triggering dynamic rankings update (${this.pendingUpdates.size} users changed)`);
            
            // Get current rankings before update
            const oldRankings = await this.getCurrentRankings();
            
            // Update rankings display
            await this.rankingsCommand.updateRankingsChannel(this.client);
            
            // Get new rankings after update
            const newRankings = await this.getCurrentRankings();
            
            // Check for position changes and notify users
            await this.notifyPositionChanges(oldRankings, newRankings);
            
            // Update last update time
            this.lastUpdateTime = Date.now();
            
            // Clear pending updates
            this.pendingUpdates.clear();
            
            console.log('✅ Dynamic rankings update completed');
        } catch (error) {
            console.error('❌ Error during dynamic rankings update:', error.message);
            
            // Clear pending updates to avoid stuck state
            this.pendingUpdates.clear();
        }
    }

    /**
     * Get current LC rankings
     * @returns {Map} Map of userId to position
     */
    async getCurrentRankings() {
        try {
            const topLC = await db.getTopLC(TOP_RANKINGS_LIMIT);
            const rankings = new Map();
            
            topLC.forEach((user, index) => {
                rankings.set(user.user_id, {
                    position: index + 1,
                    balance: user.balance
                });
            });
            
            return rankings;
        } catch (error) {
            console.error('Error fetching current rankings:', error.message);
            return new Map();
        }
    }

    /**
     * Notify users of position changes in rankings
     * @param {Map} oldRankings - Previous rankings
     * @param {Map} newRankings - New rankings
     */
    async notifyPositionChanges(oldRankings, newRankings) {
        try {
            // Use cached channel
            if (!this.rankingsChannel) {
                console.log('⚠️ Rankings channel not available for notifications');
                return;
            }
            
            // Check each user who had an LC change
            for (const userId of this.pendingUpdates) {
                const oldData = oldRankings.get(userId);
                const newData = newRankings.get(userId);
                
                try {
                    // User entered top 10
                    if (!oldData && newData) {
                        const medal = newData.position <= 3 ? ['🥇', '🥈', '🥉'][newData.position - 1] : `#${newData.position}`;
                        await this.rankingsChannel.send(`🎉 <@${userId}> a rejoint le Top ${TOP_RANKINGS_LIMIT} LC ! ${medal}`);
                    }
                    // User improved position in top 10
                    else if (oldData && newData && newData.position < oldData.position) {
                        const gained = oldData.position - newData.position;
                        const medal = newData.position <= 3 ? ['🥇', '🥈', '🥉'][newData.position - 1] : `#${newData.position}`;
                        await this.rankingsChannel.send(`📈 <@${userId}> a gagné ${gained} place(s) dans le classement LC ! ${medal}`);
                    }
                    // User dropped position in top 10
                    else if (oldData && newData && newData.position > oldData.position) {
                        const lost = newData.position - oldData.position;
                        await this.rankingsChannel.send(`📉 <@${userId}> a perdu ${lost} place(s) dans le classement LC. Position actuelle: #${newData.position}`);
                    }
                    // User fell out of top 10
                    else if (oldData && !newData) {
                        await this.rankingsChannel.send(`😢 <@${userId}> a quitté le Top ${TOP_RANKINGS_LIMIT} LC.`);
                    }
                } catch (sendError) {
                    console.error(`⚠️ Failed to send notification for user ${userId}:`, sendError.message);
                    // Continue with other notifications even if one fails
                }
            }
        } catch (error) {
            console.error('Error notifying position changes:', error.message);
        }
    }

    /**
     * Cleanup method
     */
    destroy() {
        if (this.updateTimer) {
            clearTimeout(this.updateTimer);
            this.updateTimer = null;
        }
        
        lcEventEmitter.offLCChange(this.handleLCChange);
        console.log('✅ Rankings Manager destroyed');
    }
}

// Export singleton instance
const rankingsManager = new RankingsManager();
module.exports = rankingsManager;
