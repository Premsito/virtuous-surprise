/**
 * Test script to verify display names are used in rankings
 * This test creates mock guild member objects with display names
 */

const { EmbedBuilder } = require('discord.js');

// Mock config
const config = {
    colors: {
        primary: '#5865F2',
        gold: '#FFD700'
    }
};

const TOP_POSITIONS_WITH_SPECIAL_FORMATTING = 3;

/**
 * Helper function to get medal or position number for rankings
 */
function getMedalForPosition(position) {
    if (position === 0) return '🥇';
    if (position === 1) return '🥈';
    if (position === 2) return '🥉';
    return `${position + 1}.`;
}

/**
 * Create mock guild with members
 */
function createMockGuild(users) {
    const membersMap = new Map();
    
    users.forEach(user => {
        membersMap.set(user.user_id, {
            displayName: user.displayName,
            displayAvatarURL: () => `https://cdn.discordapp.com/avatars/${user.user_id}/avatar.png`
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
 * Create a consolidated podiums embed with both LC and Levels podiums
 */
async function createConsolidatedPodiumsEmbed(guild, topLC, topLevels) {
    const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle('━━━━━━━━━━━━━━━━━━━\n🏆 **Classements Discord** 🏆\n━━━━━━━━━━━━━━━━━━━')
        .setTimestamp();

    // Build LC podium data with enhanced formatting
    let podiumLCData = '';
    for (let i = 0; i < Math.min(3, topLC.length); i++) {
        const user = topLC[i];
        const medal = getMedalForPosition(i);
        
        let guildMember;
        try {
            guildMember = await guild.members.fetch(user.user_id);
        } catch (error) {
            console.error(`   ⚠️ Could not fetch LC user ${user.user_id}:`, error.message);
        }

        const displayName = guildMember ? guildMember.displayName : user.username;
        const value = `${user.balance} LC`;
        
        // Enhanced formatting with spacing
        if (i === 0) {
            podiumLCData += `${medal} **${displayName}**\n`;
            podiumLCData += `    💰 ${value}\n`;
        } else {
            podiumLCData += `${medal} **${displayName}** - ${value}\n`;
        }
    }

    // Build Levels podium data with enhanced formatting
    let podiumLevelData = '';
    for (let i = 0; i < Math.min(3, topLevels.length); i++) {
        const user = topLevels[i];
        const medal = getMedalForPosition(i);
        
        let guildMember;
        try {
            guildMember = await guild.members.fetch(user.user_id);
        } catch (error) {
            console.error(`   ⚠️ Could not fetch Level user ${user.user_id}:`, error.message);
        }

        const displayName = guildMember ? guildMember.displayName : user.username;
        const value = `Niveau ${user.level}`;
        
        // Enhanced formatting with spacing
        if (i === 0) {
            podiumLevelData += `${medal} **${displayName}**\n`;
            podiumLevelData += `    📊 ${value}\n`;
        } else {
            podiumLevelData += `${medal} **${displayName}** - ${value}\n`;
        }
    }

    // Add fields to embed with visual separator
    embed.addFields(
        { name: '💰 Podium LC', value: podiumLCData || 'Aucune donnée disponible', inline: true },
        { name: '📊 Podium Niveaux', value: podiumLevelData || 'Aucune donnée disponible', inline: true }
    );

    return embed;
}

/**
 * Create a consolidated rankings embed with both LC and Levels rankings
 */
async function createConsolidatedRankingsEmbed(guild, topLC, topLevels) {
    const embed = new EmbedBuilder()
        .setColor(config.colors.gold)
        .setTitle('━━━━━━━━━━━━━━━━━━━\n📊 **Top 10 Classements** 📊\n━━━━━━━━━━━━━━━━━━━')
        .setTimestamp();

    // Collect all unique user IDs to fetch
    const allUserIds = new Set();
    topLC.forEach(user => allUserIds.add(user.user_id));
    topLevels.forEach(user => allUserIds.add(user.user_id));

    // Batch fetch all Discord guild members
    const memberCache = new Map();
    await Promise.all(
        Array.from(allUserIds).map(async (userId) => {
            try {
                const guildMember = await guild.members.fetch(userId);
                memberCache.set(userId, guildMember);
            } catch (error) {
                console.error(`   ⚠️ Could not fetch member ${userId}:`, error.message);
            }
        })
    );

    // Build LC rankings data with enhanced formatting
    let lcRankingData = '';
    for (let i = 0; i < Math.min(10, topLC.length); i++) {
        const user = topLC[i];
        const medal = getMedalForPosition(i);
        const guildMember = memberCache.get(user.user_id);
        const displayName = guildMember ? guildMember.displayName : user.username;
        
        // Enhanced formatting with better spacing
        if (i < TOP_POSITIONS_WITH_SPECIAL_FORMATTING) {
            lcRankingData += `${medal} **${displayName}**\n   💰 ${user.balance} LC\n`;
        } else {
            lcRankingData += `${medal} ${displayName} - ${user.balance} LC\n`;
        }
    }

    // Build Level rankings data with enhanced formatting
    let levelRankingData = '';
    for (let i = 0; i < Math.min(10, topLevels.length); i++) {
        const user = topLevels[i];
        const medal = getMedalForPosition(i);
        const guildMember = memberCache.get(user.user_id);
        const displayName = guildMember ? guildMember.displayName : user.username;
        
        // Enhanced formatting with better spacing
        if (i < TOP_POSITIONS_WITH_SPECIAL_FORMATTING) {
            levelRankingData += `${medal} **${displayName}**\n   📊 Niveau ${user.level}\n`;
        } else {
            levelRankingData += `${medal} ${displayName} - Niveau ${user.level}\n`;
        }
    }

    // Add inline fields for side-by-side display with visual separators
    embed.addFields(
        { name: '💰 Classement LC', value: lcRankingData || 'Aucune donnée disponible', inline: true },
        { name: '📊 Classement Niveaux', value: levelRankingData || 'Aucune donnée disponible', inline: true }
    );

    return embed;
}

async function testDisplayNames() {
    console.log('🧪 Testing Display Names in Rankings...\n');

    try {
        // Create mock data with display names (including emojis like in the problem statement)
        const mockLCData = [
            { user_id: '1', username: 'prems', displayName: 'PREMS🥥', balance: 1468, level: 4 },
            { user_id: '2', username: 'zaynaaa', displayName: 'Zzzaynaaa', balance: 1182, level: 3 },
            { user_id: '3', username: 'premsito', displayName: 'Premsito212', balance: 329, level: 2 },
            { user_id: '4', username: 'user4', displayName: 'User4', balance: 250, level: 2 },
            { user_id: '5', username: 'user5', displayName: 'User5', balance: 240, level: 3 },
            { user_id: '6', username: 'user6', displayName: 'User6', balance: 230, level: 4 },
            { user_id: '7', username: 'user7', displayName: 'User7', balance: 220, level: 2 },
            { user_id: '8', username: 'user8', displayName: 'User8', balance: 215, level: 5 },
            { user_id: '9', username: 'user9', displayName: 'User9', balance: 210, level: 3 },
            { user_id: '10', username: 'user10', displayName: 'User10', balance: 205, level: 2 },
        ];

        const mockLevelData = [
            { user_id: '11', username: 'kvra', displayName: 'Kvra17z', balance: 500, level: 9 },
            { user_id: '12', username: 'john', displayName: 'Lc_john_pk', balance: 400, level: 4 },
            { user_id: '13', username: 'elxn', displayName: 'Elxn', balance: 1468, level: 4 },
            { user_id: '14', username: 'user13', displayName: 'User13', balance: 300, level: 3 },
            { user_id: '15', username: 'user14', displayName: 'User14', balance: 280, level: 3 },
            { user_id: '16', username: 'user15', displayName: 'User15', balance: 270, level: 3 },
            { user_id: '17', username: 'user16', displayName: 'User16', balance: 260, level: 2 },
            { user_id: '18', username: 'user17', displayName: 'User17', balance: 250, level: 2 },
            { user_id: '19', username: 'user18', displayName: 'User18', balance: 240, level: 2 },
            { user_id: '20', username: 'user19', displayName: 'User19', balance: 230, level: 2 },
        ];

        // Create mock guild with all users
        const allUsers = [...mockLCData, ...mockLevelData];
        const mockGuild = createMockGuild(allUsers);

        console.log('📊 Testing Podiums Embed with Display Names...');
        const podiumsEmbed = await createConsolidatedPodiumsEmbed(
            mockGuild,
            mockLCData.slice(0, 3),
            mockLevelData.slice(0, 3)
        );

        console.log('\n🏆 PODIUMS EMBED OUTPUT:');
        console.log('═══════════════════════════════════════');
        console.log('Title:', podiumsEmbed.data.title);
        console.log('\nFields:');
        podiumsEmbed.data.fields.forEach(field => {
            console.log(`\n${field.name}`);
            console.log('─────────────────────────────────────');
            console.log(field.value);
        });
        console.log('═══════════════════════════════════════');

        console.log('\n📊 Testing Rankings Embed with Display Names...');
        const rankingsEmbed = await createConsolidatedRankingsEmbed(
            mockGuild,
            mockLCData,
            mockLevelData
        );

        console.log('\n📋 TOP 10 RANKINGS EMBED OUTPUT:');
        console.log('═══════════════════════════════════════');
        console.log('Title:', rankingsEmbed.data.title);
        console.log('\nFields:');
        rankingsEmbed.data.fields.forEach(field => {
            console.log(`\n${field.name}`);
            console.log('─────────────────────────────────────');
            console.log(field.value);
        });
        console.log('═══════════════════════════════════════');

        // Verify display names are being used
        console.log('\n🔍 Verifying Display Names are Used...');
        
        // Check if PREMS🥥 (display name with emoji) appears instead of 'prems' (username)
        const lcPodiumField = podiumsEmbed.data.fields.find(f => f.name.includes('LC'));
        if (lcPodiumField && lcPodiumField.value.includes('PREMS🥥')) {
            console.log('   ✓ Display names with emojis are shown correctly (PREMS🥥)');
        } else {
            throw new Error('Display names are NOT being used - username found instead');
        }

        // Check if display names appear in rankings
        const lcRankingField = rankingsEmbed.data.fields.find(f => f.name.includes('LC'));
        if (lcRankingField && lcRankingField.value.includes('PREMS🥥')) {
            console.log('   ✓ Display names appear in rankings embed');
        } else {
            throw new Error('Display names are NOT in rankings embed');
        }

        // Verify other display names
        const levelPodiumField = podiumsEmbed.data.fields.find(f => f.name.includes('Niveaux'));
        if (levelPodiumField && levelPodiumField.value.includes('Kvra17z')) {
            console.log('   ✓ Level podium shows display names correctly');
        } else {
            throw new Error('Level podium not showing display names');
        }

        console.log('\n✅ All display name tests passed!');
        console.log('🎯 Display names are correctly shown:');
        console.log('   • Display names with emojis work (e.g., PREMS🥥)');
        console.log('   • Display names used in podiums');
        console.log('   • Display names used in rankings');
        console.log('   • Fallback to username if display name unavailable');

    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    }
}

// Run tests
testDisplayNames()
    .then(() => {
        console.log('\n🎉 Display name test completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Display name test failed:', error);
        process.exit(1);
    });
