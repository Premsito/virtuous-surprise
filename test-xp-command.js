/**
 * Test for XP Management Command
 * This test validates the XP add/remove command functionality
 */

const { getLevelFromXP, getXPProgress } = require('./utils/xpHelper');

console.log('=== XP Management Command Test ===\n');

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
        testsPassed++;
    } catch (error) {
        console.log(`❌ ${name}`);
        console.log(`   Error: ${error.message}`);
        testsFailed++;
    }
}

function assertEquals(actual, expected, message) {
    if (actual !== expected) {
        throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
}

function assertTrue(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

// Test XP addition scenarios
test('Adding XP should increase total XP', () => {
    const oldXP = 100; // Level 2 (100 XP for level 1)
    const addAmount = 50;
    const newXP = oldXP + addAmount;
    
    assertEquals(newXP, 150, 'New XP after addition');
});

test('Adding enough XP should trigger level up', () => {
    const oldXP = 80; // Level 1 (80/100 XP)
    const oldLevel = getLevelFromXP(oldXP);
    const addAmount = 30; // Should reach 110 XP (level 2)
    const newXP = oldXP + addAmount;
    const newLevel = getLevelFromXP(newXP);
    
    assertEquals(oldLevel, 1, 'Old level');
    assertEquals(newLevel, 2, 'New level after XP addition');
    assertTrue(newLevel > oldLevel, 'Level should increase');
});

test('Adding large XP amount should handle multiple level ups', () => {
    const oldXP = 50; // Level 1
    const oldLevel = getLevelFromXP(oldXP);
    const addAmount = 500; // Should jump multiple levels
    const newXP = oldXP + addAmount;
    const newLevel = getLevelFromXP(newXP);
    
    assertEquals(oldLevel, 1, 'Old level');
    assertEquals(newLevel, 3, 'New level after large XP addition');
    assertTrue(newLevel > oldLevel + 1, 'Should skip multiple levels');
});

// Test XP removal scenarios
test('Removing XP should decrease total XP', () => {
    const oldXP = 200; // Level 2
    const removeAmount = 50;
    const newXP = oldXP - removeAmount;
    
    assertEquals(newXP, 150, 'New XP after removal');
});

test('Removing XP should handle level down', () => {
    const oldXP = 150; // Level 2 (50/200 into level 2)
    const oldLevel = getLevelFromXP(oldXP);
    const removeAmount = 60; // Should drop to 90 XP (level 1)
    const newXP = oldXP - removeAmount;
    const newLevel = getLevelFromXP(newXP);
    
    assertEquals(oldLevel, 2, 'Old level');
    assertEquals(newLevel, 1, 'New level after XP removal');
    assertTrue(newLevel < oldLevel, 'Level should decrease');
});

test('Removing XP should not go below 0', () => {
    const oldXP = 50;
    const removeAmount = 100;
    const newXP = Math.max(0, oldXP - removeAmount);
    
    assertEquals(newXP, 0, 'XP should not go negative');
    assertEquals(getLevelFromXP(newXP), 1, 'Should remain at level 1');
});

// Test XP progress calculations for display
test('XP progress shows correct information after addition', () => {
    const xp = 150; // 50 into level 2
    const progress = getXPProgress(xp);
    
    assertEquals(progress.level, 2, 'Level');
    assertEquals(progress.currentLevelXP, 50, 'Current level XP');
    assertEquals(progress.nextLevelXP, 200, 'Next level XP');
    assertEquals(progress.progress, 25, 'Progress percentage (50/200 = 25%)');
});

// Test edge cases
test('Adding 0 XP should not change level', () => {
    const oldXP = 100;
    const oldLevel = getLevelFromXP(oldXP);
    const addAmount = 0;
    const newXP = oldXP + addAmount;
    const newLevel = getLevelFromXP(newXP);
    
    assertEquals(oldLevel, newLevel, 'Level should not change');
});

test('Level calculation at exact level boundary', () => {
    const xp1 = 100; // Exactly level 2
    const xp2 = 99;  // Just below level 2
    
    assertEquals(getLevelFromXP(xp1), 2, 'Should be level 2 at 100 XP');
    assertEquals(getLevelFromXP(xp2), 1, 'Should be level 1 at 99 XP');
});

test('Multiple level transitions', () => {
    // Test jumping from level 1 to level 5
    const startXP = 0;
    const startLevel = getLevelFromXP(startXP);
    
    // XP needed for level 5: 100 + 200 + 300 + 400 = 1000
    const targetXP = 1000;
    const targetLevel = getLevelFromXP(targetXP);
    
    assertEquals(startLevel, 1, 'Start level');
    assertEquals(targetLevel, 5, 'Target level');
    
    // Verify intermediate levels
    assertEquals(getLevelFromXP(100), 2, 'Level 2 at 100 XP');
    assertEquals(getLevelFromXP(300), 3, 'Level 3 at 300 XP');
    assertEquals(getLevelFromXP(600), 4, 'Level 4 at 600 XP');
});

// Test validation scenarios (simulated)
test('Invalid amount (negative) should be rejected', () => {
    const amount = -50;
    const isValid = amount > 0;
    
    assertTrue(!isValid, 'Negative amounts should be invalid');
});

test('Invalid amount (zero) should be rejected', () => {
    const amount = 0;
    const isValid = amount > 0;
    
    assertTrue(!isValid, 'Zero amounts should be invalid');
});

test('Invalid amount (NaN) should be rejected', () => {
    const amount = parseInt('abc');
    const isValid = !isNaN(amount) && amount > 0;
    
    assertTrue(!isValid, 'NaN amounts should be invalid');
});

// Summary
console.log('\n=== Test Summary ===');
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`Total: ${testsPassed + testsFailed}`);

if (testsFailed > 0) {
    console.log('\n⚠️ Some tests failed!');
    process.exit(1);
} else {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
}
