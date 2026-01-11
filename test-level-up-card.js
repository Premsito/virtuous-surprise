/**
 * Test script for level-up card generation
 * 
 * This script tests the level-up card generator without requiring a Discord bot connection.
 */

const { generateLevelUpCard } = require('./utils/levelUpCard');
const fs = require('fs');
const path = require('path');

async function testCardGeneration() {
    console.log('🧪 Testing Level-Up Card Generation...\n');

    try {
        // Test case 1: Low level user
        console.log('Test 1: Generating card for low-level user...');
        const card1 = await generateLevelUpCard({
            username: 'Premsito',
            avatarURL: 'https://cdn.discordapp.com/embed/avatars/0.png', // Default Discord avatar
            level: 12,
            xp: 1215,
            reward: 'Trésor 🗝️'
        });
        
        // Save to file for visual inspection
        const outputPath1 = path.join(__dirname, 'test-level-up-card-1.png');
        fs.writeFileSync(outputPath1, card1.attachment);
        console.log('✅ Card 1 generated successfully!');
        console.log(`   Saved to: ${outputPath1}\n`);

        // Test case 2: Mid level user
        console.log('Test 2: Generating card for mid-level user...');
        const card2 = await generateLevelUpCard({
            username: 'TestUser',
            avatarURL: 'https://cdn.discordapp.com/embed/avatars/1.png',
            level: 25,
            xp: 3800,
            reward: 'Trésor 🗝️'
        });
        
        const outputPath2 = path.join(__dirname, 'test-level-up-card-2.png');
        fs.writeFileSync(outputPath2, card2.attachment);
        console.log('✅ Card 2 generated successfully!');
        console.log(`   Saved to: ${outputPath2}\n`);

        // Test case 3: High level user
        console.log('Test 3: Generating card for high-level user...');
        const card3 = await generateLevelUpCard({
            username: 'ProPlayer',
            avatarURL: 'https://cdn.discordapp.com/embed/avatars/2.png',
            level: 50,
            xp: 12750,
            reward: 'Trésor 🗝️'
        });
        
        const outputPath3 = path.join(__dirname, 'test-level-up-card-3.png');
        fs.writeFileSync(outputPath3, card3.attachment);
        console.log('✅ Card 3 generated successfully!');
        console.log(`   Saved to: ${outputPath3}\n`);

        console.log('🎉 All card generation tests passed!');
        console.log('📁 Check the generated PNG files to verify visual quality.');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Run the test
testCardGeneration();
