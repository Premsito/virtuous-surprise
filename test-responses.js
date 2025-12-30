/**
 * Integration test for responses.json and command modules
 * This test validates that all commands load correctly and can access responses
 */

const { getResponse } = require('./utils/responseHelper');

console.log('=== Discord Bot Response Integration Test ===\n');

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

// Test 1: Verify all commands load
test('All command modules load without errors', () => {
    const lcCommand = require('./commands/lc');
    const invitesCommand = require('./commands/invites');
    const jeuCommand = require('./commands/jeu');
    const moderationCommand = require('./commands/moderation');
    const statsCommand = require('./commands/stats');
    
    if (!lcCommand.name || !invitesCommand.name || !jeuCommand.name || 
        !moderationCommand.name || !statsCommand.name) {
        throw new Error('One or more commands failed to load');
    }
});

// Test 2: LC responses
test('LC balance responses work', () => {
    const title = getResponse('lc.balance.title');
    const otherTitle = getResponse('lc.balance.otherTitle', { username: 'OtherUser' });
    const description = getResponse('lc.balance.description', { balance: 100 });
    
    if (!title.includes('LC') || !description.includes('100') || 
        !otherTitle.includes('OtherUser')) {
        throw new Error('LC balance response placeholders not working');
    }
});

// Test 3: Transfer responses
test('Transfer responses work with placeholders', () => {
    const success = getResponse('transfer.success.description', {
        sender: '@User1',
        amount: 50,
        recipient: '@User2',
        newBalance: 450
    });
    
    if (!success.includes('50') || !success.includes('450')) {
        throw new Error('Transfer response placeholders not working');
    }
});

// Test 4: Invite responses
test('Invite responses work', () => {
    const title = getResponse('invites.count.title');
    const description = getResponse('invites.count.description', { invites: 5 });
    
    if (!title.includes('invitations') || !description.includes('5')) {
        throw new Error('Invite response placeholders not working');
    }
});

// Test 5: Stats responses
test('Stats responses work', () => {
    const title = getResponse('stats.title', { username: 'TestUser' });
    const balance = getResponse('stats.balance', { balance: 250 });
    const voiceTime = getResponse('stats.voiceTime', { voiceTime: '2h 30m' });
    const joinDate = getResponse('stats.joinDate', { joinDate: '01/01/2024' });
    const ranking = getResponse('stats.ranking', { ranking: 5 });
    
    if (!title.includes('TestUser') || !balance.includes('250') || 
        !voiceTime.includes('2h 30m') || !joinDate.includes('01/01/2024') || 
        !ranking.includes('#5')) {
        throw new Error('Stats response placeholders not working');
    }
});

// Test 6: Game responses - Duel
test('Duel game responses work', () => {
    const challenge = getResponse('games.duel.challenge.description', {
        challenger: '@Player1',
        opponent: '@Player2',
        bet: 100
    });
    
    if (!challenge.includes('@Player1') || !challenge.includes('100')) {
        throw new Error('Duel response placeholders not working');
    }
});

// Test 7: Game responses - Roulette
test('Roulette game responses work', () => {
    const joined = getResponse('games.roulette.joined.description', {
        player: '@Player1',
        bet: 50,
        playerCount: 3,
        totalPot: 150
    });
    
    if (!joined.includes('50') || !joined.includes('150')) {
        throw new Error('Roulette response placeholders not working');
    }
});

// Test 8: Moderation responses
test('Moderation responses work', () => {
    const noPermission = getResponse('moderation.noPermission');
    const setlcSuccess = getResponse('moderation.setlc.success.description', {
        user: '@User1',
        amount: 1000
    });
    
    if (!noPermission.includes('administrateur') || !setlcSuccess.includes('1000')) {
        throw new Error('Moderation response placeholders not working');
    }
});

// Test 9: Help responses
test('Help responses work', () => {
    const title = getResponse('help.title');
    const lcCommands = getResponse('help.sections.lc.commands');
    const statsCommands = getResponse('help.sections.stats.commands');
    
    if (!title || !lcCommands.includes('!lc') || !statsCommands.includes('!stats')) {
        throw new Error('Help responses not working correctly');
    }
});

// Test 10: Error responses
test('Error responses work', () => {
    const commandError = getResponse('errors.commandExecutionError');
    
    if (!commandError.includes('erreur')) {
        throw new Error('Error responses not working');
    }
});

// Test 11: Config integration
test('Config values are integrated in responses', () => {
    const config = require('./config.json');
    const response = getResponse('lc.balance.footer');
    
    if (!response.includes(config.prefix)) {
        throw new Error('Config prefix not integrated in responses');
    }
});

// Test 12: All response paths exist
test('All critical response paths exist', () => {
    const criticalPaths = [
        'lc.balance.title',
        'lc.balance.otherTitle',
        'transfer.success.title',
        'invites.count.title',
        'invites.top.title',
        'stats.title',
        'stats.voiceTime',
        'stats.joinDate',
        'stats.ranking',
        'games.list.title',
        'games.duel.challenge.title',
        'games.roulette.joined.title',
        'moderation.setlc.success.title',
        'help.title',
        'errors.commandExecutionError'
    ];
    
    criticalPaths.forEach(path => {
        const response = getResponse(path);
        if (!response) {
            throw new Error(`Missing response path: ${path}`);
        }
    });
});

// Test 13: Stats formatVoiceTime helper works correctly
test('Stats formatVoiceTime helper works correctly', () => {
    const statsCommand = require('./commands/stats');
    
    // Test hours and minutes (7800 seconds = 2h 10m)
    const time1 = statsCommand.formatVoiceTime(7800);
    if (!time1.includes('2h') || !time1.includes('10m')) {
        throw new Error('Voice time formatting failed for hours and minutes');
    }
    
    // Test minutes only
    const time2 = statsCommand.formatVoiceTime(300); // 5m
    if (!time2.includes('5m') || time2.includes('h')) {
        throw new Error('Voice time formatting failed for minutes only');
    }
    
    // Test zero seconds
    const time3 = statsCommand.formatVoiceTime(0); // 0m
    if (time3 !== '0m') {
        throw new Error('Voice time formatting failed for zero seconds');
    }
});

// Summary
console.log('\n=== Test Summary ===');
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
console.log(`Total: ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
    console.log('\n✅ All tests passed! The bot is ready to use.');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed. Please review the errors above.');
    process.exit(1);
}
