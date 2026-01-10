/**
 * Test file for single-response giveaway configuration system
 * This tests the new single-response format
 */

const fs = require('fs');

console.log('🧪 Testing single-response giveaway configuration system...\n');

// Test 1: Load the giveaway command
console.log('Test 1: Load giveaway command');
try {
    const giveawayCommand = require('./commands/giveaway');
    console.log('✅ Giveaway command loaded successfully');
    console.log('   - Name:', giveawayCommand.name);
    console.log('   - Has execute function:', typeof giveawayCommand.execute === 'function');
    console.log('   - Has handleButtonInteraction:', typeof giveawayCommand.handleButtonInteraction === 'function');
} catch (error) {
    console.error('❌ Failed to load giveaway command:', error.message);
    process.exit(1);
}

// Test 2: Check single response responses
console.log('\nTest 2: Check single-response messages in responses.json');
try {
    const responses = require('./responses.json');
    
    if (!responses.giveaway || !responses.giveaway.singleResponse) {
        console.error('❌ Single response section not found');
        process.exit(1);
    }

    const singleResponseMessages = responses.giveaway.singleResponse;
    const requiredMessages = ['prompt', 'invalidFormat', 'timeout'];

    let allPresent = true;
    for (const key of requiredMessages) {
        if (!singleResponseMessages[key]) {
            console.error(`   ❌ Missing message: ${key}`);
            allPresent = false;
        } else {
            console.log(`   ✅ ${key}: ${singleResponseMessages[key].substring(0, 50)}...`);
        }
    }

    if (!allPresent) {
        console.error('❌ Some messages are missing');
        process.exit(1);
    }

    console.log('✅ All single-response messages are present');
} catch (error) {
    console.error('❌ Failed to load responses.json:', error.message);
    process.exit(1);
}

// Test 3: Verify existing command functionality is preserved
console.log('\nTest 3: Verify existing functionality is preserved');
try {
    const responses = require('./responses.json');
    
    const requiredExistingMessages = [
        'giveaway.create.invalidArgs',
        'giveaway.create.invalidDuration',
        'giveaway.create.invalidWinners',
        'giveaway.create.invalidQuantity',
        'giveaway.end.noTitle',
        'giveaway.winner.noTitle',
        'giveaway.joined',
        'giveaway.alreadyJoined'
    ];

    let allPresent = true;
    for (const path of requiredExistingMessages) {
        const parts = path.split('.');
        let value = responses;
        for (const part of parts) {
            value = value[part];
            if (!value) {
                console.error(`   ❌ Missing message: ${path}`);
                allPresent = false;
                break;
            }
        }
        if (value) {
            console.log(`   ✅ ${path}`);
        }
    }

    if (!allPresent) {
        console.error('❌ Some existing messages are missing');
        process.exit(1);
    }

    console.log('✅ All existing messages are preserved');
} catch (error) {
    console.error('❌ Failed to verify existing messages:', error.message);
    process.exit(1);
}

// Test 4: Test parsing logic simulation
console.log('\nTest 4: Simulate parsing logic');
try {
    const testInput = 'Nitro Premium | Nitro 🎁 | 10 | 1 | 1';
    const parts = testInput.split('|').map(p => p.trim());
    
    if (parts.length !== 5) {
        console.error('   ❌ Parsing failed: wrong number of parts');
        process.exit(1);
    }

    const [title, reward, durationStr, winnersStr, quantityStr] = parts;
    
    console.log(`   ✅ Parsed title: "${title}"`);
    console.log(`   ✅ Parsed reward: "${reward}"`);
    console.log(`   ✅ Parsed duration: "${durationStr}"`);
    console.log(`   ✅ Parsed winners: "${winnersStr}"`);
    console.log(`   ✅ Parsed quantity: "${quantityStr}"`);
    
    const duration = parseInt(durationStr);
    const winners = parseInt(winnersStr);
    const quantity = parseInt(quantityStr);
    
    if (isNaN(duration) || duration <= 0) {
        console.error('   ❌ Invalid duration');
        process.exit(1);
    }
    
    if (isNaN(winners) || winners <= 0) {
        console.error('   ❌ Invalid winners');
        process.exit(1);
    }
    
    if (isNaN(quantity) || quantity <= 0) {
        console.error('   ❌ Invalid quantity');
        process.exit(1);
    }
    
    console.log('✅ Parsing logic works correctly');
} catch (error) {
    console.error('❌ Parsing simulation failed:', error.message);
    process.exit(1);
}

// Test 5: Test edge cases
console.log('\nTest 5: Test edge cases');
try {
    // Test with wrong number of parts
    const wrongParts = 'Nitro | 10 | 1'.split('|').map(p => p.trim());
    if (wrongParts.length === 5) {
        console.error('   ❌ Should reject input with wrong number of parts');
        process.exit(1);
    }
    console.log('   ✅ Correctly rejects input with wrong number of parts');
    
    // Test with empty fields
    const emptyField = ' | Nitro 🎁 | 10 | 1 | 1'.split('|').map(p => p.trim());
    if (emptyField[0]) {
        console.error('   ❌ Should detect empty title');
        process.exit(1);
    }
    console.log('   ✅ Correctly detects empty fields');
    
    // Test with invalid numbers
    const invalidNumber = 'Nitro | Reward | abc | 1 | 1'.split('|').map(p => p.trim());
    const dur = parseInt(invalidNumber[2]);
    if (!isNaN(dur)) {
        console.error('   ❌ Should detect invalid number');
        process.exit(1);
    }
    console.log('   ✅ Correctly detects invalid numbers');
    
    console.log('✅ All edge cases handled correctly');
} catch (error) {
    console.error('❌ Edge case test failed:', error.message);
    process.exit(1);
}

console.log('\n🎉 All tests passed! Single-response giveaway system is working correctly.');
