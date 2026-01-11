/**
 * Verification script for rankings integration debug updates
 * This verifies:
 * 1. Rankings refresh interval is set to 5 minutes
 * 2. Debug logging is in place
 * 3. Channel ID is correct
 * 4. Podium displays variable sizes
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Rankings Integration Updates...\n');

let passed = 0;
let failed = 0;

// Read bot.js
const botJsPath = path.join(__dirname, 'bot.js');
const botJsContent = fs.readFileSync(botJsPath, 'utf8');

// Test 1: Check 5-minute interval
console.log('✓ Test 1: Checking refresh interval is 5 minutes...');
if (botJsContent.includes('5 * 60 * 1000') && botJsContent.includes('// 5 minutes in milliseconds')) {
    console.log('  ✅ PASS: Rankings refresh interval is set to 5 minutes (300,000ms)');
    passed++;
} else {
    console.log('  ❌ FAIL: Rankings refresh interval is not set to 5 minutes');
    failed++;
}

// Test 2: Check for debug logging in bot.js
console.log('\n✓ Test 2: Checking for enhanced debug logging in bot.js...');
const hasScheduledLog = botJsContent.includes('🔄 Starting scheduled rankings update...');
const hasCompletedLog = botJsContent.includes('✅ Scheduled rankings update completed');
const hasInitialLog = botJsContent.includes('🎯 Displaying initial rankings...');
const hasStackTrace = botJsContent.includes('error.stack');

if (hasScheduledLog && hasCompletedLog && hasInitialLog && hasStackTrace) {
    console.log('  ✅ PASS: Enhanced debug logging is present in bot.js');
    console.log('     - Scheduled update logs: ✓');
    console.log('     - Initial update logs: ✓');
    console.log('     - Stack trace logging: ✓');
    passed++;
} else {
    console.log('  ❌ FAIL: Some debug logging is missing in bot.js');
    failed++;
}

// Test 3: Check config.json for correct channel ID
console.log('\n✓ Test 3: Checking rankings channel ID in config.json...');
const configPath = path.join(__dirname, 'config.json');
const configContent = fs.readFileSync(configPath, 'utf8');
const config = JSON.parse(configContent);

if (config.channels.rankings === '1460012957458235618') {
    console.log('  ✅ PASS: Rankings channel ID is correctly set to 1460012957458235618');
    passed++;
} else {
    console.log(`  ❌ FAIL: Rankings channel ID is ${config.channels.rankings}, expected 1460012957458235618`);
    failed++;
}

// Test 4: Check rankings.js for comprehensive logging
console.log('\n✓ Test 4: Checking for comprehensive logging in rankings.js...');
const rankingsPath = path.join(__dirname, 'commands', 'rankings.js');
const rankingsContent = fs.readFileSync(rankingsPath, 'utf8');

const hasChannelLogs = rankingsContent.includes('📊 Fetching rankings data for channel:');
const hasPermissionCheck = rankingsContent.includes('Verify bot permissions');
const hasSendLogs = rankingsContent.includes('📤 Sending');
const hasErrorDetails = rankingsContent.includes('Discord API Error Code');

if (hasChannelLogs && hasPermissionCheck && hasSendLogs && hasErrorDetails) {
    console.log('  ✅ PASS: Comprehensive logging is present in rankings.js');
    console.log('     - Channel fetching logs: ✓');
    console.log('     - Permission verification: ✓');
    console.log('     - Message sending logs: ✓');
    console.log('     - Discord API error logging: ✓');
    passed++;
} else {
    console.log('  ❌ FAIL: Some logging is missing in rankings.js');
    failed++;
}

// Test 5: Check for variable avatar sizes (128px, 96px, 64px)
console.log('\n✓ Test 5: Checking for variable avatar sizes in podium...');
const has128px = rankingsContent.includes('size: 128');
const has96px = rankingsContent.includes('size: 96');
const has64px = rankingsContent.includes('size: 64');
const hasAvatarComment = rankingsContent.includes('Variable sizes: 🥇 128px, 🥈 96px, 🥉 64px');

if (has128px && has96px && has64px && hasAvatarComment) {
    console.log('  ✅ PASS: Variable avatar sizes implemented correctly');
    console.log('     - 🥇 1st place: 128px ✓');
    console.log('     - 🥈 2nd place: 96px ✓');
    console.log('     - 🥉 3rd place: 64px ✓');
    passed++;
} else {
    console.log('  ❌ FAIL: Variable avatar sizes not fully implemented');
    if (!has128px) console.log('     - Missing 128px size');
    if (!has96px) console.log('     - Missing 96px size');
    if (!has64px) console.log('     - Missing 64px size');
    failed++;
}

// Test 6: Check that tables are sent side-by-side
console.log('\n✓ Test 6: Checking that rankings tables are sent side-by-side...');
const sideByeSidePattern = /embeds:\s*\[\s*lcRankingsEmbed\s*,\s*levelsRankingsEmbed\s*\]/;
if (sideByeSidePattern.test(rankingsContent)) {
    console.log('  ✅ PASS: LC and Levels rankings tables are sent side-by-side in one message');
    passed++;
} else {
    console.log('  ❌ FAIL: Rankings tables are not configured to be sent side-by-side');
    failed++;
}

// Test 7: Check for permission verification
console.log('\n✓ Test 7: Checking for bot permission verification...');
const hasPermissionsCheck = rankingsContent.includes('const permissions = channel.permissionsFor(client.user)');
const hasRequiredPerms = rankingsContent.includes("'ViewChannel', 'SendMessages', 'EmbedLinks', 'ManageMessages'");
const hasMissingPermsLog = rankingsContent.includes('Missing required permissions');

if (hasPermissionsCheck && hasRequiredPerms && hasMissingPermsLog) {
    console.log('  ✅ PASS: Bot permission verification is implemented');
    console.log('     - Checks ViewChannel, SendMessages, EmbedLinks, ManageMessages');
    passed++;
} else {
    console.log('  ❌ FAIL: Bot permission verification is incomplete');
    failed++;
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 VERIFICATION SUMMARY');
console.log('='.repeat(60));
console.log(`✅ Passed: ${passed}/7`);
console.log(`❌ Failed: ${failed}/7`);

if (failed === 0) {
    console.log('\n🎉 All verifications passed! Rankings integration is properly updated.');
    console.log('\n📋 Summary of changes:');
    console.log('  1. ✅ Rankings refresh every 5 minutes (instead of 15)');
    console.log('  2. ✅ Comprehensive debug logging added');
    console.log('  3. ✅ Channel ID correctly set to 1460012957458235618');
    console.log('  4. ✅ Bot permission verification implemented');
    console.log('  5. ✅ Variable avatar sizes for podium (🥇 128px, 🥈 96px, 🥉 64px)');
    console.log('  6. ✅ LC and XP rankings display side-by-side');
    console.log('  7. ✅ Enhanced error logging with Discord API details');
    process.exit(0);
} else {
    console.log('\n⚠️  Some verifications failed. Please review the output above.');
    process.exit(1);
}
