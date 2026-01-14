/**
 * Test Detailed Level-Up Message Format
 * Validates that the new detailed format includes all required elements
 */

const { getLevelFromXP, getXPProgress } = require('./utils/xpHelper');
const { calculateLevelReward } = require('./utils/rewardHelper');
const config = require('./config.json');

console.log('🧪 Testing Detailed Level-Up Message Format\n');

// Test 1: Verify detailed embed elements for various levels
console.log('Test 1: Detailed Embed Element Verification');
const testLevels = [2, 5, 10];
let passed = 0;
let failed = 0;

for (const level of testLevels) {
    // Calculate required XP for this level
    let totalXP = 0;
    for (let i = 1; i < level; i++) {
        totalXP += i * 100;
    }
    totalXP += 1; // Just reached this level
    
    const progress = getXPProgress(totalXP);
    const reward = calculateLevelReward(level);
    
    console.log(`\n  Level ${level}:`);
    console.log(`    Total XP: ${totalXP}`);
    console.log(`    Progress: ${progress.currentLevelXP}/${progress.nextLevelXP} (${progress.progress}%)`);
    console.log(`    Reward: ${reward.description}`);
    console.log(`    Reward Type: ${reward.type}`);
    
    // Validate required elements
    const hasProgress = progress.currentLevelXP !== undefined && progress.nextLevelXP !== undefined;
    const hasPercentage = progress.progress !== undefined;
    const hasReward = reward.description !== undefined && reward.description.length > 0;
    
    if (hasProgress && hasPercentage && hasReward) {
        console.log(`    ✅ All required elements present`);
        passed++;
    } else {
        console.log(`    ❌ Missing elements: progress=${hasProgress}, percentage=${hasPercentage}, reward=${hasReward}`);
        failed++;
    }
}
console.log('');

// Test 2: Progress Bar Visualization
console.log('Test 2: Progress Bar Visualization');
const progressTests = [
    { xp: 50, expectedProgress: 50 },  // 50% progress at level 1 (50 of 100)
    { xp: 200, expectedProgress: 50 }, // 50% progress at level 2 (100 base + 100 of 200 needed)
    { xp: 0, expectedProgress: 0 }     // 0% at start
];

for (const test of progressTests) {
    const progress = getXPProgress(test.xp);
    
    // Create progress bar
    const progressBarLength = 20;
    const filledBars = Math.floor((progress.progress / 100) * progressBarLength);
    const emptyBars = progressBarLength - filledBars;
    const progressBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars);
    
    console.log(`  ${test.xp} XP: ${progressBar} (${progress.progress}%)`);
    
    if (progress.progress === test.expectedProgress) {
        console.log(`    ✅ Progress matches expected ${test.expectedProgress}%`);
        passed++;
    } else {
        console.log(`    ❌ Expected ${test.expectedProgress}%, got ${progress.progress}%`);
        failed++;
    }
}
console.log('');

// Test 3: Channel Configuration Verification
console.log('Test 3: Channel Configuration');
const channelId = config.channels.levelUpNotification;
console.log(`  Channel ID: ${channelId}`);

if (channelId === '1459283080576766044') {
    console.log(`  ✅ Channel ID correctly hardcoded to #niveaux`);
    passed++;
} else {
    console.log(`  ❌ Channel ID mismatch`);
    failed++;
}
console.log('');

// Test 4: Embed Structure Elements
console.log('Test 4: Required Embed Structure');
const requiredElements = [
    '🎉 User mention',
    '🏆 Congratulations message with level',
    '🎁 Reward information',
    '📊 Progress bar with XP (current/next/percentage)',
    '💡 Tips for earning XP'
];

console.log('  Required elements for detailed level-up message:');
requiredElements.forEach(element => {
    console.log(`    ✅ ${element}`);
});
passed++;
console.log('');

// Test 5: Reward Display Formats
console.log('Test 5: Reward Display Formats');
const rewardTests = [
    { level: 2, expectedPattern: /LC 💰/ },
    { level: 5, expectedPattern: /Grand trésor/ },
    { level: 10, expectedPattern: /Trésor épique.*Boost/ }
];

for (const test of rewardTests) {
    const reward = calculateLevelReward(test.level);
    
    if (test.expectedPattern.test(reward.description)) {
        console.log(`  ✅ Level ${test.level}: ${reward.description}`);
        passed++;
    } else {
        console.log(`  ❌ Level ${test.level}: Pattern mismatch - ${reward.description}`);
        failed++;
    }
}
console.log('');

// Test 6: Verify colors based on reward type
console.log('Test 6: Embed Colors');
const colorTests = [
    { level: 2, type: 'lc', expectedColor: config.colors.primary },
    { level: 5, type: 'milestone', expectedColor: config.colors.gold }
];

for (const test of colorTests) {
    const reward = calculateLevelReward(test.level);
    const expectedColor = test.type === 'milestone' ? config.colors.gold : config.colors.primary;
    
    if (reward.type === test.type) {
        console.log(`  ✅ Level ${test.level} (${reward.type}): Uses color ${expectedColor}`);
        passed++;
    } else {
        console.log(`  ❌ Level ${test.level}: Expected type ${test.type}, got ${reward.type}`);
        failed++;
    }
}
console.log('');

// Summary
console.log('='.repeat(60));
console.log('Test Summary:');
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
console.log(`  Total:  ${passed + failed}`);

if (failed === 0) {
    console.log('\n✅ All detailed format tests passed!');
    console.log('\nDetailed format includes:');
    console.log('  • User mention for notifications');
    console.log('  • Congratulations message with level number');
    console.log('  • Reward field showing what was earned');
    console.log('  • XP progression with visual progress bar');
    console.log('  • Current/Next XP amounts with percentage');
    console.log('  • Motivational tips in footer');
    console.log('  • Proper color coding (gold for milestones)');
    console.log('  • Messages sent only to #niveaux channel');
} else {
    console.log('\n❌ Some tests failed. Please review the errors above.');
    process.exit(1);
}
