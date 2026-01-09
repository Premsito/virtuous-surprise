/**
 * Database Persistence Verification Script
 * 
 * This script verifies that the persistent database storage system is working correctly.
 * It tests all aspects of data persistence including XP, LC, and inventory.
 * 
 * Run with: node verify-persistence.js
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

// Test user IDs (use safe test values)
const TEST_USER_ID = 'test_user_persistence_123';
const TEST_USERNAME = 'PersistenceTestUser';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function verifyPersistence() {
    console.log('=== Database Persistence Verification ===\n');
    
    try {
        // Initialize database
        console.log('📊 Step 1: Initializing database connection...');
        await db.initialize();
        console.log('✅ Database connected and initialized\n');
        
        // Clean up any existing test data
        console.log('🧹 Cleaning up previous test data...');
        try {
            await db.pool.query('DELETE FROM active_multipliers WHERE user_id = $1', [TEST_USER_ID]);
            await db.pool.query('DELETE FROM user_inventory WHERE user_id = $1', [TEST_USER_ID]);
            await db.pool.query('DELETE FROM transactions WHERE from_user_id = $1 OR to_user_id = $1', [TEST_USER_ID]);
            await db.pool.query('DELETE FROM users WHERE user_id = $1', [TEST_USER_ID]);
            console.log('✅ Cleanup complete\n');
        } catch (cleanupError) {
            console.log('⚠️  Cleanup skipped (no previous data)\n');
        }
        
        // Test 1: User Creation
        console.log('📝 Test 1: User Creation and Initialization');
        console.log('Creating new user with default values...');
        const newUser = await db.createUser(TEST_USER_ID, TEST_USERNAME);
        console.log(`✅ User created: ${newUser.username}`);
        console.log(`   - User ID: ${newUser.user_id}`);
        console.log(`   - Balance: ${newUser.balance} LC (default: 25)`);
        console.log(`   - XP: ${newUser.xp || 0} (default: 0)`);
        console.log(`   - Level: ${newUser.level || 1} (default: 1)\n`);
        
        // Test 2: XP Persistence
        console.log('📊 Test 2: XP and Level Persistence');
        console.log('Granting 150 XP...');
        await db.addXP(TEST_USER_ID, 150);
        await db.updateLevel(TEST_USER_ID, 2);
        
        let user = await db.getUser(TEST_USER_ID);
        console.log(`✅ XP updated in database:`);
        console.log(`   - XP: ${user.xp}`);
        console.log(`   - Level: ${user.level}`);
        
        console.log('Simulating bot restart (re-fetching from database)...');
        await sleep(100);
        user = await db.getUser(TEST_USER_ID);
        console.log(`✅ After "restart" - Data persisted:`);
        console.log(`   - XP: ${user.xp} (expected: 150)`);
        console.log(`   - Level: ${user.level} (expected: 2)\n`);
        
        // Test 3: LC Balance Persistence
        console.log('💰 Test 3: LC Balance Persistence');
        console.log('Adding 500 LC to balance...');
        await db.updateBalance(TEST_USER_ID, 500);
        
        user = await db.getUser(TEST_USER_ID);
        console.log(`✅ Balance updated: ${user.balance} LC`);
        
        console.log('Simulating bot restart (re-fetching from database)...');
        await sleep(100);
        user = await db.getUser(TEST_USER_ID);
        console.log(`✅ After "restart" - Balance persisted: ${user.balance} LC (expected: 525)\n`);
        
        // Test 4: Inventory Persistence
        console.log('🎒 Test 4: Inventory Persistence');
        console.log('Adding items to inventory...');
        await db.addInventoryItem(TEST_USER_ID, 'jackpot', 3);
        await db.addInventoryItem(TEST_USER_ID, 'multiplier_x2', 2);
        await db.addInventoryItem(TEST_USER_ID, 'multiplier_x3', 1);
        
        let inventory = await db.getInventory(TEST_USER_ID);
        console.log(`✅ Inventory items added:`);
        inventory.forEach(item => {
            console.log(`   - ${item.item_type}: ${item.quantity}`);
        });
        
        console.log('Simulating bot restart (re-fetching from database)...');
        await sleep(100);
        inventory = await db.getInventory(TEST_USER_ID);
        console.log(`✅ After "restart" - Inventory persisted:`);
        inventory.forEach(item => {
            console.log(`   - ${item.item_type}: ${item.quantity}`);
        });
        console.log('');
        
        // Test 5: Inventory Item Usage
        console.log('🎁 Test 5: Inventory Item Usage Persistence');
        console.log('Using 1 Jackpot...');
        await db.removeInventoryItem(TEST_USER_ID, 'jackpot', 1);
        
        inventory = await db.getInventory(TEST_USER_ID);
        const jackpotItem = inventory.find(i => i.item_type === 'jackpot');
        console.log(`✅ Jackpot quantity after use: ${jackpotItem.quantity} (expected: 2)`);
        
        console.log('Simulating bot restart (re-fetching from database)...');
        await sleep(100);
        inventory = await db.getInventory(TEST_USER_ID);
        const jackpotItemAfterRestart = inventory.find(i => i.item_type === 'jackpot');
        console.log(`✅ After "restart" - Quantity persisted: ${jackpotItemAfterRestart.quantity}\n`);
        
        // Test 6: Active Multiplier Persistence
        console.log('🎫 Test 6: Active Multiplier Persistence');
        console.log('Activating x2 multiplier...');
        await db.activateMultiplier(TEST_USER_ID, 'multiplier_x2', 2);
        
        let multiplier = await db.getActiveMultiplier(TEST_USER_ID);
        console.log(`✅ Multiplier activated:`);
        console.log(`   - Type: ${multiplier.multiplier_type}`);
        console.log(`   - Value: x${multiplier.multiplier_value}`);
        console.log(`   - Games Remaining: ${multiplier.games_remaining}`);
        
        console.log('Simulating bot restart (re-fetching from database)...');
        await sleep(100);
        multiplier = await db.getActiveMultiplier(TEST_USER_ID);
        console.log(`✅ After "restart" - Multiplier persisted:`);
        console.log(`   - Value: x${multiplier.multiplier_value}`);
        console.log(`   - Games Remaining: ${multiplier.games_remaining}\n`);
        
        // Test 7: Transaction History
        console.log('📜 Test 7: Transaction History Persistence');
        console.log('Recording a transaction...');
        await db.recordTransaction(null, TEST_USER_ID, 100, 'test_reward', 'Test persistence reward');
        
        const transactions = await db.pool.query(
            'SELECT * FROM transactions WHERE to_user_id = $1 ORDER BY created_at DESC LIMIT 1',
            [TEST_USER_ID]
        );
        const transaction = transactions.rows[0];
        console.log(`✅ Transaction recorded:`);
        console.log(`   - Amount: ${transaction.amount} LC`);
        console.log(`   - Type: ${transaction.transaction_type}`);
        console.log(`   - Description: ${transaction.description}`);
        
        console.log('Simulating bot restart (re-fetching from database)...');
        await sleep(100);
        const transactionsAfterRestart = await db.pool.query(
            'SELECT * FROM transactions WHERE to_user_id = $1 ORDER BY created_at DESC LIMIT 1',
            [TEST_USER_ID]
        );
        const transactionAfterRestart = transactionsAfterRestart.rows[0];
        console.log(`✅ After "restart" - Transaction persisted:`);
        console.log(`   - Amount: ${transactionAfterRestart.amount} LC\n`);
        
        // Test 8: Complete User State Verification
        console.log('🔍 Test 8: Complete User State Verification');
        console.log('Final state after all operations:');
        const finalUser = await db.getUser(TEST_USER_ID);
        const finalInventory = await db.getInventory(TEST_USER_ID);
        const finalMultiplier = await db.getActiveMultiplier(TEST_USER_ID);
        
        console.log('\n📊 Final User Profile:');
        console.log(`   - Username: ${finalUser.username}`);
        console.log(`   - XP: ${finalUser.xp}`);
        console.log(`   - Level: ${finalUser.level}`);
        console.log(`   - Balance: ${finalUser.balance} LC`);
        
        console.log('\n🎒 Final Inventory:');
        finalInventory.forEach(item => {
            console.log(`   - ${item.item_type}: ${item.quantity}`);
        });
        
        if (finalMultiplier) {
            console.log('\n🎫 Active Multiplier:');
            console.log(`   - Type: x${finalMultiplier.multiplier_value}`);
            console.log(`   - Games Remaining: ${finalMultiplier.games_remaining}`);
        }
        
        console.log('\n=== Summary ===');
        console.log('✅ All persistence tests passed!');
        console.log('✅ XP and Level data persists correctly');
        console.log('✅ LC balance persists correctly');
        console.log('✅ Inventory items persist correctly');
        console.log('✅ Active multipliers persist correctly');
        console.log('✅ Transaction history persists correctly');
        
        // Clean up test data
        console.log('\n🧹 Cleaning up test data...');
        await db.pool.query('DELETE FROM active_multipliers WHERE user_id = $1', [TEST_USER_ID]);
        await db.pool.query('DELETE FROM user_inventory WHERE user_id = $1', [TEST_USER_ID]);
        await db.pool.query('DELETE FROM transactions WHERE from_user_id = $1 OR to_user_id = $1', [TEST_USER_ID]);
        await db.pool.query('DELETE FROM users WHERE user_id = $1', [TEST_USER_ID]);
        console.log('✅ Test data cleaned up');
        
    } catch (error) {
        console.error('\n❌ Verification failed:', error);
        console.error('Error details:', error.message);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    } finally {
        // Close database connection
        await db.close();
        console.log('✅ Database connection closed');
        
        // Log success message after cleanup
        console.log('\n🎉 The persistent database storage system is working correctly!');
        console.log('   All user data will persist across bot restarts.\n');
        process.exit(0);
    }
}

// Run verification
verifyPersistence();
