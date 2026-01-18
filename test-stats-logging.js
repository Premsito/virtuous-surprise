/**
 * Test stats logging functionality
 * This test verifies that all required debug logs are present in the code
 */

const fs = require('fs');

// Read bot.js file contents
const botCode = fs.readFileSync('./bot.js', 'utf-8');

async function testStatsLogging() {
    console.log('=== Stats Logging Test ===\n');
    
    let testsPassed = 0;
    let testsFailed = 0;
    
    // Test 1: Check for message detection log
    console.log('Test 1: Verify message detection logging');
    try {
        if (botCode.includes('[Stats] Detected message from') &&
            botCode.includes('Processing...')) {
            console.log('✅ Message detection logging is present');
            console.log('   Log format: [Stats] Detected message from {user}. Processing...\n');
            testsPassed++;
        } else {
            console.log('❌ Message detection logging not found\n');
            testsFailed++;
        }
    } catch (error) {
        console.log('❌ Error checking message detection logging:', error.message, '\n');
        testsFailed++;
    }
    
    // Test 2: Check for message count update log
    console.log('Test 2: Verify message count update logging');
    try {
        if (botCode.includes('[Stats] Updated message count for') &&
            botCode.includes('batched')) {
            console.log('✅ Message count update logging is present');
            console.log('   Log format: [Stats] Updated message count for {user}: {count} (batched +{batchSize})\n');
            testsPassed++;
        } else {
            console.log('❌ Message count update logging not found\n');
            testsFailed++;
        }
    } catch (error) {
        console.log('❌ Error checking message count update logging:', error.message, '\n');
        testsFailed++;
    }
    
    // Test 3: Check for voice channel join log
    console.log('Test 3: Verify voice channel join logging');
    try {
        if (botCode.includes('[Stats] User') &&
            botCode.includes('joined voice channel') &&
            botCode.includes('Starting time tracking')) {
            console.log('✅ Voice channel join logging is present');
            console.log('   Log format: [Stats] User {user} joined voice channel. Starting time tracking.\n');
            testsPassed++;
        } else {
            console.log('❌ Voice channel join logging not found\n');
            testsFailed++;
        }
    } catch (error) {
        console.log('❌ Error checking voice channel join logging:', error.message, '\n');
        testsFailed++;
    }
    
    // Test 4: Check for voice time update log
    console.log('Test 4: Verify voice time update logging');
    try {
        if (botCode.includes('[Stats] Updated voice time for') &&
            botCode.includes('New total:') &&
            botCode.includes('seconds')) {
            console.log('✅ Voice time update logging is present');
            console.log('   Log format: [Stats] Updated voice time for {user}. New total: {seconds} seconds.\n');
            testsPassed++;
        } else {
            console.log('❌ Voice time update logging not found\n');
            testsFailed++;
        }
    } catch (error) {
        console.log('❌ Error checking voice time update logging:', error.message, '\n');
        testsFailed++;
    }
    
    // Test 5: Check for voice activity tracking log
    console.log('Test 5: Verify voice activity session logging');
    try {
        if (botCode.includes('[Stats] Voice activity tracked for') &&
            botCode.includes('Session time:') &&
            botCode.includes('minutes')) {
            console.log('✅ Voice activity session logging is present');
            console.log('   Log format: [Stats] Voice activity tracked for {user}. Session time: {minutes} minutes.\n');
            testsPassed++;
        } else {
            console.log('❌ Voice activity session logging not found\n');
            testsFailed++;
        }
    } catch (error) {
        console.log('❌ Error checking voice activity session logging:', error.message, '\n');
        testsFailed++;
    }
    
    // Test 6: Verify existing XP logging still exists
    console.log('Test 6: Verify XP logging is intact');
    try {
        if (botCode.includes('[XP] Message XP granted to') &&
            botCode.includes('[XP] Voice XP granted to') &&
            botCode.includes('[XP] Reaction XP granted to')) {
            console.log('✅ XP logging is intact');
            console.log('   All XP tracking logs are present\n');
            testsPassed++;
        } else {
            console.log('❌ Some XP logging is missing\n');
            testsFailed++;
        }
    } catch (error) {
        console.log('❌ Error checking XP logging:', error.message, '\n');
        testsFailed++;
    }
    
    // Test 7: Verify messageCreate event has both detection and update logs
    console.log('Test 7: Verify messageCreate event has complete logging');
    try {
        const hasDetectionLog = botCode.includes('[Stats] Detected message from');
        const hasUpdateLog = botCode.includes('[Stats] Updated message count for');
        
        if (hasDetectionLog && hasUpdateLog) {
            console.log('✅ messageCreate event has complete logging');
            console.log('   - Detection log when message is received');
            console.log('   - Update log when database is updated\n');
            testsPassed++;
        } else {
            console.log('❌ messageCreate event logging is incomplete');
            console.log(`   Detection log: ${hasDetectionLog ? '✓' : '✗'}`);
            console.log(`   Update log: ${hasUpdateLog ? '✓' : '✗'}\n`);
            testsFailed++;
        }
    } catch (error) {
        console.log('❌ Error checking messageCreate logging:', error.message, '\n');
        testsFailed++;
    }
    
    // Test 8: Verify voiceStateUpdate event has complete logging
    console.log('Test 8: Verify voiceStateUpdate event has complete logging');
    try {
        const hasJoinLog = botCode.includes('[Stats] User') && botCode.includes('joined voice channel');
        const hasLeaveLog = botCode.includes('[Stats] Updated voice time for');
        
        if (hasJoinLog && hasLeaveLog) {
            console.log('✅ voiceStateUpdate event has complete logging');
            console.log('   - Join log when user enters voice');
            console.log('   - Leave log with updated voice time\n');
            testsPassed++;
        } else {
            console.log('❌ voiceStateUpdate event logging is incomplete');
            console.log(`   Join log: ${hasJoinLog ? '✓' : '✗'}`);
            console.log(`   Leave log: ${hasLeaveLog ? '✓' : '✗'}\n`);
            testsFailed++;
        }
    } catch (error) {
        console.log('❌ Error checking voiceStateUpdate logging:', error.message, '\n');
        testsFailed++;
    }
    
    // Summary
    console.log('=== Test Summary ===');
    console.log(`Passed: ${testsPassed}`);
    console.log(`Failed: ${testsFailed}`);
    console.log(`Total: ${testsPassed + testsFailed}`);
    
    if (testsFailed === 0) {
        console.log('\n✅ All stats logging tests passed!');
        console.log('\n📝 Stats logging implementation is complete:');
        console.log('   ✓ Message detection logging');
        console.log('   ✓ Message count update logging (batched)');
        console.log('   ✓ Voice channel join logging');
        console.log('   ✓ Voice time update logging');
        console.log('   ✓ Voice activity session logging');
        console.log('   ✓ XP tracking logs intact');
        console.log('\n🔍 Monitoring Guidelines:');
        console.log('   - Look for [Stats] tags in logs for stat tracking events');
        console.log('   - Look for [XP] tags in logs for XP grant events');
        console.log('   - Message counts update every 10 messages (batched)');
        console.log('   - Voice time updates when users leave voice channels');
        console.log('   - Voice sessions update every 2 minutes during XP grants');
        return true;
    } else {
        console.log('\n❌ Some tests failed. Please review the errors above.');
        return false;
    }
}

// Run tests
testStatsLogging().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
});
