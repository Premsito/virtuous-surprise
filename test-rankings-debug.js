/**
 * Test script for rankings debug features
 * This tests the debugging logs added for the !classement command
 */

const rankingsCommand = require('./commands/rankings');
const config = require('./config.json');

async function testRankingsDebug() {
    console.log('🧪 Testing Rankings Debug Features...\n');

    try {
        // Test 1: Verify channel ID in config
        console.log('📋 Test 1: Verifying channel ID in config...');
        
        if (!config.channels.rankings) {
            throw new Error('Rankings channel not configured in config.json');
        }
        
        const expectedChannelId = '1460012957458235618';
        if (config.channels.rankings !== expectedChannelId) {
            throw new Error(`Expected channel ID ${expectedChannelId}, got ${config.channels.rankings}`);
        }
        
        console.log(`   ✓ Rankings channel ID correctly set to: ${config.channels.rankings}`);

        // Test 2: Verify variable names are updated
        console.log('\n📋 Test 2: Verifying variable names in displayRankings...');
        
        const displayRankingsSource = rankingsCommand.displayRankings.toString();
        
        if (!displayRankingsSource.includes('lcRanking')) {
            throw new Error('Variable "lcRanking" not found in displayRankings method');
        }
        console.log('   ✓ Variable "lcRanking" is used');
        
        if (!displayRankingsSource.includes('levelRanking')) {
            throw new Error('Variable "levelRanking" not found in displayRankings method');
        }
        console.log('   ✓ Variable "levelRanking" is used');

        // Test 3: Verify debug logging statements exist
        console.log('\n📋 Test 3: Verifying debug logging statements...');
        
        const executeSource = rankingsCommand.execute.toString();
        
        if (!executeSource.includes('Using channel:')) {
            throw new Error('Channel debug log not found in execute method');
        }
        console.log('   ✓ Channel debug log exists in execute method');
        
        if (!executeSource.includes('Channel type:')) {
            throw new Error('Channel type log not found in execute method');
        }
        console.log('   ✓ Channel type log exists in execute method');
        
        if (!displayRankingsSource.includes('LC Rankings data (top 3)')) {
            throw new Error('LC Rankings data log not found in displayRankings method');
        }
        console.log('   ✓ LC Rankings data debug log exists');
        
        if (!displayRankingsSource.includes('Level Rankings data (top 3)')) {
            throw new Error('Level Rankings data log not found in displayRankings method');
        }
        console.log('   ✓ Level Rankings data debug log exists');

        // Test 4: Verify error message
        console.log('\n📋 Test 4: Verifying error notification message...');
        
        const expectedErrorMessage = 'Une erreur est survenue lors de l';
        if (!executeSource.includes(expectedErrorMessage)) {
            throw new Error('Error notification message not found or incorrect');
        }
        console.log(`   ✓ Error notification message is correct`);

        // Test 5: Verify updateRankingsChannel has cache fetch logging
        console.log('\n📋 Test 5: Verifying updateRankingsChannel debug logs...');
        
        const updateSource = rankingsCommand.updateRankingsChannel.toString();
        
        if (!updateSource.includes('client.channels.cache.get')) {
            throw new Error('Cache fetch debug not found in updateRankingsChannel');
        }
        console.log('   ✓ Cache fetch debug exists in updateRankingsChannel');
        
        if (!updateSource.includes('Fetched channel from cache:')) {
            throw new Error('Cache fetch log not found in updateRankingsChannel');
        }
        console.log('   ✓ Cache fetch logging exists');
        
        if (!updateSource.includes('Channel details:')) {
            throw new Error('Channel details log not found in updateRankingsChannel');
        }
        console.log('   ✓ Channel details logging exists');

        // Test 6: Verify podium rendering with variable PP sizes
        console.log('\n📋 Test 6: Verifying podium rendering configuration...');
        
        const createPodiumSource = rankingsCommand.createPodiumEmbed.toString();
        
        if (!createPodiumSource.includes('size: 128')) {
            throw new Error('128px avatar size not found for 1st place');
        }
        console.log('   ✓ 1st place uses 128px avatar');
        
        if (!createPodiumSource.includes('size: 96')) {
            throw new Error('96px avatar size not found for 2nd place');
        }
        console.log('   ✓ 2nd place uses 96px avatar');
        
        if (!createPodiumSource.includes('size: 64')) {
            throw new Error('64px avatar size not found for 3rd place');
        }
        console.log('   ✓ 3rd place uses 64px avatar');

        console.log('\n✅ All debug features tests passed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    }
}

// Run tests
testRankingsDebug()
    .then(() => {
        console.log('\n🎉 Rankings debug test completed successfully!');
        console.log('\n📝 Summary:');
        console.log('   ✅ Channel ID verified (1460012957458235618)');
        console.log('   ✅ Variable names updated to lcRanking/levelRanking');
        console.log('   ✅ Debug logging for channel and data fetch added');
        console.log('   ✅ Error notification message correct');
        console.log('   ✅ Podium rendering with variable PP sizes (128px, 96px, 64px)');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Rankings debug test failed:', error);
        process.exit(1);
    });
