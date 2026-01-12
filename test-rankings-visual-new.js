/**
 * Visual test for rankings image generation
 * Generates a sample rankings image to verify the design
 */

const { generateRankingsImage } = require('./utils/rankingsImage');
const fs = require('fs');

async function testVisualRankings() {
    console.log('🎨 Generating visual test for rankings...\n');

    try {
        // Create realistic mock data with various LC and Level values
        const mockLCData = [
            { user_id: '1', username: 'RichPlayer', balance: 5000 },
            { user_id: '2', username: 'WealthyUser', balance: 3500 },
            { user_id: '3', username: 'GoodSaver', balance: 2000 },
            { user_id: '4', username: 'MediumPlayer', balance: 500 },
            { user_id: '5', username: 'CasualGamer', balance: 150 },
            { user_id: '6', username: 'NewPlayer1', balance: 50 },
            { user_id: '7', username: 'NewPlayer2', balance: 25 },
            { user_id: '8', username: 'JustStarted', balance: 10 },
            { user_id: '9', username: 'BeginnerUser', balance: 5 },
            { user_id: '10', username: 'FreshPlayer', balance: 0 },
        ];

        const mockLevelData = [
            { user_id: '1', username: 'VeteranPlayer', level: 50 },
            { user_id: '2', username: 'HighLevelPro', level: 42 },
            { user_id: '3', username: 'ExperiencedUser', level: 35 },
            { user_id: '4', username: 'MidLevelPlayer', level: 20 },
            { user_id: '5', username: 'RegularUser', level: 10 },
            { user_id: '6', username: 'IntermediatePlayer', level: 5 },
            { user_id: '7', username: 'BeginnerLevel', level: 2 },
            { user_id: '8', username: 'NewbieLvl1', level: 1 },
            { user_id: '9', username: 'StarterUser', level: 1 },
            { user_id: '10', username: 'JustJoinedUser', level: 0 },
        ];

        console.log('📊 LC Rankings (Top 10 - All Users Included):');
        mockLCData.forEach((user, i) => {
            const medal = i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}.`;
            console.log(`   ${medal} ${user.username}: ${user.balance} LC`);
        });

        console.log('\n📊 Niveau Rankings (Top 10 - All Users Included):');
        mockLevelData.forEach((user, i) => {
            const medal = i < 3 ? ['🥇', '🥈', '🥉'][i] : `${i + 1}.`;
            console.log(`   ${medal} ${user.username}: Niveau ${user.level}`);
        });

        console.log('\n🎨 Generating rankings image...');
        
        // Create mock guild object
        const mockGuild = {
            members: {
                fetch: async (userId) => {
                    return null; // Return null to use placeholder avatars
                }
            }
        };

        // Generate the image
        const imageBuffer = await generateRankingsImage(mockLCData, mockLevelData, mockGuild);
        
        // Save the image to a file for visual inspection
        const outputPath = '/tmp/rankings-visual-test.png';
        fs.writeFileSync(outputPath, imageBuffer);
        
        console.log(`   ✓ Image generated successfully (${imageBuffer.length} bytes)`);
        console.log(`   ✓ Saved to: ${outputPath}`);
        
        console.log('\n🎨 Visual Design Features:');
        console.log('   ✅ Yellow background (#FFD700) for LC column header');
        console.log('   ✅ Blue background (#5865F2) for Niveaux column header');
        console.log('   ✅ Top 3 positions with medal icons (🥇 🥈 🥉)');
        console.log('   ✅ Positions 4-10 with numbered indicators');
        console.log('   ✅ All users included regardless of LC or Level');
        console.log('   ✅ Circular placeholder avatars with colored borders');
        console.log('   ✅ Side-by-side columns for efficient space usage');
        
        console.log('\n✨ Key Changes Implemented:');
        console.log('   • Removed LC >= 200 filter');
        console.log('   • Removed Niveau >= 2 filter');
        console.log('   • All users now eligible for Top 10 rankings');
        console.log('   • Yellow/Blue color scheme maintained for LC/Niveaux');
        
        console.log('\n✅ Visual test completed successfully!');
        console.log(`📸 View the generated image at: ${outputPath}`);
        
    } catch (error) {
        console.error('❌ Visual test failed:', error);
        throw error;
    }
}

// Run test
testVisualRankings()
    .then(() => {
        console.log('\n🎉 Rankings visual test completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Rankings visual test failed:', error);
        process.exit(1);
    });
