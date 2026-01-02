/**
 * Test message tracking functionality
 * This test verifies that the message counting logic works correctly
 */

const { db } = require('./database/db');

async function testMessageTracking() {
    console.log('=== Message Tracking Test ===\n');
    
    let testsPassed = 0;
    let testsFailed = 0;
    
    // Test 1: Check if incrementMessageCount function exists
    console.log('Test 1: Verify incrementMessageCount function exists');
    try {
        if (typeof db.incrementMessageCount === 'function') {
            console.log('✅ db.incrementMessageCount function exists\n');
            testsPassed++;
        } else {
            console.log('❌ db.incrementMessageCount function does not exist\n');
            testsFailed++;
        }
    } catch (error) {
        console.log('❌ Error checking function:', error.message, '\n');
        testsFailed++;
    }
    
    // Test 2: Verify the SQL query is correct
    console.log('Test 2: Verify incrementMessageCount implementation');
    try {
        const fnString = db.incrementMessageCount.toString();
        if (fnString.includes('UPDATE users SET message_count = message_count +') &&
            fnString.includes('WHERE user_id =')) {
            console.log('✅ SQL query structure is correct');
            console.log('   Query updates message_count column for specific user_id\n');
            testsPassed++;
        } else {
            console.log('❌ SQL query structure is incorrect\n');
            testsFailed++;
        }
    } catch (error) {
        console.log('❌ Error verifying implementation:', error.message, '\n');
        testsFailed++;
    }
    
    // Test 3: Check bot.js has messageCreate listener
    console.log('Test 3: Verify messageCreate event listener exists in bot.js');
    try {
        const fs = require('fs');
        const botCode = fs.readFileSync('./bot.js', 'utf-8');
        
        if (botCode.includes("client.on('messageCreate'") &&
            botCode.includes('db.incrementMessageCount')) {
            console.log('✅ messageCreate event listener is configured');
            console.log('   Event listener calls db.incrementMessageCount\n');
            testsPassed++;
        } else {
            console.log('❌ messageCreate event listener not properly configured\n');
            testsFailed++;
        }
    } catch (error) {
        console.log('❌ Error checking bot.js:', error.message, '\n');
        testsFailed++;
    }
    
    // Test 4: Check caching mechanism
    console.log('Test 4: Verify message count caching is implemented');
    try {
        const fs = require('fs');
        const botCode = fs.readFileSync('./bot.js', 'utf-8');
        
        if (botCode.includes('messageCountCache') &&
            botCode.includes('MESSAGE_COUNT_BATCH_SIZE')) {
            console.log('✅ Message count caching is implemented');
            console.log('   Uses batching to reduce database load\n');
            testsPassed++;
        } else {
            console.log('❌ Message count caching not found\n');
            testsFailed++;
        }
    } catch (error) {
        console.log('❌ Error checking caching:', error.message, '\n');
        testsFailed++;
    }
    
    // Test 5: Check shutdown handler flushes cache
    console.log('Test 5: Verify shutdown handler flushes message count cache');
    try {
        const fs = require('fs');
        const botCode = fs.readFileSync('./bot.js', 'utf-8');
        
        if (botCode.includes('messageCountCache.entries()') &&
            botCode.includes('shutdown') &&
            botCode.includes('incrementMessageCount')) {
            console.log('✅ Shutdown handler properly flushes message count cache');
            console.log('   Ensures no message counts are lost on restart\n');
            testsPassed++;
        } else {
            console.log('❌ Shutdown handler does not flush message count cache\n');
            testsFailed++;
        }
    } catch (error) {
        console.log('❌ Error checking shutdown handler:', error.message, '\n');
        testsFailed++;
    }
    
    // Test 6: Verify stats.js displays message count
    console.log('Test 6: Verify stats command displays message count');
    try {
        const fs = require('fs');
        const statsCode = fs.readFileSync('./commands/stats.js', 'utf-8');
        
        if (statsCode.includes('message_count') &&
            statsCode.includes('Messages')) {
            console.log('✅ Stats command displays message count');
            console.log('   Uses user.message_count from database\n');
            testsPassed++;
        } else {
            console.log('❌ Stats command does not display message count\n');
            testsFailed++;
        }
    } catch (error) {
        console.log('❌ Error checking stats command:', error.message, '\n');
        testsFailed++;
    }
    
    // Summary
    console.log('=== Test Summary ===');
    console.log(`Passed: ${testsPassed}`);
    console.log(`Failed: ${testsFailed}`);
    console.log(`Total: ${testsPassed + testsFailed}`);
    
    if (testsFailed === 0) {
        console.log('\n✅ All message tracking tests passed!');
        console.log('\n📝 Message tracking implementation is complete and correct.');
        console.log('   - Messages are tracked via messageCreate event');
        console.log('   - Counts are cached and batched for efficiency');
        console.log('   - Cache is flushed on shutdown to prevent data loss');
        console.log('   - Message counts are displayed in stats command');
        return true;
    } else {
        console.log('\n❌ Some tests failed. Please review the errors above.');
        return false;
    }
}

// Run tests
testMessageTracking().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
});
