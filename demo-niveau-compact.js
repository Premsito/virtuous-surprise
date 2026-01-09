/**
 * Visual demonstration of the compact niveau command format
 * This script shows examples of different progress states
 */

const { getXPProgress } = require('./utils/xpHelper');

console.log('=== Compact Niveau Command Visual Examples ===\n');

// Helper function to create progress bar
function createProgressBar(progress) {
    const progressBarLength = 10;
    const filledLength = Math.floor((progress / 100) * progressBarLength);
    const emptyLength = progressBarLength - filledLength;
    return '█'.repeat(filledLength) + '░'.repeat(emptyLength);
}

// Helper function to format niveau description
function formatNiveauDescription(xp, username = 'User') {
    const progress = getXPProgress(xp);
    const progressBar = createProgressBar(progress.progress);
    const description = `🏆 Niveau : ${progress.level} | 🌟 Progression : [${progressBar}] ${progress.progress}% (${progress.currentLevelXP}/${progress.nextLevelXP} XP)`;
    
    return {
        title: `📊 Niveau de ${username}`,
        description,
        footer: `${progress.nextLevelXP - progress.currentLevelXP} XP pour le niveau ${progress.level + 1}`
    };
}

// Display examples at different XP levels
const examples = [
    { xp: 0, label: 'New user (0 XP)' },
    { xp: 6, label: 'Early progress (6 XP) - Example from requirements' },
    { xp: 50, label: 'Halfway to level 2 (50 XP)' },
    { xp: 99, label: 'Almost level 2 (99 XP)' },
    { xp: 100, label: 'Just reached level 2 (100 XP)' },
    { xp: 150, label: 'Level 2 progress (150 XP)' },
    { xp: 300, label: 'Level 3 start (300 XP)' },
    { xp: 450, label: 'Level 3 halfway (450 XP)' },
    { xp: 1000, label: 'Higher level example (1000 XP)' }
];

examples.forEach(example => {
    const embed = formatNiveauDescription(example.xp);
    console.log(`\n${example.label}:`);
    console.log(`  ${embed.title}`);
    console.log(`  ${embed.description}`);
    console.log(`  Footer: ${embed.footer}`);
    console.log('  ' + '-'.repeat(80));
});

console.log('\n=== Comparison: Old vs New Format ===\n');

console.log('OLD FORMAT (20-char bar, multi-field):');
console.log('  Fields:');
console.log('    🎯 Niveau: 1 | ⭐ XP Total: 6');
console.log('    📈 Progression: `████░░░░░░░░░░░░░░░░` 6%');
console.log('                    6 / 100 XP');

console.log('\nNEW FORMAT (10-char bar, single line):');
console.log('  Description:');
console.log('    🏆 Niveau : 1 | 🌟 Progression : [░░░░░░░░░░] 6% (6/100 XP)');

console.log('\n=== Benefits ===');
console.log('  ✓ Compact and streamlined (single line vs 3 fields)');
console.log('  ✓ Visual progress bar with 10 sections (each █ = 10%)');
console.log('  ✓ Cleaner appearance in Discord embeds');
console.log('  ✓ All essential information preserved');
console.log('  ✓ Easier to read at a glance');
