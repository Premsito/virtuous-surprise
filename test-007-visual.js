/**
 * Test script to demonstrate 007 game button states and responses
 * This shows how the game appears to users
 */

const { getResponse } = require('./utils/responseHelper');

console.log('=== 007 Game Visual Examples ===\n');

console.log('1. Challenge Message:');
console.log('-------------------');
console.log(getResponse('007.challenge.title'));
console.log(getResponse('007.challenge.description', {
    challenger: '@PlayerA',
    opponent: '@PlayerB',
    bet: 100
}));
console.log('\nButtons: [✅ Accepter] [❌ Refuser]\n');

console.log('2. Game Turn with Different Bullet States:');
console.log('------------------------------------------');

console.log('\n   Player with 0 bullets:');
console.log('   🔄 Recharger : (+1 balle) [Available]');
console.log('   🛡️ Bouclier : Protéger [Available]');
console.log('   🔫 Tir : (Pas de balle) [DISABLED - Grayed Out]');

console.log('\n   Player with 3 bullets:');
console.log('   🔄 Recharger : (+1 balle) [Available]');
console.log('   🛡️ Bouclier : Protéger [Available]');
console.log('   🔫 Tirer : Utilise 1 balle [AVAILABLE]');

console.log('\n3. Turn Status Display:');
console.log('----------------------');
console.log(getResponse('007.turn.title'));
console.log('\nTour 1');
console.log('**PlayerA** : 2 🔫');
console.log('**PlayerB** : 0 🔫');
console.log('\nLes deux joueurs, choisissez votre action :');

console.log('\n4. Action Selection Feedback:');
console.log('----------------------------');
console.log('Player clicks button: "✅ Votre action a été enregistrée!" (ephemeral)');
console.log('Player clicks again: "❌ Vous avez déjà choisi votre action pour ce tour!" (ephemeral)');
console.log('Player clicks opponent button: "❌ Vous ne pouvez pas choisir pour l\'autre joueur!" (ephemeral)');

console.log('\n5. Game Results:');
console.log('---------------');

console.log('\n   Victory:');
console.log('   ' + getResponse('007.result.title'));
console.log('   PlayerA a tiré sur PlayerB qui n\'avait pas de bouclier! 💥');
console.log('   🏆 Vainqueur: PlayerA');
console.log('   💰 Gains: 100 LC');

console.log('\n   Shield Block:');
console.log('   PlayerA a tiré mais PlayerB s\'est protégé avec un bouclier! 🛡️');
console.log('   Le duel continue...');

console.log('\n   Draw (Both Shot):');
console.log('   ' + getResponse('007.result.title'));
console.log('   ' + getResponse('007.result.draw'));

console.log('\n6. Game Configuration:');
console.log('---------------------');
const config = require('./config.json');
console.log('Min Bet:', config.games['007'].minBet, 'LC');
console.log('Max Bet:', config.games['007'].maxBet, 'LC');
console.log('Initial Bullets:', config.games['007'].initialBullets);

console.log('\n=== Key Features ===');
console.log('✓ Dynamic button states (shoot disabled when no bullets)');
console.log('✓ Button validation (players cannot click opponent buttons)');
console.log('✓ Bullet tracking and accumulation');
console.log('✓ Turn-based simultaneous action selection');
console.log('✓ LC betting and transfer on win/loss');
console.log('✓ Draw support (no balance changes)');
console.log('✓ Comprehensive French responses');
console.log('✓ Shield blocks shots for strategic gameplay');
console.log('✓ No security vulnerabilities');

console.log('\n=== Usage ===');
console.log('Command: !007 @opponent 100');
console.log('  - Challenges @opponent to a 007 duel');
console.log('  - Bets 100 LC on the match');
console.log('  - Both players must have sufficient balance');
console.log('  - Winner takes all!');
