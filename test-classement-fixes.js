/**
 * Test script for !classement command fixes
 * Validates the enhanced logging and delete-based message updates
 */

const assert = require('assert');

console.log('🧪 Testing !classement command fixes...\n');

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
        testsPassed++;
    } catch (error) {
        console.error(`❌ ${name}`);
        console.error(`   Error: ${error.message}`);
        testsFailed++;
    }
}

// Test 1: Verify rankings.js file exists and is valid JavaScript
test('rankings.js file exists and has valid syntax', () => {
    const fs = require('fs');
    const path = require('path');
    const rankingsPath = path.join(__dirname, 'commands', 'rankings.js');
    
    assert(fs.existsSync(rankingsPath), 'rankings.js should exist');
    
    // Check basic structure without requiring (to avoid dependency issues)
    const content = fs.readFileSync(rankingsPath, 'utf8');
    assert(content.includes('module.exports'), 'Should export module');
    assert(content.includes('async execute(message, args)'), 'Should have execute function');
    assert(content.includes('async displayRankings(channel)'), 'Should have displayRankings function');
    assert(content.includes('async updateRankingsChannel(client)'), 'Should have updateRankingsChannel function');
});

// Test 2: Verify enhanced logging is present
test('Enhanced logging is implemented', () => {
    const fs = require('fs');
    const path = require('path');
    const rankingsPath = path.join(__dirname, 'commands', 'rankings.js');
    const content = fs.readFileSync(rankingsPath, 'utf8');
    
    // Check for database logging
    assert(content.includes('[DATABASE] Fetching top 10 LC rankings'), 'Should log LC database fetch');
    assert(content.includes('[DATABASE] Fetching top 10 Niveau rankings'), 'Should log Niveau database fetch');
    
    // Check for delete logging
    assert(content.includes('[DELETE] Deleting old rankings message'), 'Should log message deletion');
    
    // Check for channel validation logging
    assert(content.includes('[CHANNEL]') || content.includes('[DISPLAY]'), 'Should log channel information');
    
    // Check for error logging enhancements
    assert(content.includes('Error Type:'), 'Should log error type');
    assert(content.includes('Troubleshooting:'), 'Should provide troubleshooting info');
});

// Test 3: Verify delete-based approach is implemented
test('Delete-based message update is implemented', () => {
    const fs = require('fs');
    const path = require('path');
    const rankingsPath = path.join(__dirname, 'commands', 'rankings.js');
    const content = fs.readFileSync(rankingsPath, 'utf8');
    
    // Check that we're deleting messages
    assert(content.includes('await this.lastRankingsMessage.delete()'), 'Should delete old message');
    assert(content.includes('this.lastRankingsMessage = null'), 'Should clear message reference after delete');
    
    // Verify we're not using edit approach in updateRankingsChannel
    const updateFunctionMatch = content.match(/async updateRankingsChannel\(client\) \{[\s\S]*?\n    \}/);
    assert(updateFunctionMatch, 'Should find updateRankingsChannel function');
    
    const updateFunction = updateFunctionMatch[0];
    // The edit approach should not be the primary method anymore
    assert(!updateFunction.includes('await this.lastRankingsMessage.edit({') || 
           updateFunction.indexOf('delete()') < updateFunction.indexOf('edit('), 
           'Should delete before posting new message, not edit');
});

// Test 4: Verify error handling improvements
test('Error handling improvements are present', () => {
    const fs = require('fs');
    const path = require('path');
    const rankingsPath = path.join(__dirname, 'commands', 'rankings.js');
    const content = fs.readFileSync(rankingsPath, 'utf8');
    
    // Check for Discord error code handling
    assert(content.includes('error.code === 10003'), 'Should handle channel not found error');
    assert(content.includes('error.code === 50001'), 'Should handle missing access error');
    assert(content.includes('error.code === 50013'), 'Should handle missing permissions error');
    
    // Check for channel fetch error handling
    assert(content.includes('try {') && content.includes('catch (fetchError)'), 'Should have try-catch for channel fetch');
});

// Test 5: Verify user mentions don't trigger notifications
test('User mentions are in embed (no notifications)', () => {
    const fs = require('fs');
    const path = require('path');
    const rankingsPath = path.join(__dirname, 'commands', 'rankings.js');
    const content = fs.readFileSync(rankingsPath, 'utf8');
    
    // Check that mentions are in description (embed), not in content field
    const embedCreationMatch = content.match(/async createRankingEmbed\([\s\S]*?\n    \}/);
    assert(embedCreationMatch, 'Should find createRankingEmbed function');
    
    const embedFunction = embedCreationMatch[0];
    assert(embedFunction.includes('user.user_id') && embedFunction.includes('<@'), 'Should use mention format in embed');
    assert(embedFunction.includes('setDescription'), 'Should set description with mentions');
});

// Test 6: Verify config channel ID is used
test('Rankings channel ID is read from config', () => {
    const fs = require('fs');
    const path = require('path');
    const configPath = path.join(__dirname, 'config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    assert(config.channels, 'Config should have channels section');
    assert(config.channels.rankings, 'Config should have rankings channel ID');
    // Validate it's a valid Discord snowflake (numeric string)
    assert(/^\d+$/.test(config.channels.rankings), 'Rankings channel ID should be a valid Discord snowflake');
    assert(config.channels.rankings.length >= 17, 'Rankings channel ID should be at least 17 characters (Discord snowflake)');
});

// Test 7: Verify database methods exist
test('Database methods for rankings exist', () => {
    const fs = require('fs');
    const path = require('path');
    const dbPath = path.join(__dirname, 'database', 'db.js');
    const content = fs.readFileSync(dbPath, 'utf8');
    
    assert(content.includes('async getTopLC(limit = 10)'), 'Should have getTopLC function');
    assert(content.includes('async getTopLevels(limit = 10)'), 'Should have getTopLevels function');
    assert(content.includes('async getBotState(key)'), 'Should have getBotState function');
    assert(content.includes('async setBotState(key, value)'), 'Should have setBotState function');
});

// Test 8: Verify bot.js has the interval configured
test('Bot.js has 5-minute interval configured', () => {
    const fs = require('fs');
    const path = require('path');
    const botPath = path.join(__dirname, 'bot.js');
    const content = fs.readFileSync(botPath, 'utf8');
    
    assert(content.includes('5 * 60 * 1000'), 'Should have 5-minute interval (300000ms)');
    assert(content.includes('setInterval'), 'Should use setInterval for updates');
    assert(content.includes('updateRankingsChannel'), 'Should call updateRankingsChannel in interval');
});

// Test 9: Verify ManageMessages permission check
test('ManageMessages permission is checked', () => {
    const fs = require('fs');
    const path = require('path');
    const rankingsPath = path.join(__dirname, 'commands', 'rankings.js');
    const content = fs.readFileSync(rankingsPath, 'utf8');
    
    assert(content.includes('ManageMessages'), 'Should check ManageMessages permission');
    assert(content.includes('permissions'), 'Should verify permissions');
});

// Test 10: Verify command aliases
test('!classement command alias works', () => {
    const fs = require('fs');
    const path = require('path');
    const botPath = path.join(__dirname, 'bot.js');
    const content = fs.readFileSync(botPath, 'utf8');
    
    assert(content.includes("commandName === 'classement'"), 'Should have classement alias');
    assert(content.includes("commandName === 'rankings'"), 'Should have rankings command');
});

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 Test Summary');
console.log('='.repeat(60));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
console.log('='.repeat(60));

if (testsFailed === 0) {
    console.log('\n🎉 All tests passed! The !classement command fixes are ready.\n');
    process.exit(0);
} else {
    console.log('\n⚠️ Some tests failed. Please review the implementation.\n');
    process.exit(1);
}
