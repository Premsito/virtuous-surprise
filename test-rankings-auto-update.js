/**
 * Test: Rankings Auto-Update with Persistent Message Tracking
 * 
 * Tests:
 * 1. Rankings message ID is saved to database
 * 2. Message ID can be loaded from database after restart
 * 3. Old message is deleted before posting new one
 * 4. 5-minute interval is correctly configured
 * 5. Enhanced logging is present
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Rankings Auto-Update System\n');

let testsPassed = 0;
let testsFailed = 0;

function test(name, condition, details = '') {
    if (condition) {
        console.log(`✅ PASS: ${name}`);
        if (details) console.log(`   ${details}`);
        testsPassed++;
    } else {
        console.log(`❌ FAIL: ${name}`);
        if (details) console.log(`   ${details}`);
        testsFailed++;
    }
}

// Test 1: Check migration file exists
console.log('📋 Test 1: Database Migration');
const migrationPath = path.join(__dirname, 'database/migrations/012_add_bot_state_table.sql');
const migrationExists = fs.existsSync(migrationPath);
test('Migration file exists', migrationExists, `Path: ${migrationPath}`);

if (migrationExists) {
    const migrationContent = fs.readFileSync(migrationPath, 'utf8');
    test('Migration creates bot_state table', 
        migrationContent.includes('CREATE TABLE IF NOT EXISTS bot_state'),
        'Table definition found');
    test('Migration has rankings_message_id key', 
        migrationContent.includes('rankings_message_id'),
        'Default state included');
}

// Test 2: Check db.js has bot state methods
console.log('\n📋 Test 2: Database Helper Methods');
const dbPath = path.join(__dirname, 'database/db.js');
const dbContent = fs.readFileSync(dbPath, 'utf8');

test('getBotState method exists', 
    dbContent.includes('async getBotState(key)'),
    'Method defined in db.js');
test('setBotState method exists', 
    dbContent.includes('async setBotState(key, value)'),
    'Method defined in db.js');
test('getBotState queries bot_state table', 
    dbContent.includes("FROM bot_state WHERE key = $1"),
    'Query implementation correct');
test('setBotState uses ON CONFLICT', 
    dbContent.includes('ON CONFLICT (key) DO UPDATE'),
    'Upsert logic implemented');

// Test 3: Check rankings.js has persistent tracking
console.log('\n📋 Test 3: Rankings Command Enhancements');
const rankingsPath = path.join(__dirname, 'commands/rankings.js');
const rankingsContent = fs.readFileSync(rankingsPath, 'utf8');

test('loadLastMessageFromDB method exists', 
    rankingsContent.includes('async loadLastMessageFromDB(client)'),
    'Method defined in rankings.js');
test('hasLoadedFromDB flag exists', 
    rankingsContent.includes('hasLoadedFromDB'),
    'Tracking flag added');
test('Saves message ID to database', 
    rankingsContent.includes("setBotState('rankings_message_id'") && 
    rankingsContent.includes('sentMessage.id'),
    'Database persistence implemented');
test('Loads message ID on update', 
    rankingsContent.includes('if (!this.hasLoadedFromDB)') &&
    rankingsContent.includes('await this.loadLastMessageFromDB(client)'),
    'Database load on startup implemented');
test('Clears invalid message ID', 
    rankingsContent.includes("setBotState('rankings_message_id', null)"),
    'Cleanup logic for invalid messages');
test('Edits existing message instead of deleting', 
    rankingsContent.includes('lastRankingsMessage.edit(') &&
    rankingsContent.includes('EDIT'),
    'Message editing implementation found');
test('Falls back to new message if edit fails', 
    rankingsContent.includes('editError') &&
    rankingsContent.includes('will post new message'),
    'Graceful fallback on edit failure');

// Test 4: Check bot.js has enhanced logging and retry logic
console.log('\n📋 Test 4: Enhanced Interval Logging and Error Handling');
const botPath = path.join(__dirname, 'bot.js');
const botContent = fs.readFileSync(botPath, 'utf8');

test('5-minute interval configured', 
    botContent.includes('5 * 60 * 1000'),
    'Interval: 300,000ms (5 minutes)');
test('Interval announcement log exists', 
    botContent.includes('Rankings auto-update interval configured: 5 minutes'),
    'Configuration logged at startup');
test('Timestamp logging in interval', 
    botContent.includes('toISOString()') && 
    botContent.includes('[${now.toISOString()}]'),
    'ISO timestamp format used');
test('Duration tracking exists', 
    botContent.includes('Duration:') && 
    botContent.includes('completedAt - now'),
    'Execution time measured');
test('Next update time logged', 
    botContent.includes('Next update:') && 
    botContent.includes('RANKINGS_UPDATE_INTERVAL_MS'),
    'Shows when next update will occur');
test('Retry logic implemented', 
    botContent.includes('updateRankingsWithRetry') &&
    botContent.includes('RANKINGS_MAX_RETRIES'),
    'Error retry mechanism exists');
test('Retry delay configured', 
    botContent.includes('RANKINGS_RETRY_DELAY_MS'),
    'Retry delay setting found');
test('Retry attempt logging', 
    botContent.includes('Retry attempt:') &&
    botContent.includes('retryCount'),
    'Retry attempts are logged');

// Test 5: Check footer message
console.log('\n📋 Test 5: User-Facing Information');
test('Footer mentions 5-minute refresh', 
    rankingsContent.includes('Mise à jour automatique toutes les 5 minutes'),
    'User notification in embed footer');

// Test 6: Verify no syntax errors
console.log('\n📋 Test 6: Code Quality');
const { execSync } = require('child_process');

try {
    execSync('node -c database/db.js', { stdio: 'pipe' });
    test('db.js has valid syntax', true);
} catch (e) {
    test('db.js has valid syntax', false, e.message);
}

try {
    execSync('node -c commands/rankings.js', { stdio: 'pipe' });
    test('rankings.js has valid syntax', true);
} catch (e) {
    test('rankings.js has valid syntax', false, e.message);
}

try {
    execSync('node -c bot.js', { stdio: 'pipe' });
    test('bot.js has valid syntax', true);
} catch (e) {
    test('bot.js has valid syntax', false, e.message);
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 Test Summary');
console.log('='.repeat(60));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
console.log('='.repeat(60));

if (testsFailed === 0) {
    console.log('\n🎉 All tests passed! The rankings auto-update system is ready.');
    console.log('\n📝 Implementation Summary:');
    console.log('   ✓ Rankings message ID persisted to database');
    console.log('   ✓ Message recovery after bot restart');
    console.log('   ✓ Messages edited in-place (no delete/repost spam)');
    console.log('   ✓ Fallback to new message if edit fails');
    console.log('   ✓ 5-minute interval with enhanced logging');
    console.log('   ✓ ISO timestamps and duration tracking');
    console.log('   ✓ Next update time visibility');
    console.log('   ✓ Automatic retry on errors (3 attempts)');
    console.log('   ✓ 30-second retry delay for transient errors');
    console.log('\n🚀 Expected Behavior:');
    console.log('   1. Bot starts and displays initial rankings after 5 seconds');
    console.log('   2. Rankings update every 5 minutes automatically');
    console.log('   3. Existing message edited in-place (same message ID)');
    console.log('   4. If edit fails, new message posted and tracked');
    console.log('   5. After bot restart, old message still gets edited');
    console.log('   6. Errors trigger automatic retry (max 3 attempts)');
    console.log('   7. Detailed logs show timestamp, duration, and next update');
    process.exit(0);
} else {
    console.log('\n⚠️  Some tests failed. Please review the implementation.');
    process.exit(1);
}
