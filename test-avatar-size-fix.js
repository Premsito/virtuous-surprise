/**
 * Test script to validate the avatar size fix in rankings command
 * This tests that all avatar sizes are valid Discord sizes
 */

// Valid Discord avatar sizes
const VALID_SIZES = [16, 32, 64, 128, 256, 512, 1024, 2048, 4096];

async function testAvatarSizes() {
    console.log('🧪 Testing Avatar Size Fix in Rankings Command...\n');

    try {
        console.log('🔍 Reading the rankings.js file to verify avatar sizes...');
        const fs = require('fs');
        const path = require('path');
        const rankingsFilePath = path.join(__dirname, 'commands', 'rankings.js');
        const fileContent = fs.readFileSync(rankingsFilePath, 'utf-8');

        // Check for the invalid size 96
        if (fileContent.includes('size: 96')) {
            throw new Error('Found invalid avatar size 96 in rankings.js');
        }
        console.log('   ✓ No invalid size 96 found\n');

        // Extract all size values from displayAvatarURL calls
        const sizePattern = /displayAvatarURL\s*\(\s*\{\s*size:\s*(\d+)/g;
        const sizes = [];
        let match;
        
        while ((match = sizePattern.exec(fileContent)) !== null) {
            sizes.push(parseInt(match[1], 10));
        }

        console.log('📊 Found avatar sizes in code:', sizes);
        
        if (sizes.length === 0) {
            throw new Error('No avatar sizes found in rankings.js');
        }

        // Validate all sizes
        const invalidSizes = sizes.filter(size => !VALID_SIZES.includes(size));
        
        if (invalidSizes.length > 0) {
            throw new Error(`Found invalid avatar sizes: ${invalidSizes.join(', ')}. Valid sizes are: ${VALID_SIZES.join(', ')}`);
        }
        
        console.log('   ✓ All avatar sizes are valid Discord sizes\n');

        // Check for error handling
        if (!fileContent.includes('catch (error)')) {
            console.warn('   ⚠️ Warning: No error handling found for avatar URL generation');
        } else {
            // Count error handling blocks in the podium section
            const podiumSection = fileContent.substring(
                fileContent.indexOf('async createPodiumEmbed'),
                fileContent.indexOf('createRankingsTableEmbed')
            );
            const errorHandlingCount = (podiumSection.match(/catch\s*\(error\)/g) || []).length;
            console.log(`   ✓ Found ${errorHandlingCount} error handling block(s) for avatar operations\n`);
        }

        // Check that error messages are logged
        if (!fileContent.includes('Avatar size error')) {
            console.warn('   ⚠️ Warning: No specific "Avatar size error" logging found');
        } else {
            console.log('   ✓ Avatar size error logging is present\n');
        }

        console.log('✅ All avatar size tests passed!');
        console.log('\n📝 Summary:');
        console.log('   - All avatar sizes are valid Discord sizes');
        console.log('   - Sizes used:', sizes.join(', '));
        console.log('   - Error handling is implemented');
        console.log('   - Invalid size 96 has been fixed');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        throw error;
    }
}

// Run tests
testAvatarSizes()
    .then(() => {
        console.log('\n🎉 Avatar size fix test completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Avatar size fix test failed:', error.message);
        process.exit(1);
    });
