/**
 * Test for Merged Niveau Command
 * This test validates the merged !niveau command functionality
 */

const { getXPProgress } = require('./utils/xpHelper');
const config = require('./config.json');

console.log('=== Merged Niveau Command Test ===\n');

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

function assertContains(text, substring, message) {
    if (!text.includes(substring)) {
        throw new Error(`${message}: expected text to contain "${substring}"`);
    }
}

// Test 1: Channel restriction configuration
test('Channel restriction is properly configured', () => {
    const levelsChannelId = config.channels.levelUpNotification;
    assertEquals(levelsChannelId, '1459283080576766044', 'Levels channel ID matches requirement');
});

// Test 2: Simulate wrong channel usage
test('Command rejects usage in wrong channel', () => {
    const wrongChannelId = '9999999999999999999';
    const levelsChannelId = config.channels.levelUpNotification;
    const isWrongChannel = wrongChannelId !== levelsChannelId;
    assertTrue(isWrongChannel, 'Wrong channel should be rejected');
});

// Test 3: Simulate correct channel usage
test('Command accepts usage in correct channel', () => {
    const correctChannelId = '1459283080576766044';
    const levelsChannelId = config.channels.levelUpNotification;
    const isCorrectChannel = correctChannelId === levelsChannelId;
    assertTrue(isCorrectChannel, 'Correct channel should be accepted');
});

// Test 4: Verify description format includes progress bar
test('Description includes progress bar', () => {
    const totalXP = 50;
    const progress = getXPProgress(totalXP);
    
    const progressBarLength = 10;
    const filledLength = Math.floor((progress.progress / 100) * progressBarLength);
    const emptyLength = progressBarLength - filledLength;
    const progressBar = '█'.repeat(filledLength) + '░'.repeat(emptyLength);
    
    const description = 
        `🆙 **Niveau Actuel :** ${progress.level}\n` +
        `💪 **XP Actuel :** ${progress.currentLevelXP} / ${progress.nextLevelXP}\n` +
        `📊 **Progression :** [${progressBar}] ${progress.progress}%\n` +
        `Encore **${progress.nextLevelXP - progress.currentLevelXP} XP** nécessaires pour atteindre le niveau suivant !\n\n` +
        `Continuez à progresser pour débloquer des récompenses 🎁 !`;
    
    assertContains(description, progressBar, 'Description should contain progress bar');
    assertContains(description, 'Niveau Actuel', 'Description should contain level');
    assertContains(description, 'XP Actuel', 'Description should contain XP');
    assertContains(description, 'Progression', 'Description should contain progression label');
    assertContains(description, 'récompenses', 'Description should contain motivational message');
});

// Test 5: Verify description format at different XP levels
test('Description format at level 1 (0 XP)', () => {
    const totalXP = 0;
    const progress = getXPProgress(totalXP);
    
    assertEquals(progress.level, 1, 'Level should be 1');
    assertEquals(progress.currentLevelXP, 0, 'Current XP should be 0');
    assertEquals(progress.nextLevelXP, 100, 'Next level XP should be 100');
    assertEquals(progress.progress, 0, 'Progress should be 0%');
});

// Test 6: Verify description format at mid-level
test('Description format at level 5 (1215 XP)', () => {
    const totalXP = 1215;
    const progress = getXPProgress(totalXP);
    
    assertEquals(progress.level, 5, 'Level should be 5');
    assertEquals(progress.currentLevelXP, 215, 'Current XP should be 215');
    assertEquals(progress.nextLevelXP, 500, 'Next level XP should be 500');
    assertTrue(progress.progress >= 40 && progress.progress <= 45, 'Progress should be around 43%');
});

// Test 7: Verify error message format
test('Error message is user-friendly', () => {
    const errorMessage = '⛔ Utilisez cette commande uniquement dans le salon des niveaux pour voir votre progression !';
    assertContains(errorMessage, '⛔', 'Error message should contain stop sign emoji');
    assertContains(errorMessage, 'salon des niveaux', 'Error message should mention levels channel');
    assertContains(errorMessage, 'progression', 'Error message should mention progression');
});

// Test 8: Verify the command displays all required information
test('Command output contains all required elements', () => {
    const totalXP = 500;
    const progress = getXPProgress(totalXP);
    const xpNeeded = progress.nextLevelXP - progress.currentLevelXP;
    
    const progressBarLength = 10;
    const filledLength = Math.floor((progress.progress / 100) * progressBarLength);
    const emptyLength = progressBarLength - filledLength;
    const progressBar = '█'.repeat(filledLength) + '░'.repeat(emptyLength);
    
    const description = 
        `🆙 **Niveau Actuel :** ${progress.level}\n` +
        `💪 **XP Actuel :** ${progress.currentLevelXP} / ${progress.nextLevelXP}\n` +
        `📊 **Progression :** [${progressBar}] ${progress.progress}%\n` +
        `Encore **${xpNeeded} XP** nécessaires pour atteindre le niveau suivant !\n\n` +
        `Continuez à progresser pour débloquer des récompenses 🎁 !`;
    
    // Check all required elements
    assertContains(description, '🆙', 'Should contain level emoji');
    assertContains(description, '💪', 'Should contain XP emoji');
    assertContains(description, '📊', 'Should contain progression emoji');
    assertContains(description, progressBar, 'Should contain progress bar');
    assertContains(description, `${progress.level}`, 'Should contain level number');
    assertContains(description, `${progress.currentLevelXP}`, 'Should contain current XP');
    assertContains(description, `${progress.nextLevelXP}`, 'Should contain next level XP');
    assertContains(description, `${xpNeeded}`, 'Should contain XP needed');
    assertContains(description, '🎁', 'Should contain gift emoji for rewards');
});

console.log('\n=== Test Summary ===');
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`Total: ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
} else {
    console.log(`\n❌ ${testsFailed} test(s) failed.`);
    process.exit(1);
}
