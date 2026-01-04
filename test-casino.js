/**
 * Test script for casino commands
 * This tests that the casino module loads correctly and has the expected structure
 */

const config = require('./config.json');
const { getResponse } = require('./utils/responseHelper');

// Test 1: Load casino module
console.log('Test 1: Loading casino module...');
try {
    const casinoCommand = require('./commands/casino');
    console.log('✅ Casino module loaded successfully');
    console.log('   - Name:', casinoCommand.name);
    console.log('   - Has execute method:', typeof casinoCommand.execute === 'function');
    console.log('   - Has handleRoue method:', typeof casinoCommand.handleRoue === 'function');
    console.log('   - Has handleBlackjack method:', typeof casinoCommand.handleBlackjack === 'function');
    console.log('   - Has handleMachine method:', typeof casinoCommand.handleMachine === 'function');
} catch (error) {
    console.error('❌ Failed to load casino module:', error.message);
    process.exit(1);
}

// Test 2: Check config.json has all casino game configs
console.log('\nTest 2: Checking config.json...');
const requiredGames = ['roue', 'blackjack', 'machine'];
let configValid = true;

for (const game of requiredGames) {
    if (!config.games[game]) {
        console.error(`❌ Missing config for game: ${game}`);
        configValid = false;
    } else {
        console.log(`✅ Config found for ${game}:`, config.games[game]);
    }
}

if (!configValid) {
    console.error('❌ Config validation failed');
    process.exit(1);
}

// Test 3: Check responses.json has casino section
console.log('\nTest 3: Checking responses.json...');
try {
    const casinoMenuTitle = getResponse('casino.menu.title');
    const casinoMenuDesc = getResponse('casino.menu.description');
    console.log('✅ Casino menu responses found:');
    console.log('   - Title:', casinoMenuTitle);
    console.log('   - Description length:', casinoMenuDesc.length);
    
    // Check roue responses
    const roueInvalidBet = getResponse('casino.roue.invalidBet');
    console.log('✅ Roue responses found');
    
    // Check blackjack responses
    const bjInvalidBet = getResponse('casino.blackjack.invalidBet');
    console.log('✅ Blackjack responses found');
    
    // Check machine responses
    const machineInvalidBet = getResponse('casino.machine.invalidBet');
    console.log('✅ Machine responses found');
} catch (error) {
    console.error('❌ Failed to get casino responses:', error.message);
    process.exit(1);
}

// Test 4: Check help section includes casino
console.log('\nTest 4: Checking help section...');
try {
    const casinoHelpTitle = getResponse('help.sections.casino.title');
    const casinoHelpCommands = getResponse('help.sections.casino.commands');
    console.log('✅ Casino help section found:');
    console.log('   - Title:', casinoHelpTitle);
    console.log('   - Commands:', casinoHelpCommands.substring(0, 50) + '...');
} catch (error) {
    console.error('❌ Failed to get casino help:', error.message);
    process.exit(1);
}

console.log('\n✅ All tests passed!');
console.log('\nCasino commands available:');
console.log('  - !casino (menu)');
console.log('  - !roue [montant] [couleur]');
console.log('  - !bj [montant]');
console.log('  - !machine [montant]');
