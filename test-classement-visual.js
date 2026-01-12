/**
 * Test script for visual formatting of !classement command
 * This tests the enhanced visual aesthetics and formatting
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
 * Helper function to get medal or position number for rankings
 */
function getMedalForPosition(position) {
    if (position === 0) return '🥇';
    if (position === 1) return '🥈';
    if (position === 2) return '🥉';
    return `${position + 1}.`;
}

/**
 * Create a consolidated podiums embed (simplified without user fetching)
 */
function createConsolidatedPodiumsEmbed(topLC, topLevels) {
    const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle('═══════════════════════════════════════\n🏆 **Classements Discord** 🏆\n═══════════════════════════════════════')
        .setTimestamp();

    // Build LC podium data with enhanced formatting
    let podiumLCData = '';
    for (let i = 0; i < Math.min(3, topLC.length); i++) {
        const user = topLC[i];
        const medal = getMedalForPosition(i);
        const username = user.username;
        const value = `${user.balance} LC`;
        
        // Enhanced formatting with spacing
        if (i === 0) {
            podiumLCData += `${medal} **${username}**\n`;
            podiumLCData += `    💰 ${value}\n`;
        } else {
            podiumLCData += `${medal} **${username}** - ${value}\n`;
        }
    }

    // Build Levels podium data with enhanced formatting
    let podiumLevelData = '';
    for (let i = 0; i < Math.min(3, topLevels.length); i++) {
        const user = topLevels[i];
        const medal = getMedalForPosition(i);
        const username = user.username;
        const value = `Niveau ${user.level}`;
        
        // Enhanced formatting with spacing
        if (i === 0) {
            podiumLevelData += `${medal} **${username}**\n`;
            podiumLevelData += `    📊 ${value}\n`;
        } else {
            podiumLevelData += `${medal} **${username}** - ${value}\n`;
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
 * Create a consolidated rankings embed (simplified without user fetching)
 */
function createConsolidatedRankingsEmbed(topLC, topLevels) {
    const embed = new EmbedBuilder()
        .setColor(config.colors.gold)
        .setTitle('═══════════════════════════════════════\n📊 **Top 10 Classements** 📊\n═══════════════════════════════════════')
        .setTimestamp();

    // Build LC rankings data with enhanced formatting
    let lcRankingData = '';
    for (let i = 0; i < Math.min(10, topLC.length); i++) {
        const user = topLC[i];
        const medal = getMedalForPosition(i);
        const username = user.username;
        
        // Enhanced formatting with better spacing
        if (i < 3) {
            lcRankingData += `${medal} **${username}**\n   💰 ${user.balance} LC\n`;
        } else {
            lcRankingData += `${medal} ${username} - ${user.balance} LC\n`;
        }
    }

    // Build Level rankings data with enhanced formatting
    let levelRankingData = '';
    for (let i = 0; i < Math.min(10, topLevels.length); i++) {
        const user = topLevels[i];
        const medal = getMedalForPosition(i);
        const username = user.username;
        
        // Enhanced formatting with better spacing
        if (i < 3) {
            levelRankingData += `${medal} **${username}**\n   📊 Niveau ${user.level}\n`;
        } else {
            levelRankingData += `${medal} ${username} - Niveau ${user.level}\n`;
        }
    }

    // Add inline fields for side-by-side display with visual separators
    embed.addFields(
        { name: '💰 Classement LC', value: lcRankingData || 'Aucune donnée disponible', inline: true },
        { name: '📊 Classement Niveaux', value: levelRankingData || 'Aucune donnée disponible', inline: true }
    );

    return embed;
}

async function testVisualFormatting() {
    console.log('🧪 Testing Enhanced Visual Formatting for !classement Command...\n');

    try {
        // Create mock data with filtered users (>= 200 LC and >= 2 Niveau)
        const mockLCData = [
            { user_id: '1', username: 'Elxn', balance: 1468, level: 4 },
            { user_id: '2', username: 'Zzzaynaaa', balance: 1182, level: 3 },
            { user_id: '3', username: 'Premsito212', balance: 329, level: 2 },
            { user_id: '4', username: 'User4', balance: 250, level: 2 },
            { user_id: '5', username: 'User5', balance: 240, level: 3 },
            { user_id: '6', username: 'User6', balance: 230, level: 4 },
            { user_id: '7', username: 'User7', balance: 220, level: 2 },
            { user_id: '8', username: 'User8', balance: 215, level: 5 },
            { user_id: '9', username: 'User9', balance: 210, level: 3 },
            { user_id: '10', username: 'User10', balance: 205, level: 2 },
        ];

        const mockLevelData = [
            { user_id: '11', username: 'Kvra17z', balance: 500, level: 9 },
            { user_id: '12', username: 'Lc_john_pk', balance: 400, level: 4 },
            { user_id: '1', username: 'Elxn', balance: 1468, level: 4 },
            { user_id: '13', username: 'User13', balance: 300, level: 3 },
            { user_id: '14', username: 'User14', balance: 280, level: 3 },
            { user_id: '15', username: 'User15', balance: 270, level: 3 },
            { user_id: '16', username: 'User16', balance: 260, level: 2 },
            { user_id: '17', username: 'User17', balance: 250, level: 2 },
            { user_id: '18', username: 'User18', balance: 240, level: 2 },
            { user_id: '19', username: 'User19', balance: 230, level: 2 },
        ];

        console.log('📊 Testing Podiums Embed Formatting...');
        const podiumsEmbed = createConsolidatedPodiumsEmbed(
            mockLCData.slice(0, 3),
            mockLevelData.slice(0, 3)
        );

        console.log('\n🏆 PODIUMS EMBED OUTPUT:');
        console.log('═══════════════════════════════════════');
        console.log('Title:', podiumsEmbed.data.title);
        console.log('Color:', podiumsEmbed.data.color);
        console.log('\nFields:');
        podiumsEmbed.data.fields.forEach(field => {
            console.log(`\n${field.name} (inline: ${field.inline})`);
            console.log('─────────────────────────────────────');
            console.log(field.value);
        });
        console.log('═══════════════════════════════════════');

        console.log('\n📊 Testing Rankings Embed Formatting...');
        const rankingsEmbed = createConsolidatedRankingsEmbed(
            mockLCData,
            mockLevelData
        );

        console.log('\n📋 TOP 10 RANKINGS EMBED OUTPUT:');
        console.log('═══════════════════════════════════════');
        console.log('Title:', rankingsEmbed.data.title);
        console.log('Color:', rankingsEmbed.data.color);
        console.log('\nFields:');
        rankingsEmbed.data.fields.forEach(field => {
            console.log(`\n${field.name} (inline: ${field.inline})`);
            console.log('─────────────────────────────────────');
            console.log(field.value);
        });
        console.log('═══════════════════════════════════════');

        // Verify visual enhancements
        console.log('\n🔍 Verifying Visual Enhancements...');
        
        // Check title has decorative separators
        if (podiumsEmbed.data.title.includes('═══')) {
            console.log('   ✓ Podiums embed has decorative title separators');
        } else {
            throw new Error('Podiums embed missing decorative title separators');
        }

        if (rankingsEmbed.data.title.includes('═══')) {
            console.log('   ✓ Rankings embed has decorative title separators');
        } else {
            throw new Error('Rankings embed missing decorative title separators');
        }

        // Check inline fields for width optimization
        const allFieldsInline = podiumsEmbed.data.fields.every(f => f.inline) &&
                                 rankingsEmbed.data.fields.every(f => f.inline);
        if (allFieldsInline) {
            console.log('   ✓ All fields are inline for maximum width utilization');
        } else {
            throw new Error('Not all fields are inline');
        }

        // Check enhanced formatting (emojis and spacing)
        const hasEmojis = podiumsEmbed.data.fields.some(f => f.value.includes('💰') || f.value.includes('📊'));
        if (hasEmojis) {
            console.log('   ✓ Enhanced formatting with emojis present');
        } else {
            throw new Error('Missing enhanced emoji formatting');
        }

        // Check top 3 have special formatting
        const hasTopThreeFormatting = rankingsEmbed.data.fields.some(f => 
            f.value.includes('   💰') || f.value.includes('   📊')
        );
        if (hasTopThreeFormatting) {
            console.log('   ✓ Top 3 positions have enhanced spacing');
        } else {
            throw new Error('Missing enhanced spacing for top 3');
        }

        console.log('\n✅ All visual formatting tests passed!');
        console.log('🎨 Visual aesthetics are maximized with:');
        console.log('   • Decorative title separators');
        console.log('   • Inline fields for full width utilization');
        console.log('   • Enhanced emoji formatting');
        console.log('   • Improved spacing for top positions');
        console.log('   • Side-by-side podium and ranking displays');

    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    }
}

// Run tests
testVisualFormatting()
    .then(() => {
        console.log('\n🎉 Visual formatting test completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Visual formatting test failed:', error);
        process.exit(1);
    });
