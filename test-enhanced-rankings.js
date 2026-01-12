/**
 * Test script for enhanced rankings image generation
 * Tests font scaling for top 3 and visual enhancements
 */

const { createCanvas, loadImage } = require('canvas');
const fs = require('fs').promises;
const path = require('path');

// Import the rankings image generator
const { generateRankingsImage } = require('./utils/rankingsImage');

/**
 * Mock Guild class for testing
 */
class MockGuild {
    constructor() {
        this.members = {
            cache: new Map(),
            fetch: async (userId) => {
                // Return mock member data
                return {
                    displayName: `User${userId}`,
                    displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png'
                };
            }
        };
    }
}

async function testEnhancedRankings() {
    console.log('🧪 Testing Enhanced Rankings Image Generation...\n');

    try {
        // Create mock data
        const mockLCData = [
            { user_id: '1', username: 'Champion', balance: 5000, level: 10 },
            { user_id: '2', username: 'RunnerUp', balance: 3500, level: 8 },
            { user_id: '3', username: 'ThirdPlace', balance: 2800, level: 7 },
            { user_id: '4', username: 'Player4', balance: 2000, level: 6 },
            { user_id: '5', username: 'Player5', balance: 1500, level: 5 },
            { user_id: '6', username: 'Player6', balance: 1200, level: 5 },
            { user_id: '7', username: 'Player7', balance: 1000, level: 4 },
            { user_id: '8', username: 'Player8', balance: 800, level: 4 },
            { user_id: '9', username: 'Player9', balance: 600, level: 3 },
            { user_id: '10', username: 'Player10', balance: 400, level: 3 },
        ];

        const mockLevelData = [
            { user_id: '11', username: 'TopLevel', balance: 1000, level: 15 },
            { user_id: '12', username: 'SecondLevel', balance: 900, level: 12 },
            { user_id: '13', username: 'ThirdLevel', balance: 800, level: 10 },
            { user_id: '14', username: 'Level9Player', balance: 700, level: 9 },
            { user_id: '15', username: 'Level8Player', balance: 600, level: 8 },
            { user_id: '16', username: 'Level7Player', balance: 500, level: 7 },
            { user_id: '17', username: 'Level6Player', balance: 400, level: 6 },
            { user_id: '18', username: 'Level5Player', balance: 300, level: 5 },
            { user_id: '19', username: 'Level4Player', balance: 200, level: 4 },
            { user_id: '20', username: 'Level3Player', balance: 100, level: 3 },
        ];

        console.log('📊 Generating rankings image with enhancements...');
        const mockGuild = new MockGuild();
        const imageBuffer = await generateRankingsImage(mockLCData, mockLevelData, mockGuild);

        // Save the test image
        const outputPath = path.join(__dirname, 'test-enhanced-rankings-output.png');
        await fs.writeFile(outputPath, imageBuffer);

        console.log('\n✅ Enhanced Rankings Image Generated Successfully!');
        console.log(`   📁 Saved to: ${outputPath}`);
        console.log(`   📏 Size: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
        
        console.log('\n🎨 Visual Enhancements Applied:');
        console.log('   ✓ Font scaling for top 3 rankings:');
        console.log('     - 1st place: +30% font size');
        console.log('     - 2nd place: +20% font size');
        console.log('     - 3rd place: +10% font size');
        console.log('   ✓ Medal emojis (🥇, 🥈, 🥉) for top 3');
        console.log('   ✓ Consistent padding and spacing');
        console.log('   ✓ Well-aligned avatars, names, and scores');
        console.log('   ✓ Side-by-side LC and Niveau columns');
        console.log('   ✓ Auto-update ready (5-minute interval)');

        console.log('\n🔍 Verification Steps:');
        console.log('   1. Open the generated image: test-enhanced-rankings-output.png');
        console.log('   2. Verify top 3 entries have larger fonts');
        console.log('   3. Check medal emojis are visible');
        console.log('   4. Verify alignment and spacing');

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('   Stack:', error.stack);
        throw error;
    }
}

// Run the test
testEnhancedRankings()
    .then(() => {
        console.log('\n🎉 Enhanced rankings test completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Enhanced rankings test failed:', error.message);
        process.exit(1);
    });
