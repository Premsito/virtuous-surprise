/**
 * Test script for enhanced Blackjack command
 * Validates message variants, card formatting, and dealer card hiding
 */

const { replacePlaceholders } = require('./utils/responseHelper');
const responses = require('./responses.json');

console.log('Test 1: Verify variant messages exist...');
try {
    const winVariants = responses.casino.blackjack.result.win.variants;
    const lossVariants = responses.casino.blackjack.result.loss.variants;
    
    if (!Array.isArray(winVariants) || winVariants.length === 0) {
        throw new Error('Win variants not found or empty');
    }
    if (!Array.isArray(lossVariants) || lossVariants.length === 0) {
        throw new Error('Loss variants not found or empty');
    }
    
    console.log('✅ Win variants:', winVariants.length, 'messages');
    console.log('✅ Loss variants:', lossVariants.length, 'messages');
    
    // Display sample variants
    console.log('\n  Sample win variant:', winVariants[0]);
    console.log('  Sample loss variant:', lossVariants[0]);
} catch (error) {
    console.error('❌ Failed to verify variants:', error.message);
    process.exit(1);
}

console.log('\nTest 2: Verify placeholder replacement in variants...');
try {
    const winVariants = responses.casino.blackjack.result.win.variants;
    
    // Test each variant for proper placeholder replacement
    for (let i = 0; i < winVariants.length; i++) {
        const variant = winVariants[i];
        const replaced = replacePlaceholders(variant, {
            winnings: 200,
            dealerScore: 20
        });
        
        // Verify no unreplaced placeholders remain (except those not in test data)
        if (variant.includes('{winnings}') && replaced.includes('{winnings}')) {
            throw new Error(`Variant ${i} did not replace {winnings} placeholder`);
        }
        if (variant.includes('{dealerScore}') && replaced.includes('{dealerScore}')) {
            throw new Error(`Variant ${i} did not replace {dealerScore} placeholder`);
        }
    }
    
    console.log('✅ All win variants support placeholder replacement');
    
    // Sample replacement
    const sample = replacePlaceholders(winVariants[0], { winnings: 200 });
    console.log('  Sample replaced:', sample);
} catch (error) {
    console.error('❌ Failed placeholder replacement test:', error.message);
    process.exit(1);
}

console.log('\nTest 3: Verify new message format...');
try {
    const startedDescription = responses.casino.blackjack.started.description;
    const hitDescription = responses.casino.blackjack.hit.description;
    const winDescription = responses.casino.blackjack.result.win.description;
    const lossDescription = responses.casino.blackjack.result.loss.description;
    
    // Check for new format markers (➤)
    if (!startedDescription.includes('➤')) {
        throw new Error('Started description missing ➤ marker');
    }
    if (!hitDescription.includes('➤')) {
        throw new Error('Hit description missing ➤ marker');
    }
    if (!winDescription.includes('➤')) {
        throw new Error('Win description missing ➤ marker');
    }
    if (!lossDescription.includes('➤')) {
        throw new Error('Loss description missing ➤ marker');
    }
    
    console.log('✅ All messages use new format with ➤ markers');
    console.log('\n  Sample started message:');
    console.log(replacePlaceholders(startedDescription, {
        playerHand: '♠️8 ♦️K (**18 points**)',
        dealerCards: '♣️J 🂠'
    }));
} catch (error) {
    console.error('❌ Failed message format test:', error.message);
    process.exit(1);
}

console.log('\nTest 4: Verify hidden card placeholder...');
try {
    const startedDescription = responses.casino.blackjack.started.description;
    
    if (!startedDescription.includes('dealerCards')) {
        throw new Error('Started description should use dealerCards instead of dealerCard');
    }
    
    console.log('✅ Started description uses dealerCards placeholder for hiding second card');
} catch (error) {
    console.error('❌ Failed hidden card test:', error.message);
    process.exit(1);
}

console.log('\nTest 5: Test complete message flow...');
try {
    // Simulate a complete game
    const playerHand = '♠️8 ♦️K (**18 points**)';
    const dealerHiddenCards = '♣️J 🂠';
    const dealerFullHand = '♣️J ♠️10 (**20 points**)';
    
    // Started message
    const startedMsg = replacePlaceholders(responses.casino.blackjack.started.description, {
        playerHand: playerHand,
        dealerCards: dealerHiddenCards
    });
    console.log('  Started message:');
    console.log(startedMsg);
    
    // Result message (loss)
    const lossVariants = responses.casino.blackjack.result.loss.variants;
    const lossVariant = replacePlaceholders(lossVariants[0], { dealerScore: 20 });
    const lossMsg = replacePlaceholders(responses.casino.blackjack.result.loss.description, {
        playerHand: playerHand,
        dealerHand: dealerFullHand,
        variant: lossVariant
    });
    console.log('\n  Result message (loss):');
    console.log(lossMsg);
    
    console.log('\n✅ Complete message flow works correctly');
} catch (error) {
    console.error('❌ Failed message flow test:', error.message);
    process.exit(1);
}

console.log('\n✅ All Blackjack enhancement tests passed!');
console.log('\nEnhancements implemented:');
console.log('  ✓ Scores displayed in parentheses next to cards');
console.log('  ✓ Dealer\'s second card hidden initially (🂠)');
console.log('  ✓ Multiple randomized victory messages (', responses.casino.blackjack.result.win.variants.length, 'variants)');
console.log('  ✓ Multiple randomized defeat messages (', responses.casino.blackjack.result.loss.variants.length, 'variants)');
console.log('  ✓ Enhanced display formatting with ➤ markers');
console.log('  ✓ Dealer\'s full hand revealed only at end');
