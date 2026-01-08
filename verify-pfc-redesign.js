#!/usr/bin/env node
// Visual comparison script for PFC compact redesign

const { getResponse } = require('./utils/responseHelper');
const config = require('./config.json');

console.log('╔═══════════════════════════════════════════════════════════════════════╗');
console.log('║        BEFORE AND AFTER: PFC Compact Horizontal Redesign              ║');
console.log('╚═══════════════════════════════════════════════════════════════════════╝');
console.log();

// OLD FORMAT
console.log('┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ BEFORE: Old Format (Verbose, Spread Out)                           │');
console.log('└─────────────────────────────────────────────────────────────────────┘');
console.log();
console.log('Title: 🏆 Pierre-Feuille-Ciseaux - Résultat');
console.log('Thumbnail: Challenger Avatar (top right)');
console.log('Image: Opponent Avatar (bottom, large)');
console.log();
console.log('Description:');
console.log('🪨 **Pierre**                  🆚                  **Feuille** ✋');
console.log('@User1                                          @User2');
console.log();
console.log('💰 **Victoire de @User2 🎉**');
console.log('🏆 **Gains : +50 LC**');
console.log();
console.log('Total Lines: 5');
console.log('Height: Tall (due to large image at bottom)');
console.log();

// NEW FORMAT
console.log('┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ AFTER: New Compact Format (Horizontal, Minimal)                    │');
console.log('└─────────────────────────────────────────────────────────────────────┘');
console.log();
console.log(`Title: ${getResponse('pfc.result.titleVictory')}`);
console.log('Author: User1 [Avatar] (top left, small and round)');
console.log('Thumbnail: [Avatar] (top right, small and round)');
console.log('Footer: User2 [Avatar] (bottom, with name)');
console.log(`Color: ${config.colors.success} (Success Green)`);
console.log();
console.log('Description:');
const vsDisplay = getResponse('pfc.result.vsDisplay', {
    challengerChoice: '🪨',
    challengerChoiceName: 'Pierre',
    opponentChoice: '✋',
    opponentChoiceName: 'Feuille'
});
const victoryMessage = getResponse('pfc.result.victoryMessage', {
    winner: '@User2',
    winnings: 50
});
console.log(vsDisplay);
console.log(victoryMessage);
console.log();
console.log('Total Lines: 3');
console.log('Height: Compact (no large image, only small thumbnails)');
console.log();

// DRAW FORMAT
console.log('┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ DRAW RESULT (New Format)                                           │');
console.log('└─────────────────────────────────────────────────────────────────────┘');
console.log();
console.log(`Title: ${getResponse('pfc.result.titleDraw')}`);
console.log(`Color: ${config.colors.warning} (Warning Yellow)`);
console.log();
const vsDisplayDraw = getResponse('pfc.result.vsDisplay', {
    challengerChoice: '🪨',
    challengerChoiceName: 'Pierre',
    opponentChoice: '🪨',
    opponentChoiceName: 'Pierre'
});
const drawMessage = getResponse('pfc.result.drawMessage');
console.log('Description:');
console.log(vsDisplayDraw);
console.log();
console.log(drawMessage);
console.log();

// VISUAL STRUCTURE
console.log('┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ VISUAL STRUCTURE (Discord Embed Layout)                            │');
console.log('└─────────────────────────────────────────────────────────────────────┘');
console.log();
console.log('┌───────────────────────────────────────────────────────────────┐');
console.log('│ [Avatar] User1                    🏆 Résultat PFC   [Avatar] │ <- Author + Title + Thumbnail');
console.log('├───────────────────────────────────────────────────────────────┤');
console.log('│                                                               │');
console.log('│   🪨 **Pierre**      🆚      **Feuille** ✋                    │ <- VS Display');
console.log('│                                                               │');
console.log('│   🏆 **Victoire de @User2 🎉**                                │ <- Victory Message');
console.log('│   💰 **Gains : +50 LC**                                       │');
console.log('│                                                               │');
console.log('├───────────────────────────────────────────────────────────────┤');
console.log('│ [Avatar] User2                                                │ <- Footer with avatar');
console.log('└───────────────────────────────────────────────────────────────┘');
console.log();

// BENEFITS
console.log('┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ BENEFITS OF THE REDESIGN                                           │');
console.log('└─────────────────────────────────────────────────────────────────────┘');
console.log();
console.log('✅ Compact Horizontal Layout: All info aligned on single/minimal lines');
console.log('✅ Small Round Avatars: Both players shown via Author + Footer + Thumbnail');
console.log('✅ Reduced Spacing: VS display uses 6 spaces instead of 18');
console.log('✅ Shorter Title: "🏆 Résultat PFC" instead of long title');
console.log('✅ Reduced Height: No large image, only small rounded thumbnails');
console.log('✅ Better Alignment: Emojis and text horizontally aligned with VS symbol');
console.log('✅ Clear Winner Display: Victory message is compact and emoji-enhanced');
console.log('✅ Channel Clutter Reduced: Smaller embeds take less visual space');
console.log('✅ Consistent Design: Matches !lc and !cadeau compact redesign');
console.log('✅ Mobile Friendly: Compact format works better on mobile Discord');
console.log();
console.log('═══════════════════════════════════════════════════════════════════════');
