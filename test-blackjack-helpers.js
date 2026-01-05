/**
 * Test helper functions for Blackjack
 */

// Simulate the helper functions
function formatCard(card) {
    return `${card.suit}${card.value}`;
}

function calculateScore(hand) {
    let score = 0;
    let aces = 0;
    
    for (const card of hand) {
        if (card.value === 'A') {
            aces++;
            score += 11;
        } else if (['J', 'Q', 'K'].includes(card.value)) {
            score += 10;
        } else {
            score += parseInt(card.value);
        }
    }
    
    // Adjust for aces
    while (score > 21 && aces > 0) {
        score -= 10;
        aces--;
    }
    
    return score;
}

function formatHand(hand, showScore = true) {
    const cards = hand.map(formatCard).join(' ');
    if (showScore) {
        const score = calculateScore(hand);
        return `${cards} (**${score} points**)`;
    }
    return cards;
}

function formatDealerCards(dealerHand, hideSecondCard = true) {
    if (hideSecondCard && dealerHand.length >= 2) {
        return `${formatCard(dealerHand[0])} 🂠`;
    }
    return formatHand(dealerHand, true);
}

// Test cases
console.log('Test 1: Format individual card...');
const card1 = { suit: '♠️', value: '8' };
const card2 = { suit: '♦️', value: 'K' };
console.log('  Card 1:', formatCard(card1));
console.log('  Card 2:', formatCard(card2));
console.log('✅ Individual card formatting works');

console.log('\nTest 2: Calculate score...');
const hand1 = [
    { suit: '♠️', value: '8' },
    { suit: '♦️', value: 'K' }
];
const score1 = calculateScore(hand1);
console.log('  Hand: 8 + K, Score:', score1);
if (score1 !== 18) throw new Error('Score calculation failed');
console.log('✅ Score calculation works');

console.log('\nTest 3: Format hand with score...');
const formattedHand = formatHand(hand1, true);
console.log('  Formatted:', formattedHand);
if (!formattedHand.includes('**18 points**')) {
    throw new Error('Hand formatting with score failed');
}
console.log('✅ Hand formatting with score works');

console.log('\nTest 4: Format dealer cards (hidden)...');
const dealerHand = [
    { suit: '♣️', value: 'J' },
    { suit: '♠️', value: '10' }
];
const hiddenCards = formatDealerCards(dealerHand, true);
console.log('  Hidden format:', hiddenCards);
if (!hiddenCards.includes('🂠')) {
    throw new Error('Hidden card not shown');
}
if (hiddenCards.includes('♠️10')) {
    throw new Error('Second card should be hidden');
}
console.log('✅ Dealer cards hiding works');

console.log('\nTest 5: Format dealer cards (revealed)...');
const revealedCards = formatDealerCards(dealerHand, false);
console.log('  Revealed format:', revealedCards);
if (revealedCards.includes('🂠')) {
    throw new Error('Hidden card should not be shown when revealed');
}
if (!revealedCards.includes('**20 points**')) {
    throw new Error('Score should be shown when revealed');
}
console.log('✅ Dealer cards reveal works');

console.log('\nTest 6: Ace handling...');
const aceHand1 = [
    { suit: '♠️', value: 'A' },
    { suit: '♦️', value: '9' }
];
const aceScore1 = calculateScore(aceHand1);
console.log('  Hand: A + 9, Score:', aceScore1);
if (aceScore1 !== 20) throw new Error('Ace calculation failed (A should be 11)');

const aceHand2 = [
    { suit: '♠️', value: 'A' },
    { suit: '♦️', value: 'K' },
    { suit: '♣️', value: '5' }
];
const aceScore2 = calculateScore(aceHand2);
console.log('  Hand: A + K + 5, Score:', aceScore2);
if (aceScore2 !== 16) throw new Error('Ace calculation failed (A should be 1)');
console.log('✅ Ace handling works correctly');

console.log('\n✅ All helper function tests passed!');
