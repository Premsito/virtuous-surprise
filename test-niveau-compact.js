/**
 * Test for Compact Niveau Command
 * This test validates the compact progression bar format and display logic
 */

const { getXPProgress } = require('./utils/xpHelper');

console.log('=== Compact Niveau Command Test ===\n');

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

// Helper function to create progress bar (matching niveau.js logic)
function createProgressBar(progress) {
    const progressBarLength = 10;
    const filledLength = Math.floor((progress / 100) * progressBarLength);
    const emptyLength = progressBarLength - filledLength;
    return '█'.repeat(filledLength) + '░'.repeat(emptyLength);
}

// Helper function to format niveau description (matching niveau.js logic)
function formatNiveauDescription(xp) {
    const progress = getXPProgress(xp);
    const progressBar = createProgressBar(progress.progress);
    return `🏆 Niveau : ${progress.level} | 🌟 Progression : [${progressBar}] ${progress.progress}% (${progress.currentLevelXP}/${progress.nextLevelXP} XP)`;
}

// Test progress bar with 0%
test('Progress bar at 0% shows all empty', () => {
    const bar = createProgressBar(0);
    assertEquals(bar, '░░░░░░░░░░', 'Progress bar at 0%');
    assertEquals(bar.length, 10, 'Progress bar length is 10');
});

// Test progress bar at 10%
test('Progress bar at 10% shows 1 filled', () => {
    const bar = createProgressBar(10);
    assertEquals(bar, '█░░░░░░░░░', 'Progress bar at 10%');
});

// Test progress bar at 50%
test('Progress bar at 50% shows 5 filled', () => {
    const bar = createProgressBar(50);
    assertEquals(bar, '█████░░░░░', 'Progress bar at 50%');
});

// Test progress bar at 100%
test('Progress bar at 100% shows all filled', () => {
    const bar = createProgressBar(100);
    assertEquals(bar, '██████████', 'Progress bar at 100%');
});

// Test progress bar at 6% (from the example in requirements)
test('Progress bar at 6% shows 0 filled (rounds down)', () => {
    const bar = createProgressBar(6);
    assertEquals(bar, '░░░░░░░░░░', 'Progress bar at 6%');
});

// Test progress bar at 15%
test('Progress bar at 15% shows 1 filled', () => {
    const bar = createProgressBar(15);
    assertEquals(bar, '█░░░░░░░░░', 'Progress bar at 15%');
});

// Test progress bar at 95%
test('Progress bar at 95% shows 9 filled', () => {
    const bar = createProgressBar(95);
    assertEquals(bar, '█████████░', 'Progress bar at 95%');
});

// Test full description format at 0 XP (Level 1, 0%)
test('Description format at 0 XP matches expected pattern', () => {
    const desc = formatNiveauDescription(0);
    assertTrue(desc.includes('🏆 Niveau : 1'), 'Contains level indicator');
    assertTrue(desc.includes('🌟 Progression :'), 'Contains progression indicator');
    assertTrue(desc.includes('[░░░░░░░░░░]'), 'Contains empty progress bar');
    assertTrue(desc.includes('0%'), 'Contains percentage');
    assertTrue(desc.includes('(0/100 XP)'), 'Contains XP ratio');
    assertEquals(desc, '🏆 Niveau : 1 | 🌟 Progression : [░░░░░░░░░░] 0% (0/100 XP)', 'Full description at 0 XP');
});

// Test full description format at 50 XP (Level 1, 50%)
test('Description format at 50 XP matches expected pattern', () => {
    const desc = formatNiveauDescription(50);
    assertTrue(desc.includes('🏆 Niveau : 1'), 'Contains level indicator');
    assertTrue(desc.includes('[█████░░░░░]'), 'Contains half-filled progress bar');
    assertTrue(desc.includes('50%'), 'Contains percentage');
    assertTrue(desc.includes('(50/100 XP)'), 'Contains XP ratio');
});

// Test full description format at 150 XP (Level 2, 25%)
test('Description format at 150 XP (level 2) matches expected pattern', () => {
    const desc = formatNiveauDescription(150);
    assertTrue(desc.includes('🏆 Niveau : 2'), 'Contains level 2 indicator');
    assertTrue(desc.includes('[██░░░░░░░░]'), 'Contains 25% progress bar (2/10)');
    assertTrue(desc.includes('25%'), 'Contains percentage');
    assertTrue(desc.includes('(50/200 XP)'), 'Contains XP ratio for level 2');
});

// Test that progress bar length is always 10
test('Progress bar length is always 10 characters', () => {
    for (let percent = 0; percent <= 100; percent += 10) {
        const bar = createProgressBar(percent);
        assertEquals(bar.length, 10, `Progress bar length at ${percent}%`);
    }
});

// Test edge cases
test('Progress bar handles edge percentages correctly', () => {
    assertEquals(createProgressBar(9).length, 10, '9% bar length');
    assertEquals(createProgressBar(11).length, 10, '11% bar length');
    assertEquals(createProgressBar(99).length, 10, '99% bar length');
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
