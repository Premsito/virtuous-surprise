/**
 * Test script to verify mentions are being used in rankings
 */

const rankingsCommand = require('./commands/rankings');

async function testMentions() {
    console.log('🧪 Testing that Discord mentions are used in rankings...\n');

    try {
        const mockUsers = [
            { user_id: '123456789', username: 'GoldPlayer', balance: 1000, level: 10, xp: 5000 },
            { user_id: '987654321', username: 'SilverPlayer', balance: 900, level: 9, xp: 4500 },
            { user_id: '111222333', username: 'BronzePlayer', balance: 800, level: 8, xp: 4000 },
        ];
        
        // Mock guild with minimal members.fetch functionality
        const mockGuild = {
            members: {
                fetch: async (userId) => {
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
        
        console.log('📊 Embed Description:');
        console.log(embed.data.description);
        console.log('');
        
        // Verify mentions are present
        if (!embed.data.description.includes('<@123456789>')) {
            throw new Error('Mention format <@123456789> not found in description');
        }
        if (!embed.data.description.includes('<@987654321>')) {
            throw new Error('Mention format <@987654321> not found in description');
        }
        if (!embed.data.description.includes('<@111222333>')) {
            throw new Error('Mention format <@111222333> not found in description');
        }
        
        console.log('✅ All users are properly mentioned using <@userId> format!');
        console.log('✅ Test passed - Discord mentions are working correctly!');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run test
testMentions();
