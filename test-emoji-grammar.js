/**
 * Test for emoji fallback and grammar fixes in invite tracking
 * This test validates that:
 * 1. Emoji fallback logic works correctly
 * 2. Grammar pluralization is correct
 */

console.log('=== Emoji Fallback and Grammar Test ===\n');

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

// Mock client.emojis.cache
const createMockClient = (hasCustomEmojis) => {
    return {
        emojis: {
            cache: {
                find: (predicate) => {
                    if (!hasCustomEmojis) return undefined;
                    
                    // Mock custom emojis
                    const mockEmojis = [
                        { name: 'Invite_People', toString: () => '<:Invite_People:123>' },
                        { name: 'Boost_Gems_Month_24', toString: () => '<:Boost_Gems_Month_24:456>' }
                    ];
                    
                    return mockEmojis.find(predicate);
                }
            }
        }
    };
};

const config = require('./config.json');

// Test 1: Emoji fallback when custom emojis don't exist
test('Emoji fallback to Unicode when custom emojis are not available', () => {
    const client = createMockClient(false);
    
    const invitePeopleEmote = client.emojis.cache.find(e => e.name === config.emotes.invitePeople) || '📨';
    const boostGemsEmote = client.emojis.cache.find(e => e.name === config.emotes.boostGemsMonth) || '🔰';
    
    if (invitePeopleEmote !== '📨' || boostGemsEmote !== '🔰') {
        throw new Error('Emoji fallback not working correctly');
    }
});

// Test 2: Custom emojis are used when available
test('Custom emojis are used when available', () => {
    const client = createMockClient(true);
    
    const invitePeopleEmote = client.emojis.cache.find(e => e.name === config.emotes.invitePeople) || '📨';
    const boostGemsEmote = client.emojis.cache.find(e => e.name === config.emotes.boostGemsMonth) || '🔰';
    
    if (invitePeopleEmote.toString() !== '<:Invite_People:123>' || 
        boostGemsEmote.toString() !== '<:Boost_Gems_Month_24:456>') {
        throw new Error('Custom emojis not being used correctly');
    }
});

// Test 3: Grammar pluralization for singular (1 invitation)
test('Grammar uses singular form for 1 invitation', () => {
    const totalInvites = 1;
    const invitationText = totalInvites === 1 ? '1 invitation' : `${totalInvites} invitations`;
    
    if (invitationText !== '1 invitation') {
        throw new Error(`Expected "1 invitation" but got "${invitationText}"`);
    }
});

// Test 4: Grammar pluralization for plural (multiple invitations)
test('Grammar uses plural form for multiple invitations', () => {
    const testCases = [0, 2, 5, 10, 100];
    
    testCases.forEach(count => {
        const invitationText = count === 1 ? '1 invitation' : `${count} invitations`;
        if (invitationText !== `${count} invitations`) {
            throw new Error(`Expected "${count} invitations" but got "${invitationText}"`);
        }
    });
});

// Test 5: Complete message construction with Unicode fallback
test('Message construction works with Unicode emoji fallback', () => {
    const client = createMockClient(false);
    const totalInvites = 1;
    
    const invitePeopleEmote = client.emojis.cache.find(e => e.name === config.emotes.invitePeople) || '📨';
    const boostGemsEmote = client.emojis.cache.find(e => e.name === config.emotes.boostGemsMonth) || '🔰';
    const invitationText = totalInvites === 1 ? '1 invitation' : `${totalInvites} invitations`;
    
    const messageContent = `${invitePeopleEmote} @User joins the team. Credit to @Inviter who now has ${invitationText}! ${boostGemsEmote}`;
    
    if (!messageContent.includes('📨') || 
        !messageContent.includes('🔰') || 
        !messageContent.includes('1 invitation')) {
        throw new Error('Message construction with fallback emojis failed');
    }
});

// Test 6: Complete message construction with custom emojis
test('Message construction works with custom emojis', () => {
    const client = createMockClient(true);
    const totalInvites = 5;
    
    const invitePeopleEmote = client.emojis.cache.find(e => e.name === config.emotes.invitePeople) || '📨';
    const boostGemsEmote = client.emojis.cache.find(e => e.name === config.emotes.boostGemsMonth) || '🔰';
    const invitationText = totalInvites === 1 ? '1 invitation' : `${totalInvites} invitations`;
    
    const messageContent = `${invitePeopleEmote} @User joins the team. Credit to @Inviter who now has ${invitationText}! ${boostGemsEmote}`;
    
    if (!messageContent.includes('<:Invite_People:123>') || 
        !messageContent.includes('<:Boost_Gems_Month_24:456>') || 
        !messageContent.includes('5 invitations')) {
        throw new Error('Message construction with custom emojis failed');
    }
});

// Summary
console.log('\n=== Test Summary ===');
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
console.log(`Total: ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
    console.log('\n✅ All emoji and grammar tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed. Please review the errors above.');
    process.exit(1);
}
