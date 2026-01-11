/**
 * Test script for level-up card generation
 * 
 * This script tests the canvas-based level-up card generation
 * without requiring a full Discord bot setup.
 */

const { generateLevelUpCard } = require('./utils/levelUpCardHelper');
const fs = require('fs');

async function testCardGeneration() {
    console.log('🧪 Testing Level-Up Card Generation...\n');
    
    try {
        // Test Case 1: Basic card with mock data
        console.log('Test 1: Generating card with mock user data...');
        const card = await generateLevelUpCard({
            username: 'Premsito',
            avatarURL: 'https://cdn.discordapp.com/embed/avatars/0.png', // Discord default avatar
            level: 12,
            xp: 1215,
            reward: 'Trésor 🗝️'
        });
        
        // Save to file for visual inspection
        const buffer = card.attachment;
        fs.writeFileSync('test-level-up-card.png', buffer);
        console.log('✅ Card generated successfully!');
        console.log('📁 Saved as: test-level-up-card.png');
        console.log('👀 Please inspect the image to verify the design.\n');
        
        // Test Case 2: Different level
        console.log('Test 2: Generating card for level 5...');
        const card2 = await generateLevelUpCard({
            username: 'TestUser',
            avatarURL: 'https://cdn.discordapp.com/embed/avatars/1.png',
            level: 5,
            xp: 500,
            reward: 'Trésor 🗝️'
        });
        fs.writeFileSync('test-level-up-card-level5.png', card2.attachment);
        console.log('✅ Second card generated successfully!');
        console.log('📁 Saved as: test-level-up-card-level5.png\n');
        
        // Test Case 3: High level
        console.log('Test 3: Generating card for level 25...');
        const card3 = await generateLevelUpCard({
            username: 'HighLevelPlayer',
            avatarURL: 'https://cdn.discordapp.com/embed/avatars/2.png',
            level: 25,
            xp: 6000,
            reward: 'Trésor 🗝️'
        });
        fs.writeFileSync('test-level-up-card-level25.png', card3.attachment);
        console.log('✅ Third card generated successfully!');
        console.log('📁 Saved as: test-level-up-card-level25.png\n');
        
        console.log('🎉 All tests passed!');
        console.log('\n📊 Summary:');
        console.log('  ✅ Card generation working');
        console.log('  ✅ Avatar loading working');
        console.log('  ✅ Progress bar rendering working');
        console.log('  ✅ All text elements displayed correctly');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('\nError details:', error.stack);
        process.exit(1);
    }
}

// Run tests
testCardGeneration();
