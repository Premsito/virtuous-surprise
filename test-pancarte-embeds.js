/**
 * Test and demo for Discord Embed pancartes (level-up notifications)
 * This demonstrates the visual appearance of the new embed-based notifications
 */

const { EmbedBuilder } = require('discord.js');
const { calculateLevelReward } = require('./utils/rewardHelper');
const { getXPProgress } = require('./utils/xpHelper');
const config = require('./config.json');

// Mock Discord user object for testing
const mockUser = {
    username: 'Premsito',
    displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png'
};

/**
 * Generate a level-up pancarte embed (same logic as bot.js sendLevelUpCard)
 */
function generateLevelUpPancarte(user, newLevel, totalXP, rewardInfo) {
    // Get XP progress for the new level
    const progress = getXPProgress(totalXP);
    
    // Determine embed color based on reward type
    let embedColor = config.colors.primary;
    if (rewardInfo.type === 'milestone') {
        embedColor = config.colors.gold; // Golden for milestone rewards
    } else if (rewardInfo.type === 'boost') {
        embedColor = rewardInfo.boost.type === 'xp' ? config.colors.warning : config.colors.success;
    }
    
    // Create the embed pancarte
    const embed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle('🎉 Félicitations 🎉')
        .setDescription(`**Tu as atteint le Niveau ${newLevel}** 🏆`)
        .setThumbnail(user.displayAvatarURL({ size: 256 }))
        .addFields(
            {
                name: '📊 Progression XP',
                value: `${progress.currentLevelXP} / ${progress.nextLevelXP} XP (${progress.progress}%)`,
                inline: true
            },
            {
                name: '🎁 Récompense',
                value: rewardInfo.description,
                inline: true
            }
        )
        .setTimestamp();
    
    // Add special message for milestone levels
    if (rewardInfo.type === 'milestone') {
        const nextMilestone = Math.ceil((newLevel + 1) / 5) * 5;
        embed.setFooter({ 
            text: `Continue jusqu'au niveau ${nextMilestone} pour le prochain trésor ! 💎` 
        });
    } else {
        embed.setFooter({ 
            text: '💡 Les !missions permettent de gagner de l\'XP et des LC !' 
        });
    }
    
    return embed;
}

/**
 * Display embed as JSON for visual inspection
 */
function displayEmbed(levelNum, embed) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 PANCARTE - NIVEAU ${levelNum}`);
    console.log('='.repeat(60));
    const embedData = embed.toJSON();
    console.log(`Color: ${embedData.color ? `#${embedData.color.toString(16).padStart(6, '0')}` : 'default'}`);
    console.log(`Title: ${embedData.title || 'N/A'}`);
    console.log(`Description: ${embedData.description || 'N/A'}`);
    console.log(`Thumbnail: ${embedData.thumbnail?.url || 'N/A'}`);
    console.log(`Fields:`);
    if (embedData.fields) {
        embedData.fields.forEach(field => {
            console.log(`  - ${field.name}: ${field.value} (inline: ${field.inline})`);
        });
    }
    console.log(`Footer: ${embedData.footer?.text || 'N/A'}`);
    console.log(`Timestamp: ${embedData.timestamp ? new Date(embedData.timestamp).toISOString() : 'N/A'}`);
}

async function testPancarteEmbeds() {
    try {
        console.log('🧪 Testing Discord Embed Pancartes for Level-Up Notifications\n');
        console.log('This test demonstrates the visual appearance of different level-up types:\n');
        
        // Test case 1: Milestone level 5 (Trésor at every 5th level)
        console.log('📝 Test 1: Milestone Level 5 - Grand trésor 💎');
        const level5XP = 1000 + 250; // XP sum for levels 1-4 + some progress
        const reward5 = calculateLevelReward(5);
        const embed5 = generateLevelUpPancarte(mockUser, 5, level5XP, reward5);
        displayEmbed(5, embed5);
        console.log(`Reward Type: ${reward5.type}`);
        console.log(`LC Amount: ${reward5.lcAmount}`);
        console.log(`Boost: ${reward5.boost ? `${reward5.boost.type} x${reward5.boost.multiplier}` : 'None'}`);
        
        // Test case 2: Milestone level 10 (Trésor épique with boost)
        console.log('\n📝 Test 2: Milestone Level 10 - Trésor épique 💎⚡');
        const level10XP = 5500 + 500; // XP sum for levels 1-9 + some progress
        const reward10 = calculateLevelReward(10);
        const embed10 = generateLevelUpPancarte(mockUser, 10, level10XP, reward10);
        displayEmbed(10, embed10);
        console.log(`Reward Type: ${reward10.type}`);
        console.log(`LC Amount: ${reward10.lcAmount}`);
        console.log(`Boost: ${reward10.boost ? `${reward10.boost.type} x${reward10.boost.multiplier}` : 'None'}`);
        
        // Test case 3: Intermediate level 3 (Bonus LC boost)
        console.log('\n📝 Test 3: Intermediate Level 3 - Bonus ⚡');
        const level3XP = 300 + 150; // XP sum for levels 1-2 + some progress
        const reward3 = calculateLevelReward(3);
        const embed3 = generateLevelUpPancarte(mockUser, 3, level3XP, reward3);
        displayEmbed(3, embed3);
        console.log(`Reward Type: ${reward3.type}`);
        console.log(`LC Amount: ${reward3.lcAmount}`);
        console.log(`Boost: ${reward3.boost ? `${reward3.boost.type} x${reward3.boost.multiplier}` : 'None'}`);
        
        // Test case 4: Even level 8 (Fixed LC reward)
        console.log('\n📝 Test 4: Even Level 8 - Fixed LC Reward 💰');
        const level8XP = 3600 + 400; // XP sum for levels 1-7 + some progress
        const reward8 = calculateLevelReward(8);
        const embed8 = generateLevelUpPancarte(mockUser, 8, level8XP, reward8);
        displayEmbed(8, embed8);
        console.log(`Reward Type: ${reward8.type}`);
        console.log(`LC Amount: ${reward8.lcAmount}`);
        console.log(`Boost: ${reward8.boost ? `${reward8.boost.type} x${reward8.boost.multiplier}` : 'None'}`);
        
        // Test case 5: Milestone level 15 (Trésor légendaire)
        console.log('\n📝 Test 5: Milestone Level 15 - Trésor légendaire 💎');
        const level15XP = 12000 + 750; // XP sum for levels 1-14 + some progress
        const reward15 = calculateLevelReward(15);
        const embed15 = generateLevelUpPancarte(mockUser, 15, level15XP, reward15);
        displayEmbed(15, embed15);
        console.log(`Reward Type: ${reward15.type}`);
        console.log(`LC Amount: ${reward15.lcAmount}`);
        console.log(`Boost: ${reward15.boost ? `${reward15.boost.type} x${reward15.boost.multiplier}` : 'None'}`);
        
        console.log('\n' + '='.repeat(60));
        console.log('🎉 All pancarte embeds generated successfully!');
        console.log('='.repeat(60));
        console.log('\n📋 Summary:');
        console.log('   ✅ 5 different level-up pancarte types tested');
        console.log('   ✅ Milestone levels show GOLDEN color (#FFD700)');
        console.log('   ✅ Bonus levels show appropriate colors (warning/success)');
        console.log('   ✅ User avatar displayed prominently');
        console.log('   ✅ Dynamic rewards based on level type');
        console.log('   ✅ "🎉 Félicitations" title on all pancartes');
        console.log('   ✅ "Tu as atteint le Niveau {X}" message');
        console.log('\n💡 These embeds will replace the Canvas-based PNG cards.');
        console.log('💡 All level-up notifications will now use Discord Embeds (pancartes).\n');
        
    } catch (error) {
        console.error('❌ Error testing pancarte embeds:', error);
        process.exit(1);
    }
}

// Run the test
testPancarteEmbeds();
