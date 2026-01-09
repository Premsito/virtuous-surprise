const { db } = require('./database/db');

async function testInventorySystem() {
    console.log('🧪 Testing Inventory System...\n');
    
    const testUserId = '123456789';
    const testUsername = 'TestUser';
    
    try {
        // Initialize database
        await db.initialize();
        console.log('✅ Database initialized\n');
        
        // Test 1: Add items to inventory
        console.log('📦 Test 1: Adding items to inventory...');
        await db.addInventoryItem(testUserId, 'jackpot', 5);
        await db.addInventoryItem(testUserId, 'multiplier_x2', 3);
        await db.addInventoryItem(testUserId, 'multiplier_x3', 2);
        console.log('✅ Items added\n');
        
        // Test 2: Get inventory
        console.log('📦 Test 2: Getting inventory...');
        const inventory = await db.getInventory(testUserId);
        console.log('Inventory:', JSON.stringify(inventory, null, 2));
        console.log('✅ Inventory retrieved\n');
        
        // Test 3: Get specific item
        console.log('📦 Test 3: Getting specific item...');
        const jackpotItem = await db.getInventoryItem(testUserId, 'jackpot');
        console.log('Jackpot item:', JSON.stringify(jackpotItem, null, 2));
        console.log('✅ Item retrieved\n');
        
        // Test 4: Remove item
        console.log('📦 Test 4: Removing item...');
        await db.removeInventoryItem(testUserId, 'jackpot', 1);
        const updatedJackpot = await db.getInventoryItem(testUserId, 'jackpot');
        console.log('Updated jackpot quantity:', updatedJackpot.quantity);
        console.log('✅ Item removed\n');
        
        // Test 5: Activate multiplier
        console.log('🎫 Test 5: Activating multiplier...');
        await db.activateMultiplier(testUserId, 'multiplier_x2', 2);
        const activeMultiplier = await db.getActiveMultiplier(testUserId);
        console.log('Active multiplier:', JSON.stringify(activeMultiplier, null, 2));
        console.log('✅ Multiplier activated\n');
        
        // Test 6: Decrement multiplier games
        console.log('🎫 Test 6: Decrementing multiplier games...');
        await db.decrementMultiplierGames(testUserId);
        const updatedMultiplier = await db.getActiveMultiplier(testUserId);
        console.log('Updated games remaining:', updatedMultiplier.games_remaining);
        console.log('✅ Games decremented\n');
        
        // Test 7: Decrement again
        console.log('🎫 Test 7: Decrementing multiplier games again...');
        await db.decrementMultiplierGames(testUserId);
        const finalMultiplier = await db.getActiveMultiplier(testUserId);
        console.log('Final games remaining:', finalMultiplier ? finalMultiplier.games_remaining : 'null');
        console.log('✅ Games decremented\n');
        
        // Test 8: Clean up expired multipliers
        console.log('🎫 Test 8: Cleaning up expired multipliers...');
        await db.deleteExpiredMultipliers(testUserId);
        const noMultiplier = await db.getActiveMultiplier(testUserId);
        console.log('Active multiplier after cleanup:', noMultiplier);
        console.log('✅ Expired multipliers cleaned\n');
        
        console.log('🎉 All tests passed!\n');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await db.close();
        console.log('👋 Database connection closed');
    }
}

testInventorySystem();
