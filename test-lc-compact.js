/**
 * Test LC Compact Redesign
 * Validates the new compact format for the !lc command
 */

const { getResponse } = require('./utils/responseHelper');

console.log('Testing LC Compact Redesign\n');

// Test 1: Own balance display
console.log('Test 1: Own balance display');
const ownBalance = getResponse('lc.balance.description', { balance: 163 });
console.log('Expected: 💰 Votre Solde : **163 LC** 💵');
console.log('Actual:  ', ownBalance);
console.log('Match:   ', ownBalance === '💰 Votre Solde : **163 LC** 💵' ? '✓' : '✗');
console.log();

// Test 2: Other user balance display
console.log('Test 2: Other user balance display');
const otherBalance = getResponse('lc.balance.otherDescription', { username: 'TestUser', balance: 250 });
console.log('Expected: 💰 Solde de **TestUser** : **250 LC** 💵');
console.log('Actual:  ', otherBalance);
console.log('Match:   ', otherBalance === '💰 Solde de **TestUser** : **250 LC** 💵' ? '✓' : '✗');
console.log();

// Test 3: Check that both emojis are present
console.log('Test 3: Emojis validation');
console.log('Has 💰 emoji:', ownBalance.includes('💰') ? '✓' : '✗');
console.log('Has 💵 emoji:', ownBalance.includes('💵') ? '✓' : '✗');
console.log();

// Test 4: Check bold formatting for LC amount
console.log('Test 4: Bold formatting validation');
console.log('Balance is bold:', ownBalance.includes('**163 LC**') ? '✓' : '✗');
console.log();

// Test 5: Compact format (no newlines)
console.log('Test 5: Compact format validation');
console.log('No newlines in own balance:', !ownBalance.includes('\n') ? '✓' : '✗');
console.log();

// Visual Comparison
console.log('='.repeat(60));
console.log('VISUAL COMPARISON');
console.log('='.repeat(60));
console.log('\nBEFORE (old format):');
console.log('Title:       💰 Solde LC');
console.log('Description: 💰 **Votre Solde LC :** 163 LC');
console.log('Footer:      Utilisez !don pour transférer des LC');
console.log('Lines:       3 (title + description + footer)');

console.log('\nAFTER (new format):');
console.log('Description: ' + ownBalance);
console.log('Lines:       1 (description only)');

console.log('\n' + '='.repeat(60));
console.log('All tests completed!');
console.log('='.repeat(60));
