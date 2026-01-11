/**
 * Demo script showing the exact example from requirements
 * Creates a card matching the problem statement example:
 * - User: Premsito
 * - Level: 12
 * - XP: 1215 (out of 1200 needed for level 12)
 */

const { generateLevelUpCard } = require('./utils/levelUpCard');
const fs = require('fs');
const path = require('path');

async function generateDemoCard() {
    console.log('🎨 Generating demo card matching requirements example...\n');

    try {
        const card = await generateLevelUpCard({
            username: 'Premsito',
            avatarURL: 'https://cdn.discordapp.com/embed/avatars/0.png',
            level: 12,
            xp: 1215,
            reward: 'Trésor 🗝️'
        });
        
        const outputPath = path.join(__dirname, 'demo-level-up-card.png');
        fs.writeFileSync(outputPath, card.attachment);
        
        console.log('✅ Demo card generated successfully!');
        console.log(`📁 Saved to: ${outputPath}\n`);
        console.log('Card details:');
        console.log('  User: Premsito');
        console.log('  Level: 12');
        console.log('  XP: 1215 / 1200');
        console.log('  Reward: Trésor 🗝️');
        console.log('');
        console.log('This matches the requirements example with the following elements:');
        console.log('  ✅ 🎉 FÉLICITATIONS 🎉');
        console.log('  ✅ 👤 User: Premsito');
        console.log('  ✅ 🆙 Niveau: 12');
        console.log('  ✅ 📊 Progress bar with XP display');
        console.log('  ✅ 🎁 Cadeau gagné : Trésor 🗝️');
        console.log('  ✅ 💡 Les !missions permettent de gagner de l\'XP et des LC !');
        
    } catch (error) {
        console.error('❌ Failed to generate demo card:', error);
        process.exit(1);
    }
}

generateDemoCard();
