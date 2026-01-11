/**
 * Test and demo for level-up card generation
 * This creates a sample level-up card to verify the visual design
 */

const fs = require('fs');
const path = require('path');

// Mock Discord user object for testing
const mockUser = {
    username: 'Premsito',
    displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png'
};

async function testLevelUpCard() {
    try {
        console.log('🧪 Testing level-up card generation...\n');
        
        // Import the card generator
        const { generateLevelUpCard } = require('./utils/levelUpCard');
        
        // Test case 1: Level 12 with good progress
        console.log('📝 Test 1: Generating card for Level 12 (1215/1500 XP)...');
        const totalXP1 = 6600 + 1215; // Sum of XP for levels 1-11 (6600) + 1215 current
        const card1 = await generateLevelUpCard(mockUser, 12, totalXP1, 'Trésor 🗝️');
        
        const outputPath1 = path.join(__dirname, 'test-levelup-card-level12.png');
        fs.writeFileSync(outputPath1, card1);
        console.log(`✅ Card saved to: ${outputPath1}\n`);
        
        // Test case 2: Level 5 with partial progress
        console.log('📝 Test 2: Generating card for Level 5 (250/500 XP)...');
        const totalXP2 = 1000 + 250; // Sum of XP for levels 1-4 (1000) + 250 current
        const card2 = await generateLevelUpCard(mockUser, 5, totalXP2, 'Trésor 🗝️');
        
        const outputPath2 = path.join(__dirname, 'test-levelup-card-level5.png');
        fs.writeFileSync(outputPath2, card2);
        console.log(`✅ Card saved to: ${outputPath2}\n`);
        
        // Test case 3: Level 20 near level up
        console.log('📝 Test 3: Generating card for Level 20 (1900/2000 XP)...');
        const totalXP3 = 19000 + 1900; // Sum of XP for levels 1-19 + 1900 current
        const card3 = await generateLevelUpCard(mockUser, 20, totalXP3, 'Trésor 🗝️');
        
        const outputPath3 = path.join(__dirname, 'test-levelup-card-level20.png');
        fs.writeFileSync(outputPath3, card3);
        console.log(`✅ Card saved to: ${outputPath3}\n`);
        
        console.log('🎉 All test cards generated successfully!');
        console.log('\n📋 Summary:');
        console.log('   - 3 test cards created');
        console.log('   - Check the PNG files to verify the visual design');
        console.log('   - Cards should show: title, avatar, username, level, XP bar, reward, footer');
        
    } catch (error) {
        console.error('❌ Error testing level-up card:', error);
        process.exit(1);
    }
}

// Run the test
testLevelUpCard();
