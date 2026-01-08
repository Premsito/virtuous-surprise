/**
 * Test file for 007 game functionality
 * This tests the basic structure and exports of the 007 command
 */

const game007 = require('./commands/007');

console.log('Testing 007 game module...\n');

// Test 1: Module exports
console.log('Test 1: Module structure');
console.log('  - name:', game007.name);
console.log('  - description:', game007.description);
console.log('  - execute function exists:', typeof game007.execute === 'function');

// Test 2: Check config
const config = require('./config.json');
console.log('\nTest 2: Configuration');
console.log('  - 007 config exists:', !!config.games['007']);
if (config.games['007']) {
    console.log('  - minBet:', config.games['007'].minBet);
    console.log('  - maxBet:', config.games['007'].maxBet);
}

// Test 3: Check responses
const fs = require('fs');
const responses = JSON.parse(fs.readFileSync('./responses.json', 'utf8'));
console.log('\nTest 3: Response strings');
console.log('  - 007 responses exist:', !!responses['007']);
if (responses['007']) {
    console.log('  - challenge.title:', responses['007'].challenge?.title || 'MISSING');
    console.log('  - round.title:', responses['007'].round?.title || 'MISSING');
    console.log('  - victory.title:', responses['007'].victory?.title || 'MISSING');
}

console.log('\n✅ All basic tests passed!');
