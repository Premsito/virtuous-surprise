/**
 * Integration test for dynamic rankings with simulated database
 * Tests the full flow of LC/Niveau changes triggering rankings updates
 */

const lcEventEmitter = require('./utils/lcEventEmitter');
const niveauEventEmitter = require('./utils/niveauEventEmitter');

console.log('🧪 Testing Dynamic Rankings Integration\n');
console.log('='.repeat(60));

let testsRun = 0;
let testsPassed = 0;

function test(description, fn) {
    testsRun++;
    try {
        fn();
        testsPassed++;
        console.log(`✅ ${description}`);
        return true;
    } catch (error) {
        console.error(`❌ ${description}`);
        console.error(`   Error: ${error.message}`);
        return false;
    }
}

async function asyncTest(description, fn) {
    testsRun++;
    try {
        await fn();
        testsPassed++;
        console.log(`✅ ${description}`);
        return true;
    } catch (error) {
        console.error(`❌ ${description}`);
        console.error(`   Error: ${error.message}`);
        return false;
    }
}

// Run async tests
(async () => {
    // Test 1: Simulate LC change triggering rankings update
    await asyncTest('LC change triggers rankings manager update', async () => {
        const rankingsManager = require('./utils/rankingsManager');
        
        // Create mock client and rankings command
        const mockClient = {
            channels: {
                fetch: async (id) => {
                    return {
                        id,
                        name: 'test-rankings',
                        type: 0,
                        guild: { name: 'Test Guild' },
                        permissionsFor: () => ({
                            has: () => true
                        })
                    };
                }
            }
        };
        
        const mockRankingsCommand = {
            updateRankingsChannel: async () => {
                console.log('   📊 Mock rankings update called');
            }
        };
        
        // Initialize rankings manager
        await rankingsManager.initialize(mockClient, mockRankingsCommand);
        
        // Verify pending updates is initially empty
        if (rankingsManager.pendingUpdates.size !== 0) {
            throw new Error('pendingUpdates should be empty initially');
        }
        
        // Emit LC change
        lcEventEmitter.emitLCChange('test_user_1', 100, 200, 'game_win');
        
        // Verify user was added to pending updates
        if (rankingsManager.pendingUpdates.size !== 1) {
            throw new Error('pendingUpdates should contain 1 user');
        }
        
        // Clean up
        rankingsManager.destroy();
    });

    // Test 2: Simulate Niveau change triggering rankings update
    await asyncTest('Niveau change triggers rankings manager update', async () => {
        const rankingsManager = require('./utils/rankingsManager');
        
        // Create mock client and rankings command
        const mockClient = {
            channels: {
                fetch: async (id) => {
                    return {
                        id,
                        name: 'test-rankings',
                        type: 0,
                        guild: { name: 'Test Guild' },
                        permissionsFor: () => ({
                            has: () => true
                        })
                    };
                }
            }
        };
        
        const mockRankingsCommand = {
            updateRankingsChannel: async () => {
                console.log('   📊 Mock rankings update called');
            }
        };
        
        // Initialize rankings manager
        await rankingsManager.initialize(mockClient, mockRankingsCommand);
        
        // Clear any pending updates from previous test
        rankingsManager.pendingUpdates.clear();
        
        // Emit Niveau change
        niveauEventEmitter.emitNiveauChange('test_user_2', 5, 6, 'level_up');
        
        // Verify user was added to pending updates
        if (rankingsManager.pendingUpdates.size !== 1) {
            throw new Error('pendingUpdates should contain 1 user');
        }
        
        // Clean up
        rankingsManager.destroy();
    });

    // Test 3: Multiple changes are batched
    await asyncTest('Multiple LC/Niveau changes are batched together', async () => {
        const rankingsManager = require('./utils/rankingsManager');
        
        // Create mock client and rankings command
        const mockClient = {
            channels: {
                fetch: async (id) => {
                    return {
                        id,
                        name: 'test-rankings',
                        type: 0,
                        guild: { name: 'Test Guild' },
                        permissionsFor: () => ({
                            has: () => true
                        })
                    };
                }
            }
        };
        
        const mockRankingsCommand = {
            updateRankingsChannel: async () => {
                console.log('   📊 Mock rankings update called');
            }
        };
        
        // Initialize rankings manager
        await rankingsManager.initialize(mockClient, mockRankingsCommand);
        
        // Clear any pending updates
        rankingsManager.pendingUpdates.clear();
        
        // Emit multiple changes
        lcEventEmitter.emitLCChange('user_1', 100, 200, 'game_win');
        niveauEventEmitter.emitNiveauChange('user_2', 5, 6, 'level_up');
        lcEventEmitter.emitLCChange('user_3', 50, 75, 'transfer');
        
        // Verify all users are in pending updates
        if (rankingsManager.pendingUpdates.size !== 3) {
            throw new Error(`Expected 3 users in pendingUpdates, got ${rankingsManager.pendingUpdates.size}`);
        }
        
        // Clean up
        rankingsManager.destroy();
    });
    
    // Test 4: Debouncing prevents spam
    test('Rankings manager implements debouncing', () => {
        const rankingsManager = require('./utils/rankingsManager');
        
        if (rankingsManager.MIN_UPDATE_INTERVAL_MS !== 30000) {
            throw new Error('MIN_UPDATE_INTERVAL_MS should be 30 seconds');
        }
        
        if (rankingsManager.MAX_UPDATE_DELAY_MS !== 120000) {
            throw new Error('MAX_UPDATE_DELAY_MS should be 2 minutes');
        }
    });

    // Test 5: Event data format is correct for LC
    test('LC event data has correct format', () => {
        let receivedEvent = null;
        
        const handler = (event) => {
            receivedEvent = event;
        };
        
        lcEventEmitter.onLCChange(handler);
        lcEventEmitter.emitLCChange('user123', 100, 150, 'game_win');
        lcEventEmitter.offLCChange(handler);
        
        if (!receivedEvent) throw new Error('Event not received');
        if (receivedEvent.userId !== 'user123') throw new Error('userId mismatch');
        if (receivedEvent.oldBalance !== 100) throw new Error('oldBalance mismatch');
        if (receivedEvent.newBalance !== 150) throw new Error('newBalance mismatch');
        if (receivedEvent.change !== 50) throw new Error('change mismatch');
        if (receivedEvent.reason !== 'game_win') throw new Error('reason mismatch');
        if (typeof receivedEvent.timestamp !== 'number') throw new Error('timestamp missing');
    });

    // Test 6: Event data format is correct for Niveau
    test('Niveau event data has correct format', () => {
        let receivedEvent = null;
        
        const handler = (event) => {
            receivedEvent = event;
        };
        
        niveauEventEmitter.onNiveauChange(handler);
        niveauEventEmitter.emitNiveauChange('user456', 5, 6, 'level_up');
        niveauEventEmitter.offNiveauChange(handler);
        
        if (!receivedEvent) throw new Error('Event not received');
        if (receivedEvent.userId !== 'user456') throw new Error('userId mismatch');
        if (receivedEvent.oldLevel !== 5) throw new Error('oldLevel mismatch');
        if (receivedEvent.newLevel !== 6) throw new Error('newLevel mismatch');
        if (receivedEvent.change !== 1) throw new Error('change mismatch');
        if (receivedEvent.reason !== 'level_up') throw new Error('reason mismatch');
        if (typeof receivedEvent.timestamp !== 'number') throw new Error('timestamp missing');
    });
    
    console.log('\n' + '='.repeat(60));
    console.log(`\n📊 Test Summary:`);
    console.log(`   Total tests: ${testsRun}`);
    console.log(`   Passed: ${testsPassed}`);
    console.log(`   Failed: ${testsRun - testsPassed}`);
    console.log(`   Success rate: ${((testsPassed / testsRun) * 100).toFixed(1)}%\n`);

    if (testsPassed === testsRun) {
        console.log('✅ All integration tests passed!\n');
        process.exit(0);
    } else {
        console.log('❌ Some integration tests failed!\n');
        process.exit(1);
    }
})();
