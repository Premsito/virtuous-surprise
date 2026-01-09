/**
 * Comprehensive Database Functions Test
 * 
 * Tests all database helper functions to ensure data persistence works correctly.
 * 
 * Run with: node test-database-persistence.js
 * 
 * Note: Requires DATABASE_URL environment variable to be set.
 */

// Load environment variables if .env file exists
try {
    require('dotenv').config();
} catch (err) {
    // .env file not found or dotenv not installed - environment variables may be set directly
    console.log('ℹ️  Running without .env file (environment variables should be set directly)');
}

const { db } = require('./database/db');

// ANSI color codes for output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
    log(`✅ ${message}`, 'green');
}

function error(message) {
    log(`❌ ${message}`, 'red');
}

function info(message) {
    log(`ℹ️  ${message}`, 'cyan');
}

function section(message) {
    log(`\n${'='.repeat(60)}`, 'blue');
    log(message, 'blue');
    log('='.repeat(60), 'blue');
}

let testsPassed = 0;
let testsFailed = 0;

async function runTest(testName, testFn) {
    try {
        info(`Running: ${testName}`);
        await testFn();
        success(`PASSED: ${testName}`);
        testsPassed++;
    } catch (err) {
        error(`FAILED: ${testName}`);
        error(`  Error: ${err.message}`);
        testsFailed++;
    }
}

async function testDatabase() {
    section('Database Persistence Tests');
    
    const testUserId = 'test_db_user_' + Date.now();
    const testUsername = 'TestUser';
    
    try {
        // Initialize database
        section('1. Database Initialization');
        await runTest('Database connection and initialization', async () => {
            await db.initialize();
        });
        
        // User operations
        section('2. User CRUD Operations');
        
        await runTest('Create new user', async () => {
            const user = await db.createUser(testUserId, testUsername);
            if (!user || user.user_id !== testUserId) {
                throw new Error('User not created correctly');
            }
            if (user.balance !== 25) {
                throw new Error(`Default balance should be 25, got ${user.balance}`);
            }
        });
        
        await runTest('Get existing user', async () => {
            const user = await db.getUser(testUserId);
            if (!user || user.user_id !== testUserId) {
                throw new Error('Failed to retrieve user');
            }
        });
        
        await runTest('Create duplicate user (should update)', async () => {
            const user = await db.createUser(testUserId, 'UpdatedName');
            if (user.username !== 'UpdatedName') {
                throw new Error('Username should be updated');
            }
        });
        
        // Balance operations
        section('3. LC Balance Operations');
        
        await runTest('Update balance (add)', async () => {
            await db.updateBalance(testUserId, 100);
            const user = await db.getUser(testUserId);
            if (user.balance !== 125) {
                throw new Error(`Balance should be 125, got ${user.balance}`);
            }
        });
        
        await runTest('Update balance (subtract)', async () => {
            await db.updateBalance(testUserId, -50);
            const user = await db.getUser(testUserId);
            if (user.balance !== 75) {
                throw new Error(`Balance should be 75, got ${user.balance}`);
            }
        });
        
        await runTest('Set balance', async () => {
            await db.setBalance(testUserId, 200);
            const user = await db.getUser(testUserId);
            if (user.balance !== 200) {
                throw new Error(`Balance should be 200, got ${user.balance}`);
            }
        });
        
        // XP and Level operations
        section('4. XP and Level Operations');
        
        await runTest('Add XP', async () => {
            await db.addXP(testUserId, 150);
            const user = await db.getUser(testUserId);
            if (user.xp !== 150) {
                throw new Error(`XP should be 150, got ${user.xp}`);
            }
        });
        
        await runTest('Update level', async () => {
            await db.updateLevel(testUserId, 5);
            const user = await db.getUser(testUserId);
            if (user.level !== 5) {
                throw new Error(`Level should be 5, got ${user.level}`);
            }
        });
        
        await runTest('Update last message XP time', async () => {
            const now = new Date();
            await db.updateLastMessageXPTime(testUserId, now);
            const user = await db.getUser(testUserId);
            if (!user.last_message_xp_time) {
                throw new Error('Last message XP time not updated');
            }
        });
        
        // Inventory operations
        section('5. Inventory Operations');
        
        await runTest('Add inventory item (jackpot)', async () => {
            await db.addInventoryItem(testUserId, 'jackpot', 3);
            const item = await db.getInventoryItem(testUserId, 'jackpot');
            if (item.quantity !== 3) {
                throw new Error(`Jackpot quantity should be 3, got ${item.quantity}`);
            }
        });
        
        await runTest('Add inventory item (multiplier)', async () => {
            await db.addInventoryItem(testUserId, 'multiplier_x2', 2);
            const item = await db.getInventoryItem(testUserId, 'multiplier_x2');
            if (item.quantity !== 2) {
                throw new Error(`Multiplier quantity should be 2, got ${item.quantity}`);
            }
        });
        
        await runTest('Add to existing inventory item', async () => {
            await db.addInventoryItem(testUserId, 'jackpot', 2);
            const item = await db.getInventoryItem(testUserId, 'jackpot');
            if (item.quantity !== 5) {
                throw new Error(`Jackpot quantity should be 5, got ${item.quantity}`);
            }
        });
        
        await runTest('Get full inventory', async () => {
            const inventory = await db.getInventory(testUserId);
            if (inventory.length !== 2) {
                throw new Error(`Should have 2 inventory items, got ${inventory.length}`);
            }
        });
        
        await runTest('Remove inventory item', async () => {
            await db.removeInventoryItem(testUserId, 'jackpot', 2);
            const item = await db.getInventoryItem(testUserId, 'jackpot');
            if (item.quantity !== 3) {
                throw new Error(`Jackpot quantity should be 3, got ${item.quantity}`);
            }
        });
        
        // Multiplier operations
        section('6. Active Multiplier Operations');
        
        await runTest('Activate multiplier', async () => {
            await db.activateMultiplier(testUserId, 'multiplier_x2', 2);
            const multiplier = await db.getActiveMultiplier(testUserId);
            if (!multiplier) {
                throw new Error('Multiplier not activated');
            }
            if (multiplier.multiplier_value !== 2) {
                throw new Error(`Multiplier value should be 2, got ${multiplier.multiplier_value}`);
            }
            if (multiplier.games_remaining !== 2) {
                throw new Error(`Games remaining should be 2, got ${multiplier.games_remaining}`);
            }
        });
        
        await runTest('Decrement multiplier games', async () => {
            await db.decrementMultiplierGames(testUserId);
            const multiplier = await db.getActiveMultiplier(testUserId);
            if (multiplier.games_remaining !== 1) {
                throw new Error(`Games remaining should be 1, got ${multiplier.games_remaining}`);
            }
        });
        
        await runTest('Delete expired multipliers', async () => {
            await db.decrementMultiplierGames(testUserId);
            await db.deleteExpiredMultipliers(testUserId);
            const multiplier = await db.getActiveMultiplier(testUserId);
            if (multiplier) {
                throw new Error('Expired multiplier should be deleted');
            }
        });
        
        // Message and voice tracking
        section('7. Activity Tracking Operations');
        
        await runTest('Increment message count', async () => {
            await db.incrementMessageCount(testUserId, 10);
            const user = await db.getUser(testUserId);
            if (user.message_count !== 10) {
                throw new Error(`Message count should be 10, got ${user.message_count}`);
            }
        });
        
        await runTest('Update voice time', async () => {
            await db.updateVoiceTime(testUserId, 3600);
            const user = await db.getUser(testUserId);
            if (user.voice_time !== 3600) {
                throw new Error(`Voice time should be 3600, got ${user.voice_time}`);
            }
        });
        
        // Transaction operations
        section('8. Transaction Operations');
        
        await runTest('Record transaction', async () => {
            await db.recordTransaction(null, testUserId, 50, 'test_reward', 'Test reward');
            // Transaction should be recorded (no error thrown)
        });
        
        // Invite operations
        section('9. Invite Operations');
        
        await runTest('Increment invites', async () => {
            await db.incrementInvites(testUserId);
            const user = await db.getUser(testUserId);
            if (user.invites !== 1) {
                throw new Error(`Invites should be 1, got ${user.invites}`);
            }
        });
        
        await runTest('Set invites', async () => {
            await db.setInvites(testUserId, 5);
            const user = await db.getUser(testUserId);
            if (user.invites !== 5) {
                throw new Error(`Invites should be 5, got ${user.invites}`);
            }
        });
        
        // Data persistence verification
        section('10. Data Persistence Verification');
        
        await runTest('All data persists after retrieval', async () => {
            const user = await db.getUser(testUserId);
            const inventory = await db.getInventory(testUserId);
            
            // Verify all updated values
            if (user.balance !== 200) throw new Error('Balance not persisted');
            if (user.xp !== 150) throw new Error('XP not persisted');
            if (user.level !== 5) throw new Error('Level not persisted');
            if (user.invites !== 5) throw new Error('Invites not persisted');
            if (user.message_count !== 10) throw new Error('Message count not persisted');
            if (user.voice_time !== 3600) throw new Error('Voice time not persisted');
            if (inventory.length !== 2) throw new Error('Inventory not persisted');
        });
        
        // Cleanup
        section('11. Cleanup');
        
        await runTest('Delete test data', async () => {
            await db.pool.query('DELETE FROM active_multipliers WHERE user_id = $1', [testUserId]);
            await db.pool.query('DELETE FROM user_inventory WHERE user_id = $1', [testUserId]);
            await db.pool.query('DELETE FROM transactions WHERE to_user_id = $1', [testUserId]);
            await db.pool.query('DELETE FROM users WHERE user_id = $1', [testUserId]);
        });
        
    } catch (err) {
        error(`Fatal error during testing: ${err.message}`);
        console.error(err);
    } finally {
        await db.close();
    }
    
    // Print summary
    section('Test Summary');
    log(`Total Tests: ${testsPassed + testsFailed}`, 'blue');
    log(`Passed: ${testsPassed}`, 'green');
    log(`Failed: ${testsFailed}`, testsFailed > 0 ? 'red' : 'green');
    
    if (testsFailed === 0) {
        log('\n🎉 All tests passed! Database persistence is working correctly.', 'green');
        process.exit(0);
    } else {
        log('\n⚠️  Some tests failed. Please review the errors above.', 'red');
        process.exit(1);
    }
}

// Run all tests
testDatabase();
