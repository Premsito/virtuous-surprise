#!/usr/bin/env node
// Test script to verify PFC compact redesign

const { getResponse } = require('./utils/responseHelper');
const config = require('./config.json');

console.log('╔═══════════════════════════════════════════════════════════════════════╗');
console.log('║        PFC COMPACT HORIZONTAL REDESIGN - VERIFICATION                 ║');
console.log('╚═══════════════════════════════════════════════════════════════════════╝');
console.log();

// Test VS Display
console.log('┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ VS DISPLAY FORMAT (Compact Horizontal)                             │');
console.log('└─────────────────────────────────────────────────────────────────────┘');
console.log();

const vsDisplay = getResponse('pfc.result.vsDisplay', {
    challengerChoice: '🪨',
    challengerChoiceName: 'Pierre',
    opponentChoice: '✋',
    opponentChoiceName: 'Feuille'
});

console.log('VS Display:');
console.log(vsDisplay);
console.log();

// Test Victory Message
console.log('┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ VICTORY MESSAGE (Compact Format)                                    │');
console.log('└─────────────────────────────────────────────────────────────────────┘');
console.log();

const victoryMessage = getResponse('pfc.result.victoryMessage', {
    winner: '@User2',
    winnings: 50
});

console.log('Victory Message:');
console.log(victoryMessage);
console.log();

// Test Draw Message
console.log('┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ DRAW MESSAGE (Compact Format)                                       │');
console.log('└─────────────────────────────────────────────────────────────────────┘');
console.log();

const drawMessage = getResponse('pfc.result.drawMessage');
console.log('Draw Message:');
console.log(drawMessage);
console.log();

// Test Titles
console.log('┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ TITLES (Shortened)                                                  │');
console.log('└─────────────────────────────────────────────────────────────────────┘');
console.log();

const titleVictory = getResponse('pfc.result.titleVictory');
const titleDraw = getResponse('pfc.result.titleDraw');

console.log('Victory Title:', titleVictory);
console.log('Draw Title:', titleDraw);
console.log();

// Full Example
console.log('┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ FULL RESULT EXAMPLE (as it would appear in Discord)                │');
console.log('└─────────────────────────────────────────────────────────────────────┘');
console.log();
console.log('Embed Structure:');
console.log('─────────────────────────────────────────────────────────────────────');
console.log(`Author: User1 [Avatar]                           Thumbnail: [Avatar]`);
console.log(`Title: ${titleVictory}`);
console.log(`Color: ${config.colors.success} (Success Green)`);
console.log();
console.log('Description:');
console.log(vsDisplay);
console.log(victoryMessage);
console.log('─────────────────────────────────────────────────────────────────────');
console.log();

// Benefits
console.log('┌─────────────────────────────────────────────────────────────────────┐');
console.log('│ BENEFITS OF THE REDESIGN                                           │');
console.log('└─────────────────────────────────────────────────────────────────────┘');
console.log();
console.log('✅ Compact Horizontal Layout: All info on minimal lines');
console.log('✅ Dual Avatars: Author (left) and Thumbnail (right) show both players');
console.log('✅ Visual Alignment: Emojis and choices horizontally aligned with VS symbol');
console.log('✅ Reduced Height: Removed playersDisplay line, shorter titles');
console.log('✅ Clear Messaging: Victory/Draw messages are concise and emoji-enhanced');
console.log('✅ Consistent: Matches the compact redesign of !lc and !cadeau commands');
console.log();
console.log('═══════════════════════════════════════════════════════════════════════');
