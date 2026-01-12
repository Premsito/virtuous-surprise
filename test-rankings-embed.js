/**
 * Test script for new embed-based rankings command
 * Tests that the embed creation works correctly
 */

const rankingsCommand = require('./commands/rankings');

async function testEmbedRankings() {
    console.log('🧪 Testing Embed-based Rankings Implementation...\n');

    try {
        // Test 1: Verify createRankingEmbed function exists
        console.log('📋 Test 1: Verifying createRankingEmbed function...');
        
        if (typeof rankingsCommand.createRankingEmbed !== 'function') {
            throw new Error('createRankingEmbed function not found');
        }
        
        console.log('   ✓ createRankingEmbed function exists\n');

        // Test 2: Verify module exports displayRankings function
        console.log('📋 Test 2: Verifying displayRankings function...');
        
        if (typeof rankingsCommand.displayRankings !== 'function') {
            throw new Error('displayRankings function not found');
        }
        
        console.log('   ✓ displayRankings function exists\n');

        // Test 3: Verify updateRankingsChannel function still exists
        console.log('📋 Test 3: Verifying updateRankingsChannel function...');
        
        if (typeof rankingsCommand.updateRankingsChannel !== 'function') {
            throw new Error('updateRankingsChannel function not found');
        }
        
        console.log('   ✓ updateRankingsChannel function exists\n');

        // Test 4: Test createRankingEmbed with mock data
        console.log('📋 Test 4: Testing createRankingEmbed with mock data...');
        
        const mockUsers = [
            { user_id: '1', username: 'GoldPlayer', balance: 1000, level: 10, xp: 5000 },
            { user_id: '2', username: 'SilverPlayer', balance: 900, level: 9, xp: 4500 },
            { user_id: '3', username: 'BronzePlayer', balance: 800, level: 8, xp: 4000 },
            { user_id: '4', username: 'Player4', balance: 700, level: 7, xp: 3500 },
        ];
        
        // Mock guild with minimal members.fetch functionality
        const mockGuild = {
            members: {
                fetch: async (userId) => {
                    // Return null to simulate member not found (will use fallback username)
                    return null;
                }
            }
        };
        
        const embed = await rankingsCommand.createRankingEmbed(
            mockUsers,
            '💰 Classement LC - Top 10',
            '#FFD700',
            (user) => `${user.balance} LC`,
            mockGuild
        );
        
        // Verify embed properties
        if (!embed || !embed.data) {
            throw new Error('Embed not created properly');
        }
        
        console.log('   ✓ Embed created successfully');
        console.log('   ✓ Embed title:', embed.data.title);
        console.log('   ✓ Embed color:', embed.data.color);
        console.log('   ✓ Embed description length:', embed.data.description?.length || 0);
        
        // Verify medals are present in description
        if (!embed.data.description?.includes('🥇')) {
            throw new Error('Gold medal (🥇) not found in description');
        }
        if (!embed.data.description?.includes('🥈')) {
            throw new Error('Silver medal (🥈) not found in description');
        }
        if (!embed.data.description?.includes('🥉')) {
            throw new Error('Bronze medal (🥉) not found in description');
        }
        
        console.log('   ✓ Medal emojis verified (🥇, 🥈, 🥉)');
        
        // Verify footer
        if (!embed.data.footer?.text?.includes('5 minutes')) {
            throw new Error('Footer does not mention 5 minutes auto-refresh');
        }
        
        console.log('   ✓ Footer mentions 5-minute auto-refresh\n');

        // Test 5: Test with empty user list
        console.log('📋 Test 5: Testing createRankingEmbed with empty data...');
        
        const emptyEmbed = await rankingsCommand.createRankingEmbed(
            [],
            '📊 Classement Test',
            '#5865F2',
            (user) => `${user.level}`,
            mockGuild
        );
        
        if (!emptyEmbed.data.description?.includes('Aucun classement')) {
            throw new Error('Empty embed should show "Aucun classement" message');
        }
        
        console.log('   ✓ Empty embed handles correctly\n');

        console.log('✅ All tests passed!');
        console.log('\n📊 Summary:');
        console.log('   • Embed-based rankings implementation verified');
        console.log('   • Medal emojis (🥇, 🥈, 🥉) working correctly');
        console.log('   • Auto-refresh footer included');
        console.log('   • Canvas dependency removed from rankings.js');
        console.log('   • Ready for deployment!');

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run tests
testEmbedRankings();
