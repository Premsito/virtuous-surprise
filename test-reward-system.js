/**
 * Test reward system calculations
 * Verifies that rewards are correctly calculated for different levels
 */

const { calculateLevelReward, isMilestoneLevel, getMilestoneTreasure, formatRewardEmbed } = require('./utils/rewardHelper');

console.log('🧪 Testing Reward System\n');

// Test milestone detection
console.log('📝 Test 1: Milestone Level Detection');
const milestoneLevels = [1, 5, 10, 15, 20, 25];
const normalLevels = [2, 3, 4, 6, 7, 8, 9, 11, 13, 17, 19];

console.log('  Milestone levels (should be true):');
milestoneLevels.forEach(level => {
    const result = isMilestoneLevel(level);
    console.log(`    Level ${level}: ${result ? '✅' : '❌'} ${result ? 'PASS' : 'FAIL'}`);
});

console.log('  Normal levels (should be false):');
normalLevels.forEach(level => {
    const result = isMilestoneLevel(level);
    console.log(`    Level ${level}: ${!result ? '✅' : '❌'} ${!result ? 'PASS' : 'FAIL'}`);
});
console.log();

// Test reward calculations for various levels
console.log('📝 Test 2: Reward Calculations\n');

// Test milestone levels
console.log('  Milestone Levels:');
[1, 5, 10, 15, 20].forEach(level => {
    const reward = calculateLevelReward(level);
    console.log(`    Level ${level}:`);
    console.log(`      Type: ${reward.type}`);
    console.log(`      Name: ${reward.name || 'N/A'}`);
    console.log(`      LC Amount: ${reward.lcAmount}`);
    console.log(`      Boost: ${reward.boost ? `${reward.boost.type} x${reward.boost.multiplier} (${reward.boost.duration}s)` : 'None'}`);
    console.log(`      Description: ${reward.description}`);
    console.log();
});

// Test normal progression levels
console.log('  Normal Progression Levels:');
[2, 3, 4, 6, 7, 8, 9, 11, 12, 13].forEach(level => {
    const reward = calculateLevelReward(level);
    console.log(`    Level ${level}:`);
    console.log(`      Type: ${reward.type}`);
    console.log(`      LC Amount: ${reward.lcAmount}`);
    console.log(`      Boost: ${reward.boost ? `${reward.boost.type} x${reward.boost.multiplier}` : 'None'}`);
    console.log(`      Description: ${reward.description}`);
});
console.log();

// Test alternating pattern for normal levels
console.log('📝 Test 3: Progressive LC Reward Verification\n');
console.log('  All non-milestone levels should give progressive LC rewards:');
for (let level = 2; level <= 9; level++) {
    if (isMilestoneLevel(level)) continue;
    
    const reward = calculateLevelReward(level);
    const expectedLC = (() => {
        let count = 0;
        for (let i = 2; i <= level; i++) {
            if (!isMilestoneLevel(i)) count++;
        }
        return count * 25;
    })();
    
    const pass = reward.type === 'lc' && reward.lcAmount === expectedLC;
    console.log(`    Level ${level}: ${pass ? '✅' : '❌'} Expected ${expectedLC} LC, got ${reward.description}`);
}
console.log();

// Test boost alternation for odd levels (removed since we no longer give boosts on odd levels)
console.log('📝 Test 4: Treasure Claimability Verification\n');
console.log('  Milestone treasures should be claimable (lcAmount = 0):');
[1, 5, 10, 15, 20].forEach(level => {
    const reward = calculateLevelReward(level);
    const pass = reward.type === 'milestone' && reward.lcAmount === 0;
    
    console.log(`    Level ${level}: ${pass ? '✅' : '❌'} Treasure is ${reward.lcAmount === 0 ? 'claimable' : 'auto-assigned'}`);
});
console.log();

// Test embed formatting
console.log('📝 Test 5: Embed Formatting\n');
console.log('  Sample embeds for different reward types:');

const testLevels = [1, 2, 3, 5, 10];
testLevels.forEach(level => {
    const reward = calculateLevelReward(level);
    const embed = formatRewardEmbed(reward, level);
    console.log(`    Level ${level}:`);
    console.log(`      Title: ${embed.title}`);
    console.log(`      Description: ${embed.description}`);
    console.log();
});

// Test milestone treasure ranges
console.log('📝 Test 6: Milestone Treasure Ranges\n');
console.log('  Verifying LC amount ranges for milestones:');
const milestoneTests = [
    { level: 1, expectedMin: 15, expectedMax: 35, name: 'Petit trésor' },
    { level: 5, expectedMin: 75, expectedMax: 100, name: 'Grand trésor' },
    { level: 10, expectedMin: 200, expectedMax: 300, name: 'Trésor épique' },
    { level: 20, expectedMin: 300, expectedMax: 400, name: 'Trésor légendaire' }
];

milestoneTests.forEach(test => {
    const treasure = getMilestoneTreasure(test.level);
    const nameMatch = treasure.name === test.name;
    const minMatch = treasure.minLC === test.expectedMin;
    const maxMatch = treasure.maxLC === test.expectedMax;
    const pass = nameMatch && minMatch && maxMatch;
    
    console.log(`    Level ${test.level}: ${pass ? '✅' : '❌'}`);
    console.log(`      Name: ${treasure.name} (expected: ${test.name})`);
    console.log(`      Range: ${treasure.minLC}-${treasure.maxLC} LC (expected: ${test.expectedMin}-${test.expectedMax})`);
    console.log(`      Boost: ${treasure.boost ? `${treasure.boost.type} x${treasure.boost.multiplier}` : 'None'}`);
});
console.log();

console.log('✅ Reward System Tests Complete!');
