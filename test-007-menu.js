/**
 * Test for 007 menu integration
 * This test validates that the 007 game option appears in the menu and responses are configured
 */

const { getResponse } = require('./utils/responseHelper');

console.log('=== Testing 007 Menu Integration ===\n');

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

// Test 1: Verify menu command loads
test('Menu command module loads without errors', () => {
    const menuCommand = require('./commands/menu');
    
    if (!menuCommand.name || menuCommand.name !== 'menu') {
        throw new Error('Menu command failed to load or has incorrect name');
    }
});

// Test 2: Verify 007 command loads
test('007 command module loads without errors', () => {
    const command007 = require('./commands/007');
    
    if (!command007.name || command007.name !== '007') {
        throw new Error('007 command failed to load or has incorrect name');
    }
});

// Test 3: Verify 007 menu responses exist
test('007 menu title response exists', () => {
    const title = getResponse('menu.submenu.jeux_1v1.007.title');
    
    if (!title || !title.includes('007')) {
        throw new Error('007 menu title response is missing or invalid');
    }
});

test('007 menu info response exists and contains rules', () => {
    const info = getResponse('menu.submenu.jeux_1v1.007.info');
    
    if (!info) {
        throw new Error('007 menu info response is missing');
    }
    
    // Check for key elements from the requirements
    if (!info.includes('Recharger') || !info.includes('Tirer') || !info.includes('Bouclier')) {
        throw new Error('007 menu info response is missing required action descriptions');
    }
    
    if (!info.includes('1 balle')) {
        throw new Error('007 menu info response is missing initial bullet count');
    }
    
    if (!info.includes('!007')) {
        throw new Error('007 menu info response is missing command syntax');
    }
});

// Test 4: Verify 007 game responses exist (from 007.js)
test('007 game responses are properly configured', () => {
    const noOpponent = getResponse('007.noOpponent');
    const selfChallenge = getResponse('007.selfChallenge');
    const invalidBet = getResponse('007.invalidBet', { minBet: 10, maxBet: 1000 });
    
    if (!noOpponent || !selfChallenge || !invalidBet) {
        throw new Error('One or more 007 game responses are missing');
    }
    
    if (!invalidBet.includes('10') || !invalidBet.includes('1000')) {
        throw new Error('007 invalidBet response placeholders not working');
    }
});

// Test 5: Verify config has 007 settings
test('Config contains 007 game settings', () => {
    const config = require('./config.json');
    
    if (!config.games || !config.games['007']) {
        throw new Error('Config is missing 007 game settings');
    }
    
    const game007Config = config.games['007'];
    if (!game007Config.minBet || !game007Config.maxBet) {
        throw new Error('007 game config is missing minBet or maxBet');
    }
});

// Print summary
console.log('\n=== Test Summary ===');
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);

if (testsFailed > 0) {
    console.log('\n❌ Some tests failed!');
    process.exit(1);
} else {
    console.log('\n✅ All tests passed!');
    console.log('\n🎉 007 menu integration is properly configured!');
}
