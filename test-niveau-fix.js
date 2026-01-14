/**
 * Test script to validate the niveau ranking fix
 * This script tests that levels are calculated consistently from XP
 */

const { getLevelFromXP } = require('./utils/xpHelper');

console.log('🧪 Testing Niveau Ranking Fix\n');
console.log('='.repeat(60));

// Test cases: XP values and their expected levels
const testCases = [
    { xp: 0, expectedLevel: 1 },
    { xp: 50, expectedLevel: 1 },
    { xp: 99, expectedLevel: 1 },
    { xp: 100, expectedLevel: 2 },
    { xp: 150, expectedLevel: 2 },
    { xp: 299, expectedLevel: 2 },
    { xp: 300, expectedLevel: 3 },
    { xp: 500, expectedLevel: 3 },
    { xp: 599, expectedLevel: 3 },
    { xp: 600, expectedLevel: 4 },
    { xp: 1000, expectedLevel: 5 },
    { xp: 5000, expectedLevel: 10 },
];

console.log('\n📊 Test 1: Level Calculation from XP');
console.log('-'.repeat(60));

let allPassed = true;
testCases.forEach(({ xp, expectedLevel }) => {
    const calculatedLevel = getLevelFromXP(xp);
    const passed = calculatedLevel === expectedLevel;
    const status = passed ? '✅' : '❌';
    
    if (!passed) {
        allPassed = false;
        console.log(`${status} XP: ${xp.toString().padEnd(6)} | Expected: Level ${expectedLevel} | Got: Level ${calculatedLevel} | FAILED`);
    } else {
        console.log(`${status} XP: ${xp.toString().padEnd(6)} | Level ${calculatedLevel}`);
    }
});

console.log('\n📊 Test 2: Simulated getTopLevels() Logic');
console.log('-'.repeat(60));

// Simulate database query results (sorted by XP DESC)
const mockDatabaseResults = [
    { user_id: '1', username: 'User1', xp: 5000 },
    { user_id: '2', username: 'User2', xp: 1000 },
    { user_id: '3', username: 'User3', xp: 600 },
    { user_id: '4', username: 'User4', xp: 300 },
    { user_id: '5', username: 'User5', xp: 100 },
    { user_id: '6', username: 'User6', xp: 50 },
];

// Simulate the new logic in getTopLevels()
const usersWithLevels = mockDatabaseResults.map(user => ({
    ...user,
    level: Math.floor(getLevelFromXP(user.xp || 0))
}));

console.log('\nRanking (by XP DESC):');
usersWithLevels.forEach((user, i) => {
    console.log(`  ${i + 1}. ${user.username.padEnd(10)} - Level ${user.level}, XP: ${user.xp}`);
});

console.log('\n📊 Test 3: Consistency Check');
console.log('-'.repeat(60));

// Verify that rankings by XP are correct
let rankingCorrect = true;
for (let i = 1; i < usersWithLevels.length; i++) {
    const prev = usersWithLevels[i - 1];
    const curr = usersWithLevels[i];
    
    if (prev.xp < curr.xp) {
        console.log(`❌ Ranking error: ${prev.username} (XP ${prev.xp}) ranked before ${curr.username} (XP ${curr.xp})`);
        rankingCorrect = false;
    }
}

if (rankingCorrect) {
    console.log('✅ Rankings are correctly ordered by XP (DESC)');
}

// Verify levels match XP
let levelsCorrect = true;
usersWithLevels.forEach(user => {
    const expectedLevel = getLevelFromXP(user.xp);
    if (user.level !== expectedLevel) {
        console.log(`❌ Level mismatch for ${user.username}: Level ${user.level} but XP ${user.xp} should be Level ${expectedLevel}`);
        levelsCorrect = false;
    }
});

if (levelsCorrect) {
    console.log('✅ All levels correctly calculated from XP');
}

console.log('\n' + '='.repeat(60));
if (allPassed && rankingCorrect && levelsCorrect) {
    console.log('✅ All tests passed! The fix is working correctly.');
} else {
    console.log('❌ Some tests failed. Please review the implementation.');
}
console.log('='.repeat(60) + '\n');
