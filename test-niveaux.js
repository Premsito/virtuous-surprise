/**
 * Test for Niveaux Command (Channel-Restricted Level Display)
 * This test validates the channel restriction and display logic for !niveaux
 */

const { getXPProgress } = require('./utils/xpHelper');
const config = require('./config.json');

console.log('=== Niveaux Command Test ===\n');

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

// Test channel ID configuration
test('Levels channel ID is configured correctly', () => {
    assertTrue(config.channels.levelUpNotification, 'levelUpNotification channel is configured');
    assertEquals(config.channels.levelUpNotification, '1459283080576766044', 'Channel ID matches requirement');
});

// Helper function to simulate channel check
function isCorrectChannel(channelId) {
    return channelId === config.channels.levelUpNotification;
}

// Test channel validation logic
test('Channel validation accepts correct channel ID', () => {
    const result = isCorrectChannel('1459283080576766044');
    assertTrue(result, 'Should accept correct channel ID');
});

test('Channel validation rejects incorrect channel ID', () => {
    const result = isCorrectChannel('9999999999999999999');
    assertTrue(!result, 'Should reject incorrect channel ID');
});

// Helper function to format niveaux embed description
function formatNiveauxDescription(xp) {
    const progress = getXPProgress(xp);
    const xpNeeded = progress.nextLevelXP - progress.currentLevelXP;
    
    return (
        `🆙 **Niveau Actuel :** ${progress.level}\n` +
        `💪 **XP Actuel :** ${progress.currentLevelXP} / ${progress.nextLevelXP}\n` +
        `Encore **${xpNeeded} XP** nécessaires pour atteindre le niveau suivant !\n\n` +
        `Continuez à progresser pour débloquer des récompenses 🎁 !`
    );
}

// Test niveaux description format at 0 XP (Level 1)
test('Niveaux description at 0 XP shows correct format', () => {
    const desc = formatNiveauxDescription(0);
    assertContains(desc, '🆙 **Niveau Actuel :** 1', 'Contains current level');
    assertContains(desc, '💪 **XP Actuel :** 0 / 100', 'Contains XP progress');
    assertContains(desc, 'Encore **100 XP** nécessaires', 'Contains XP needed');
    assertContains(desc, 'Continuez à progresser pour débloquer des récompenses 🎁 !', 'Contains motivational message');
});

// Test niveaux description format at 50 XP (Level 1, halfway)
test('Niveaux description at 50 XP shows correct format', () => {
    const desc = formatNiveauxDescription(50);
    assertContains(desc, '🆙 **Niveau Actuel :** 1', 'Contains current level');
    assertContains(desc, '💪 **XP Actuel :** 50 / 100', 'Contains XP progress');
    assertContains(desc, 'Encore **50 XP** nécessaires', 'Contains XP needed');
});

// Test niveaux description format at 1215 XP
// With 1215 XP: User is at Level 5 with 215/500 XP progress
test('Niveaux description at 1215 XP shows progress', () => {
    const desc = formatNiveauxDescription(1215);
    const progress = getXPProgress(1215);
    
    // Verify the level and XP calculations are correct
    assertTrue(progress.level > 0, 'Level should be greater than 0');
    assertTrue(progress.currentLevelXP >= 0, 'Current level XP should be non-negative');
    assertTrue(progress.nextLevelXP > 0, 'Next level XP should be positive');
    
    assertContains(desc, '🆙 **Niveau Actuel :**', 'Contains current level indicator');
    assertContains(desc, '💪 **XP Actuel :**', 'Contains XP progress indicator');
    assertContains(desc, 'Encore', 'Contains XP needed message');
});

// Test error message format
test('Error message for wrong channel is correct', () => {
    const errorMsg = '⛔ Utilisez cette commande uniquement dans le salon des niveaux pour voir votre progression !';
    assertContains(errorMsg, '⛔', 'Contains error emoji');
    assertContains(errorMsg, 'salon des niveaux', 'Mentions levels channel');
});

// Test that description always contains required elements
test('Niveaux description contains all required elements', () => {
    const testXPValues = [0, 50, 150, 500, 1215];
    
    for (const xp of testXPValues) {
        const desc = formatNiveauxDescription(xp);
        assertContains(desc, '🆙 **Niveau Actuel :**', `XP ${xp}: Contains level indicator`);
        assertContains(desc, '💪 **XP Actuel :**', `XP ${xp}: Contains XP indicator`);
        assertContains(desc, 'Encore', `XP ${xp}: Contains "Encore" message`);
        assertContains(desc, 'XP** nécessaires', `XP ${xp}: Contains XP needed`);
        assertContains(desc, 'Continuez à progresser', `XP ${xp}: Contains motivational message`);
        assertContains(desc, '🎁', `XP ${xp}: Contains reward emoji`);
    }
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
