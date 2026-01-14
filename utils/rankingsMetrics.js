/**
 * Rankings Metrics Tracker
 * Tracks success and failure rates of rankings updates for monitoring
 */
class RankingsMetrics {
    constructor() {
        this.totalUpdates = 0;
        this.successfulUpdates = 0;
        this.failedUpdates = 0;
        this.lastUpdateTime = null;
        this.lastSuccessTime = null;
        this.lastFailureTime = null;
        this.lastFailureReason = null;
        this.updateDurations = [];
        this.maxDurationHistory = 50; // Keep last 50 update durations
    }

    /**
     * Record a successful update
     * @param {number} duration - Update duration in milliseconds
     */
    recordSuccess(duration) {
        this.totalUpdates++;
        this.successfulUpdates++;
        this.lastUpdateTime = Date.now();
        this.lastSuccessTime = Date.now();
        
        // Track duration
        this.updateDurations.push(duration);
        if (this.updateDurations.length > this.maxDurationHistory) {
            this.updateDurations.shift();
        }
    }

    /**
     * Record a failed update
     * @param {string} reason - Failure reason
     */
    recordFailure(reason) {
        this.totalUpdates++;
        this.failedUpdates++;
        this.lastUpdateTime = Date.now();
        this.lastFailureTime = Date.now();
        this.lastFailureReason = reason;
    }

    /**
     * Get success rate
     * @returns {number} Success rate as percentage (0-100)
     */
    getSuccessRate() {
        if (this.totalUpdates === 0) return 0;
        return (this.successfulUpdates / this.totalUpdates) * 100;
    }

    /**
     * Get average update duration
     * @returns {number} Average duration in milliseconds
     */
    getAverageDuration() {
        if (this.updateDurations.length === 0) return 0;
        const sum = this.updateDurations.reduce((a, b) => a + b, 0);
        return sum / this.updateDurations.length;
    }

    /**
     * Get metrics summary
     * @returns {Object} Summary of all metrics
     */
    getSummary() {
        return {
            totalUpdates: this.totalUpdates,
            successfulUpdates: this.successfulUpdates,
            failedUpdates: this.failedUpdates,
            successRate: this.getSuccessRate().toFixed(2) + '%',
            averageDuration: this.getAverageDuration().toFixed(2) + 'ms',
            lastUpdateTime: this.lastUpdateTime ? new Date(this.lastUpdateTime).toISOString() : 'Never',
            lastSuccessTime: this.lastSuccessTime ? new Date(this.lastSuccessTime).toISOString() : 'Never',
            lastFailureTime: this.lastFailureTime ? new Date(this.lastFailureTime).toISOString() : 'Never',
            lastFailureReason: this.lastFailureReason || 'N/A'
        };
    }

    /**
     * Print metrics to console
     */
    printSummary() {
        console.log('\n📊 Rankings Update Metrics Summary');
        console.log('=====================================');
        const summary = this.getSummary();
        Object.entries(summary).forEach(([key, value]) => {
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            console.log(`   ${label}: ${value}`);
        });
        console.log('=====================================\n');
    }

    /**
     * Reset all metrics
     */
    reset() {
        this.totalUpdates = 0;
        this.successfulUpdates = 0;
        this.failedUpdates = 0;
        this.lastUpdateTime = null;
        this.lastSuccessTime = null;
        this.lastFailureTime = null;
        this.lastFailureReason = null;
        this.updateDurations = [];
    }
}

// Export singleton instance
const rankingsMetrics = new RankingsMetrics();
module.exports = rankingsMetrics;
