/**
 * Visual Preview of Detailed Level-Up Message Format
 * This script shows how the new level-up messages will appear in Discord
 */

const { getXPProgress } = require('./utils/xpHelper');
const { calculateLevelReward } = require('./utils/rewardHelper');

console.log('━'.repeat(70));
console.log('📊 DETAILED LEVEL-UP MESSAGE FORMAT - VISUAL PREVIEW');
console.log('━'.repeat(70));
console.log('');

// Example 1: Regular level (Level 2 - LC reward)
console.log('Example 1: Regular Level-Up (Level 2)');
console.log('─'.repeat(70));
const level2XP = 101; // Just reached level 2
const progress2 = getXPProgress(level2XP);
const reward2 = calculateLevelReward(2);

// Create progress bar
const progressBarLength = 20;
const filledBars2 = Math.floor((progress2.progress / 100) * progressBarLength);
const emptyBars2 = progressBarLength - filledBars2;
const progressBar2 = '█'.repeat(filledBars2) + '░'.repeat(emptyBars2);

console.log('');
console.log('┌────────────────────────────────────────────────────────────────┐');
console.log('│  🎉 Niveau supérieur atteint ! 🎊                             │');
console.log('│                                                                │');
console.log('│  Félicitations @Zayna ! 🎯                                     │');
console.log('│  Tu viens de passer Niveau 2 ! 🏆                              │');
console.log('│                                                                │');
console.log('│  🎁 Récompense débloquée                                       │');
console.log(`│  ${reward2.description.padEnd(60)} │`);
console.log('│                                                                │');
console.log('│  📊 Progression XP                                             │');
console.log(`│  ${progress2.currentLevelXP} / ${progress2.nextLevelXP} XP (${progress2.progress}%)`.padEnd(67) + '│');
console.log(`│  ${progressBar2.padEnd(62)} │`);
console.log('│                                                                │');
console.log('│  💡 Gagner de l\'XP ? Fais des !missions, participe à des jeux,│');
console.log('│  envoie des messages et surtout participe à des vocs!          │');
console.log('│                                                                │');
console.log('│  [Color: Blue (#5865F2)]                        [Timestamp]    │');
console.log('└────────────────────────────────────────────────────────────────┘');
console.log('');
console.log('');

// Example 2: Milestone level (Level 5 - Grand trésor)
console.log('Example 2: Milestone Level-Up (Level 5)');
console.log('─'.repeat(70));
const level5XP = 1001; // Just reached level 5
const progress5 = getXPProgress(level5XP);
const reward5 = calculateLevelReward(5);

const filledBars5 = Math.floor((progress5.progress / 100) * progressBarLength);
const emptyBars5 = progressBarLength - filledBars5;
const progressBar5 = '█'.repeat(filledBars5) + '░'.repeat(emptyBars5);

console.log('');
console.log('┌────────────────────────────────────────────────────────────────┐');
console.log('│  🎉 Niveau supérieur atteint ! 🎊                             │');
console.log('│                                                                │');
console.log('│  Félicitations @Zayna ! 🎯                                     │');
console.log('│  Tu viens de passer Niveau 5 ! 🏆                              │');
console.log('│                                                                │');
console.log('│  🎁 Récompense débloquée                                       │');
console.log(`│  ${reward5.description.padEnd(60)} │`);
console.log('│                                                                │');
console.log('│  📊 Progression XP                                             │');
console.log(`│  ${progress5.currentLevelXP} / ${progress5.nextLevelXP} XP (${progress5.progress}%)`.padEnd(67) + '│');
console.log(`│  ${progressBar5.padEnd(62)} │`);
console.log('│                                                                │');
console.log('│  💡 Gagner de l\'XP ? Fais des !missions, participe à des jeux,│');
console.log('│  envoie des messages et surtout participe à des vocs!          │');
console.log('│                                                                │');
console.log('│  [Color: Gold (#FFD700)]                        [Timestamp]    │');
console.log('└────────────────────────────────────────────────────────────────┘');
console.log('');
console.log('');

// Example 3: Epic milestone (Level 10 - with boost)
console.log('Example 3: Epic Milestone Level-Up (Level 10)');
console.log('─'.repeat(70));
const level10XP = 4501; // Just reached level 10
const progress10 = getXPProgress(level10XP);
const reward10 = calculateLevelReward(10);

const filledBars10 = Math.floor((progress10.progress / 100) * progressBarLength);
const emptyBars10 = progressBarLength - filledBars10;
const progressBar10 = '█'.repeat(filledBars10) + '░'.repeat(emptyBars10);

console.log('');
console.log('┌────────────────────────────────────────────────────────────────┐');
console.log('│  🎉 Niveau supérieur atteint ! 🎊                             │');
console.log('│                                                                │');
console.log('│  Félicitations @Zayna ! 🎯                                     │');
console.log('│  Tu viens de passer Niveau 10 ! 🏆                             │');
console.log('│                                                                │');
console.log('│  🎁 Récompense débloquée                                       │');
console.log(`│  ${reward10.description.padEnd(60)} │`);
console.log('│                                                                │');
console.log('│  📊 Progression XP                                             │');
console.log(`│  ${progress10.currentLevelXP} / ${progress10.nextLevelXP} XP (${progress10.progress}%)`.padEnd(67) + '│');
console.log(`│  ${progressBar10.padEnd(62)} │`);
console.log('│                                                                │');
console.log('│  💡 Gagner de l\'XP ? Fais des !missions, participe à des jeux,│');
console.log('│  envoie des messages et surtout participe à des vocs!          │');
console.log('│                                                                │');
console.log('│  [Color: Gold (#FFD700)]                        [Timestamp]    │');
console.log('└────────────────────────────────────────────────────────────────┘');
console.log('');
console.log('');

// Example 4: Mid-progress level
console.log('Example 4: Mid-Progress Level (Level 3, 50% to Level 4)');
console.log('─'.repeat(70));
const midProgressXP = 450; // 50% through level 3
const progressMid = getXPProgress(midProgressXP);
const rewardMid = calculateLevelReward(3);

const filledBarsMid = Math.floor((progressMid.progress / 100) * progressBarLength);
const emptyBarsMid = progressBarLength - filledBarsMid;
const progressBarMid = '█'.repeat(filledBarsMid) + '░'.repeat(emptyBarsMid);

console.log('');
console.log('┌────────────────────────────────────────────────────────────────┐');
console.log('│  🎉 Niveau supérieur atteint ! 🎊                             │');
console.log('│                                                                │');
console.log('│  Félicitations @Zayna ! 🎯                                     │');
console.log('│  Tu viens de passer Niveau 3 ! 🏆                              │');
console.log('│                                                                │');
console.log('│  🎁 Récompense débloquée                                       │');
console.log(`│  ${rewardMid.description.padEnd(60)} │`);
console.log('│                                                                │');
console.log('│  📊 Progression XP                                             │');
console.log(`│  ${progressMid.currentLevelXP} / ${progressMid.nextLevelXP} XP (${progressMid.progress}%)`.padEnd(67) + '│');
console.log(`│  ${progressBarMid.padEnd(62)} │`);
console.log('│                                                                │');
console.log('│  💡 Gagner de l\'XP ? Fais des !missions, participe à des jeux,│');
console.log('│  envoie des messages et surtout participe à des vocs!          │');
console.log('│                                                                │');
console.log('│  [Color: Blue (#5865F2)]                        [Timestamp]    │');
console.log('└────────────────────────────────────────────────────────────────┘');
console.log('');
console.log('');

console.log('━'.repeat(70));
console.log('✅ KEY FEATURES IMPLEMENTED:');
console.log('━'.repeat(70));
console.log('✓ User mention (@Zayna) for notification');
console.log('✓ Clear congratulations message with level number');
console.log('✓ Dedicated "Récompense débloquée" field showing reward details');
console.log('✓ Visual progress bar (█░) showing XP progression');
console.log('✓ Current XP / Next Level XP with percentage');
console.log('✓ Motivational tips in footer');
console.log('✓ Color coding: Blue for regular levels, Gold for milestones');
console.log('✓ Timestamp for when the level-up occurred');
console.log('✓ All messages sent only to #niveaux channel');
console.log('✓ Comprehensive logging for debugging');
console.log('');
console.log('━'.repeat(70));
console.log('📍 CHANNEL CONFIGURATION:');
console.log('━'.repeat(70));
console.log('Channel: #niveaux');
console.log('Channel ID: 1459283080576766044 (hardcoded)');
console.log('Messages will NOT appear in other channels (e.g., #jeux)');
console.log('');
console.log('━'.repeat(70));
