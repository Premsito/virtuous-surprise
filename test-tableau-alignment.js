/**
 * Test script to visualize and test the classement tableau alignment
 */

const { generateRankingsImage } = require('./utils/rankingsImage');
const fs = require('fs');

// Mock guild object for testing
const mockGuild = {
    members: {
        async fetch(userId) {
            // Return null to simulate users without avatars
            // This will test the placeholder avatar functionality
            return null;
        }
    }
};

// Mock data with various username lengths to test alignment
const mockLCData = [
    { user_id: '1', username: 'ShortName', balance: 1468, level: 4 },
    { user_id: '2', username: 'MediumLengthUsername', balance: 1182, level: 3 },
    { user_id: '3', username: 'VeryLongUsernameToTestTruncation', balance: 950, level: 2 },
    { user_id: '4', username: 'User4', balance: 850, level: 2 },
    { user_id: '5', username: 'AnotherVeryLongUsernameThatShouldBeTruncated', balance: 740, level: 3 },
    { user_id: '6', username: 'User6', balance: 630, level: 4 },
    { user_id: '7', username: 'Short', balance: 520, level: 2 },
    { user_id: '8', username: 'ExtremelyLongUsernameForTestingPurposes', balance: 415, level: 5 },
    { user_id: '9', username: 'User9', balance: 310, level: 3 },
    { user_id: '10', username: 'LastUser', balance: 205, level: 2 },
];

const mockLevelData = [
    { user_id: '11', username: 'TopLevel', balance: 500, level: 25 },
    { user_id: '12', username: 'SecondPlace', balance: 400, level: 18 },
    { user_id: '1', username: 'ShortName', balance: 1468, level: 15 },
    { user_id: '13', username: 'User13', balance: 300, level: 12 },
    { user_id: '14', username: 'VeryLongNameForLevelRanking', balance: 280, level: 10 },
    { user_id: '15', username: 'User15', balance: 270, level: 9 },
    { user_id: '16', username: 'User16', balance: 260, level: 8 },
    { user_id: '17', username: 'AnotherLongUsername', balance: 250, level: 7 },
    { user_id: '18', username: 'User18', balance: 240, level: 6 },
    { user_id: '19', username: 'User19', balance: 230, level: 5 },
];

async function testTableauAlignment() {
    console.log('🧪 Testing Classement Tableau Alignment...\n');

    try {
        console.log('📊 Generating rankings image with test data...');
        const imageBuffer = await generateRankingsImage(
            mockLCData,
            mockLevelData,
            mockGuild
        );

        // Save the image for visual inspection
        const outputPath = '/tmp/test-classement-output.png';
        fs.writeFileSync(outputPath, imageBuffer);
        
        console.log(`✅ Image generated successfully!`);
        console.log(`   - Size: ${(imageBuffer.length / 1024).toFixed(2)} KB`);
        console.log(`   - Saved to: ${outputPath}`);
        
        console.log('\n📋 Test Data Summary:');
        console.log(`   - LC Rankings: ${mockLCData.length} users`);
        console.log(`   - Level Rankings: ${mockLevelData.length} users`);
        console.log(`   - Username variations: short, medium, and very long names`);
        
        console.log('\n✅ Tableau alignment test completed successfully!');
        console.log('📸 Please inspect the generated image at:', outputPath);

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack:', error.stack);
        throw error;
    }
}

// Run the test
testTableauAlignment()
    .then(() => {
        console.log('\n🎉 Test completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Test failed:', error);
        process.exit(1);
    });
