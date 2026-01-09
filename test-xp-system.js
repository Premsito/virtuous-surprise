/**
 * Test for XP and Leveling System
 * This test validates XP calculations, level progression, and database helpers
 */

const { 
    getXPForLevel, 
    getLevelFromXP, 
    getXPProgress, 
    getMessageXP, 
    getGameXP, 
    getVoiceXP, 
    canGrantMessageXP, 
    getReactionXP,
    XP_CONFIG 
} = require('./utils/xpHelper');

console.log('=== XP and Leveling System Test ===\n');

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

// Test XP for level calculations
test('XP for level 1 should be 100', () => {
    assertEquals(getXPForLevel(1), 100, 'Level 1 XP');
});

test('XP for level 5 should be 500', () => {
    assertEquals(getXPForLevel(5), 500, 'Level 5 XP');
});

test('XP for level 10 should be 1000', () => {
    assertEquals(getXPForLevel(10), 1000, 'Level 10 XP');
});

// Test level from XP calculations
test('Level from 0 XP should be 1', () => {
    assertEquals(getLevelFromXP(0), 1, 'Level from 0 XP');
});

test('Level from 100 XP should be 2', () => {
    assertEquals(getLevelFromXP(100), 2, 'Level from 100 XP');
});

test('Level from 300 XP should be 3 (100 + 200)', () => {
    assertEquals(getLevelFromXP(300), 3, 'Level from 300 XP');
});

test('Level from 600 XP should be 4 (100 + 200 + 300)', () => {
    assertEquals(getLevelFromXP(600), 4, 'Level from 600 XP');
});

// Test XP progress calculations
test('XP progress at 0 XP shows correct values', () => {
    const progress = getXPProgress(0);
    assertEquals(progress.level, 1, 'Level at 0 XP');
    assertEquals(progress.currentLevelXP, 0, 'Current level XP at 0');
    assertEquals(progress.nextLevelXP, 100, 'Next level XP at level 1');
    assertEquals(progress.progress, 0, 'Progress percentage at 0');
});

test('XP progress at 50 XP shows 50% progress to level 2', () => {
    const progress = getXPProgress(50);
    assertEquals(progress.level, 1, 'Level at 50 XP');
    assertEquals(progress.currentLevelXP, 50, 'Current level XP at 50');
    assertEquals(progress.nextLevelXP, 100, 'Next level XP at level 1');
    assertEquals(progress.progress, 50, 'Progress percentage at 50 XP');
});

test('XP progress at 150 XP (level 2) shows correct values', () => {
    const progress = getXPProgress(150);
    assertEquals(progress.level, 2, 'Level at 150 XP');
    assertEquals(progress.currentLevelXP, 50, 'Current level XP at 150 (50 into level 2)');
    assertEquals(progress.nextLevelXP, 200, 'Next level XP at level 2');
    assertEquals(progress.progress, 25, 'Progress percentage at 150 XP (50/200 = 25%)');
});

// Test message XP
test('Message XP is between 1 and 3', () => {
    for (let i = 0; i < 100; i++) {
        const xp = getMessageXP();
        assertTrue(xp >= 1 && xp <= 3, `Message XP ${xp} is not in range 1-3`);
    }
});

// Test game XP
test('Game win XP is 15', () => {
    assertEquals(getGameXP('win'), 15, 'Win XP');
});

test('Game loss XP is 5', () => {
    assertEquals(getGameXP('loss'), 5, 'Loss XP');
});

test('Game push/unknown result gives 0 XP', () => {
    assertEquals(getGameXP('push'), 0, 'Push XP');
    assertEquals(getGameXP('unknown'), 0, 'Unknown result XP');
});

// Test voice XP
test('Voice XP with less than 2 users is 0', () => {
    assertEquals(getVoiceXP(1), 0, 'Voice XP with 1 user');
});

test('Voice XP with 2 users is base XP (1)', () => {
    assertEquals(getVoiceXP(2), XP_CONFIG.VOICE_XP_PER_INTERVAL, 'Voice XP with 2 users');
});

test('Voice XP with 3 users includes bonus', () => {
    const expected = XP_CONFIG.VOICE_XP_PER_INTERVAL + XP_CONFIG.VOICE_BONUS_PER_EXTRA_USER;
    assertEquals(getVoiceXP(3), expected, 'Voice XP with 3 users');
});

test('Voice XP with 5 users includes multiple bonuses', () => {
    const expected = XP_CONFIG.VOICE_XP_PER_INTERVAL + (3 * XP_CONFIG.VOICE_BONUS_PER_EXTRA_USER);
    assertEquals(getVoiceXP(5), expected, 'Voice XP with 5 users');
});

// Test message XP cooldown
test('Can grant message XP when no previous grant', () => {
    assertTrue(canGrantMessageXP(null), 'Should grant XP on first message');
});

test('Cannot grant message XP within cooldown period', () => {
    const now = new Date();
    const recentGrant = new Date(now.getTime() - 30000); // 30 seconds ago
    assertTrue(!canGrantMessageXP(recentGrant), 'Should not grant XP within 1 minute');
});

test('Can grant message XP after cooldown period', () => {
    const now = new Date();
    const oldGrant = new Date(now.getTime() - 61000); // 61 seconds ago
    assertTrue(canGrantMessageXP(oldGrant), 'Should grant XP after 1 minute');
});

// Test reaction XP
test('Reaction XP for 1 reaction is 2', () => {
    assertEquals(getReactionXP(1, 0), 2, 'One reaction XP');
});

test('Reaction XP for 5 reactions is 10', () => {
    assertEquals(getReactionXP(5, 0), 10, 'Five reactions XP');
});

test('Reaction XP is capped at 10 per message', () => {
    assertEquals(getReactionXP(10, 0), 10, 'Max reaction XP');
    assertEquals(getReactionXP(100, 0), 10, 'Capped reaction XP');
});

test('Reaction XP respects existing XP on message', () => {
    assertEquals(getReactionXP(5, 8), 2, 'Reaction XP with 8 already earned (max 10)');
    assertEquals(getReactionXP(5, 10), 0, 'No more XP when at max');
});

// Test XP configuration constants
test('XP_CONFIG has all required values', () => {
    assertTrue(XP_CONFIG.GAME_WIN === 15, 'Game win XP is 15');
    assertTrue(XP_CONFIG.GAME_LOSS === 5, 'Game loss XP is 5');
    assertTrue(XP_CONFIG.MESSAGE_MIN === 1, 'Message min XP is 1');
    assertTrue(XP_CONFIG.MESSAGE_MAX === 3, 'Message max XP is 3');
    assertTrue(XP_CONFIG.MESSAGE_COOLDOWN_MS === 60000, 'Message cooldown is 60 seconds');
    assertTrue(XP_CONFIG.VOICE_XP_INTERVAL_MS === 120000, 'Voice interval is 2 minutes');
    assertTrue(XP_CONFIG.VOICE_XP_PER_INTERVAL === 1, 'Voice XP per interval is 1');
    assertTrue(XP_CONFIG.VOICE_HOUR_BONUS === 25, 'Voice hour bonus is 25');
    assertTrue(XP_CONFIG.VOICE_MIN_USERS === 2, 'Voice min users is 2');
    assertTrue(XP_CONFIG.VOICE_BONUS_PER_EXTRA_USER === 2, 'Voice bonus per extra user is 2');
    assertTrue(XP_CONFIG.REACTION_XP === 2, 'Reaction XP is 2');
    assertTrue(XP_CONFIG.REACTION_MAX_PER_MESSAGE === 10, 'Max reaction XP per message is 10');
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
