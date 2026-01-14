/**
 * Test: Rankings Metrics Module
 * 
 * This test validates the metrics tracking functionality
 * without requiring a database connection
 */

const rankingsMetrics = require('./utils/rankingsMetrics');

function runTests() {
    console.log('🧪 Testing Rankings Metrics Module\n');
    
    try {
        // Test 1: Initial state
        console.log('📋 Test 1: Verify initial state...');
        const initialSummary = rankingsMetrics.getSummary();
        
        if (initialSummary.totalUpdates !== 0) {
            throw new Error('Expected totalUpdates to be 0 initially');
        }
        if (rankingsMetrics.getSuccessRate() !== 0) {
            throw new Error('Expected success rate to be 0 initially');
        }
        console.log('   ✅ Initial state correct\n');
        
        // Test 2: Record successful update
        console.log('📋 Test 2: Record successful updates...');
        rankingsMetrics.recordSuccess(150); // 150ms duration
        rankingsMetrics.recordSuccess(200); // 200ms duration
        rankingsMetrics.recordSuccess(100); // 100ms duration
        
        const successSummary = rankingsMetrics.getSummary();
        if (successSummary.totalUpdates !== 3) {
            throw new Error(`Expected 3 total updates, got ${successSummary.totalUpdates}`);
        }
        if (successSummary.successfulUpdates !== 3) {
            throw new Error(`Expected 3 successful updates, got ${successSummary.successfulUpdates}`);
        }
        if (rankingsMetrics.getSuccessRate() !== 100) {
            throw new Error(`Expected 100% success rate, got ${rankingsMetrics.getSuccessRate()}%`);
        }
        
        const avgDuration = rankingsMetrics.getAverageDuration();
        const expectedAvg = (150 + 200 + 100) / 3;
        if (Math.abs(avgDuration - expectedAvg) > 0.01) {
            throw new Error(`Expected average duration ${expectedAvg}ms, got ${avgDuration}ms`);
        }
        console.log('   ✅ Success recording works correctly');
        console.log(`   📊 Success rate: ${rankingsMetrics.getSuccessRate()}%`);
        console.log(`   📊 Average duration: ${avgDuration.toFixed(2)}ms\n`);
        
        // Test 3: Record failed update
        console.log('📋 Test 3: Record failed updates...');
        rankingsMetrics.recordFailure('Channel not found');
        
        const failureSummary = rankingsMetrics.getSummary();
        if (failureSummary.totalUpdates !== 4) {
            throw new Error(`Expected 4 total updates, got ${failureSummary.totalUpdates}`);
        }
        if (failureSummary.failedUpdates !== 1) {
            throw new Error(`Expected 1 failed update, got ${failureSummary.failedUpdates}`);
        }
        if (rankingsMetrics.getSuccessRate() !== 75) {
            throw new Error(`Expected 75% success rate, got ${rankingsMetrics.getSuccessRate()}%`);
        }
        console.log('   ✅ Failure recording works correctly');
        console.log(`   📊 Success rate: ${rankingsMetrics.getSuccessRate()}%`);
        console.log(`   📊 Last failure: ${failureSummary.lastFailureReason}\n`);
        
        // Test 4: Print summary
        console.log('📋 Test 4: Print summary...');
        rankingsMetrics.printSummary();
        console.log('   ✅ Summary printed successfully\n');
        
        // Test 5: Reset metrics
        console.log('📋 Test 5: Reset metrics...');
        rankingsMetrics.reset();
        const resetSummary = rankingsMetrics.getSummary();
        if (resetSummary.totalUpdates !== 0) {
            throw new Error('Expected totalUpdates to be 0 after reset');
        }
        if (resetSummary.successfulUpdates !== 0) {
            throw new Error('Expected successfulUpdates to be 0 after reset');
        }
        console.log('   ✅ Reset works correctly\n');
        
        console.log('✅ All metrics tests passed!\n');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('   Stack:', error.stack);
        process.exit(1);
    }
}

// Run tests
runTests();
console.log('✨ All tests completed successfully!');
