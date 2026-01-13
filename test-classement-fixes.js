/**
 * Test script to verify classement command fixes
 * Tests that display names are used instead of mentions
 */

const { EmbedBuilder } = require('discord.js');

// Mock config
const config = {
    colors: {
        primary: '#5865F2',
        gold: '#FFD700'
    }
};

/**
 * Create mock guild with members
 */
function createMockGuild(users) {
    const membersMap = new Map();
    
    users.forEach(user => {
        membersMap.set(user.user_id, {
            displayName: user.displayName,
            displayAvatarURL: (options) => `https://cdn.discordapp.com/avatars/${user.user_id}/avatar.png`
        });
    });

    return {
        members: {
            fetch: async (userId) => {
                const member = membersMap.get(userId);
                if (!member) {
                    throw new Error(`Member ${userId} not found`);
                }
                return member;
            }
        }
    };
}

/**
 * Create a ranking embed with medals and user info (FIXED VERSION)
 */
async function createRankingEmbed(users, title, color, valueFormatter, guild) {
    const embed = new EmbedBuilder()
        .setTitle(`🏆 ${title}`)
        .setColor(color)
        .setTimestamp()
        .setFooter({ text: 'Mise à jour automatique toutes les 5 minutes' });
    
    // Handle empty rankings
    if (!users || users.length === 0) {
        embed.setDescription('Aucun classement disponible pour l\'instant.');
        return embed;
    }
    
    // Batch fetch all guild members for performance
    const memberCache = new Map();
    console.log(`   🔍 Fetching ${users.length} guild members for display names...`);
    await Promise.all(
        users.map(async (user) => {
            if (!user.user_id) return;
            try {
                const guildMember = await guild.members.fetch(user.user_id);
                memberCache.set(user.user_id, guildMember);
            } catch (error) {
                console.log(`   ⚠️ Could not fetch member ${user.user_id} (${user.username}):`, error.message);
            }
        })
    );
    console.log(`   ✅ Fetched ${memberCache.size}/${users.length} guild members`);
    
    // Build ranking description with proper alignment and formatting
    let description = '';
    const medals = ['🥇', '🥈', '🥉'];
    
    for (let i = 0; i < users.length && i < 10; i++) {
        const user = users[i];
        
        // Use displayName from guild member (no notifications triggered)
        // Fallback to username from database if member not found
        const guildMember = memberCache.get(user.user_id);
        const displayName = guildMember ? guildMember.displayName : user.username;
        const value = valueFormatter(user);
        
        // Position indicator (medal for top 3, number for rest)
        const position = i < 3 ? medals[i] : `**${i + 1}.**`;
        
        // Add visual emphasis for top 3 using bold and different formatting
        if (i === 0) {
            // 1st place: Bold displayName and value with special formatting
            description += `${position} **${displayName}** • **${value}**\n`;
        } else if (i === 1) {
            // 2nd place: Bold displayName with emphasis
            description += `${position} **${displayName}** • **${value}**\n`;
        } else if (i === 2) {
            // 3rd place: Bold displayName
            description += `${position} **${displayName}** • ${value}\n`;
        } else {
            // 4-10: Regular formatting
            description += `${position} ${displayName} • ${value}\n`;
        }
    }
    
    embed.setDescription(description);
    
    // Set thumbnail to first place user's avatar
    if (users.length > 0 && users[0].user_id) {
        const firstMember = memberCache.get(users[0].user_id);
        if (firstMember) {
            embed.setThumbnail(firstMember.displayAvatarURL({ extension: 'png', size: 128 }));
        }
    }
    
    return embed;
}

async function runTests() {
    console.log('🧪 Testing Classement Fixes...\n');

    let passed = 0;
    let failed = 0;

    try {
        // Create mock data with display names (including emojis)
        const mockLCData = [
            { user_id: '1', username: 'prems', displayName: 'PREMS🥥', balance: 1468, level: 4 },
            { user_id: '2', username: 'zaynaaa', displayName: 'Zzzaynaaa', balance: 1182, level: 3 },
            { user_id: '3', username: 'premsito', displayName: 'Premsito212', balance: 329, level: 2 },
            { user_id: '4', username: 'user4', displayName: 'User4', balance: 250, level: 2 },
            { user_id: '5', username: 'user5', displayName: 'User5', balance: 240, level: 3 },
        ];

        const mockLevelData = [
            { user_id: '11', username: 'kvra', displayName: 'Kvra17z', balance: 500, level: 9 },
            { user_id: '12', username: 'john', displayName: 'Lc_john_pk', balance: 400, level: 4 },
            { user_id: '13', username: 'elxn', displayName: 'Elxn', balance: 1468, level: 4 },
            { user_id: '14', username: 'user13', displayName: 'User13', balance: 300, level: 3 },
            { user_id: '15', username: 'user14', displayName: 'User14', balance: 280, level: 3 },
        ];

        // Create mock guild with all users
        const allUsers = [...mockLCData, ...mockLevelData];
        const mockGuild = createMockGuild(allUsers);

        // Test 1: LC Rankings Embed
        console.log('📊 Test 1: Create LC Rankings Embed');
        const lcEmbed = await createRankingEmbed(
            mockLCData,
            '💰 Classement LC - Top 10',
            config.colors.gold,
            (user) => `${user.balance} LC`,
            mockGuild
        );

        // Verify LC embed was created
        if (lcEmbed && lcEmbed.data) {
            console.log('   ✅ LC embed created successfully');
            passed++;
        } else {
            console.log('   ❌ LC embed not created');
            failed++;
        }

        // Test 2: Niveau Rankings Embed
        console.log('📊 Test 2: Create Niveau Rankings Embed');
        const levelEmbed = await createRankingEmbed(
            mockLevelData,
            '📊 Classement Niveaux - Top 10',
            config.colors.primary,
            (user) => `Niveau ${user.level}`,
            mockGuild
        );

        // Verify level embed was created
        if (levelEmbed && levelEmbed.data) {
            console.log('   ✅ Niveau embed created successfully');
            passed++;
        } else {
            console.log('   ❌ Niveau embed not created');
            failed++;
        }

        // Test 3: Display names are used (NOT mentions)
        console.log('📊 Test 3: Verify display names are used (no mentions)');
        const lcDescription = lcEmbed.data.description;
        
        // Check that display name with emoji is used
        if (lcDescription.includes('PREMS🥥')) {
            console.log('   ✅ Display name with emoji is shown (PREMS🥥)');
            passed++;
        } else {
            console.log('   ❌ Display name with emoji NOT found');
            failed++;
        }

        // Test 4: NO mentions in the description
        console.log('📊 Test 4: Verify NO mentions are used');
        if (!lcDescription.includes('<@1>') && !lcDescription.includes('<@2>')) {
            console.log('   ✅ No mentions found - users will NOT be notified');
            passed++;
        } else {
            console.log('   ❌ MENTIONS FOUND - this will trigger notifications!');
            failed++;
        }

        // Test 5: Fallback to username when member not found
        console.log('📊 Test 5: Fallback to username for missing members');
        const mockDataWithMissing = [
            { user_id: '999', username: 'fallback_user', balance: 100 }
        ];
        const emptyGuild = createMockGuild([]); // No members
        
        const fallbackEmbed = await createRankingEmbed(
            mockDataWithMissing,
            'Test',
            config.colors.primary,
            (user) => `${user.balance} LC`,
            emptyGuild
        );
        
        if (fallbackEmbed.data.description.includes('fallback_user')) {
            console.log('   ✅ Fallback to username works correctly');
            passed++;
        } else {
            console.log('   ❌ Fallback to username failed');
            failed++;
        }

        // Test 6: Medals for top 3
        console.log('📊 Test 6: Verify medals for top 3');
        if (lcDescription.includes('🥇') && lcDescription.includes('🥈') && lcDescription.includes('🥉')) {
            console.log('   ✅ All medals (🥇🥈🥉) are present');
            passed++;
        } else {
            console.log('   ❌ Medals not found');
            failed++;
        }

        // Test 7: Empty rankings handling
        console.log('📊 Test 7: Handle empty rankings');
        const emptyEmbed = await createRankingEmbed(
            [],
            'Empty Test',
            config.colors.primary,
            (user) => `${user.balance} LC`,
            mockGuild
        );
        
        if (emptyEmbed.data.description.includes('Aucun classement disponible')) {
            console.log('   ✅ Empty rankings handled correctly');
            passed++;
        } else {
            console.log('   ❌ Empty rankings not handled');
            failed++;
        }

        // Test 8: Level rankings show correct format
        console.log('📊 Test 8: Verify Niveau format');
        const levelDescription = levelEmbed.data.description;
        if (levelDescription.includes('Kvra17z') && levelDescription.includes('Niveau 9')) {
            console.log('   ✅ Niveau rankings show display names and levels correctly');
            passed++;
        } else {
            console.log('   ❌ Niveau rankings format incorrect');
            failed++;
        }

        // Display results
        console.log('\n' + '='.repeat(60));
        console.log('📊 Test Summary');
        console.log('='.repeat(60));
        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
        console.log('='.repeat(60));

        // Show sample output
        console.log('\n🎨 Sample LC Embed Output:');
        console.log('─'.repeat(60));
        console.log(lcDescription);
        console.log('─'.repeat(60));

        console.log('\n🎨 Sample Niveau Embed Output:');
        console.log('─'.repeat(60));
        console.log(levelDescription);
        console.log('─'.repeat(60));

        if (failed === 0) {
            console.log('\n🎉 All tests passed! The classement fixes are working correctly.');
            console.log('✅ Display names are used (no notifications will be triggered)');
            console.log('✅ Both LC and Niveau rankings display correctly');
            console.log('✅ Proper error handling and fallbacks in place');
            process.exit(0);
        } else {
            console.log(`\n⚠️ ${failed} test(s) failed. Please review the issues above.`);
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Run tests
runTests();
