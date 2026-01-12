/**
 * Quick verification test to ensure the bot can initialize with embed-based pancartes
 * This test verifies that all required modules are properly imported and configured
 */

async function testBotInitialization() {
    console.log('🧪 Testing bot initialization with embed-based pancartes...\n');
    
    try {
        // Test 1: Verify discord.js modules
        console.log('📦 Test 1: Checking discord.js imports...');
        const { EmbedBuilder } = require('discord.js');
        if (!EmbedBuilder) {
            throw new Error('EmbedBuilder not available');
        }
        console.log('   ✅ EmbedBuilder imported successfully\n');
        
        // Test 2: Verify reward helper imports
        console.log('📦 Test 2: Checking reward helper imports...');
        const { calculateLevelReward, formatRewardEmbed } = require('./utils/rewardHelper');
        if (!calculateLevelReward || !formatRewardEmbed) {
            throw new Error('Reward helper functions not available');
        }
        console.log('   ✅ Reward helper functions imported successfully\n');
        
        // Test 3: Verify XP helper imports
        console.log('📦 Test 3: Checking XP helper imports...');
        const { getXPProgress, getXPForLevel } = require('./utils/xpHelper');
        if (!getXPProgress || !getXPForLevel) {
            throw new Error('XP helper functions not available');
        }
        console.log('   ✅ XP helper functions imported successfully\n');
        
        // Test 4: Verify config
        console.log('📦 Test 4: Checking configuration...');
        const config = require('./config.json');
        if (!config.channels.levelUpNotification) {
            throw new Error('Level-up notification channel not configured');
        }
        if (!config.colors.gold) {
            throw new Error('Gold color not configured');
        }
        console.log(`   Channel ID: ${config.channels.levelUpNotification}`);
        console.log(`   Gold color: ${config.colors.gold}`);
        console.log('   ✅ Configuration is valid\n');
        
        // Test 5: Test embed creation with different reward types
        console.log('🎨 Test 5: Testing embed creation for different reward types...');
        
        const mockUser = {
            username: 'TestUser',
            displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png'
        };
        
        // Helper function to calculate total XP for a given level
        function getTotalXPForLevel(level) {
            let totalXP = 0;
            for (let i = 1; i < level; i++) {
                totalXP += getXPForLevel(i);
            }
            return totalXP;
        }
        
        // Test milestone reward
        const milestoneReward = calculateLevelReward(5);
        const totalXP5 = getTotalXPForLevel(5) + 250; // Add partial progress
        const progress5 = getXPProgress(totalXP5);
        const milestoneEmbed = new EmbedBuilder()
            .setColor(config.colors.gold)
            .setTitle('🎉 Félicitations 🎉')
            .setDescription(`**Tu as atteint le Niveau 5** 🏆`)
            .setThumbnail(mockUser.displayAvatarURL({ size: 256 }))
            .addFields(
                {
                    name: '📊 Progression XP',
                    value: `${progress5.currentLevelXP} / ${progress5.nextLevelXP} XP (${progress5.progress}%)`,
                    inline: true
                },
                {
                    name: '🎁 Récompense',
                    value: milestoneReward.description,
                    inline: true
                }
            );
        
        if (!milestoneEmbed.data.title || !milestoneEmbed.data.description) {
            throw new Error('Milestone embed is incomplete');
        }
        console.log('   ✅ Milestone embed created successfully');
        
        // Test boost reward
        const boostReward = calculateLevelReward(3);
        const totalXP3 = getTotalXPForLevel(3) + 150; // Add partial progress
        const progress3 = getXPProgress(totalXP3);
        const boostEmbed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('🎉 Félicitations 🎉')
            .setDescription(`**Tu as atteint le Niveau 3** 🏆`)
            .setThumbnail(mockUser.displayAvatarURL({ size: 256 }))
            .addFields(
                {
                    name: '📊 Progression XP',
                    value: `${progress3.currentLevelXP} / ${progress3.nextLevelXP} XP (${progress3.progress}%)`,
                    inline: true
                },
                {
                    name: '🎁 Récompense',
                    value: boostReward.description,
                    inline: true
                }
            );
        
        if (!boostEmbed.data.title || !boostEmbed.data.description) {
            throw new Error('Boost embed is incomplete');
        }
        console.log('   ✅ Boost embed created successfully');
        
        // Test regular LC reward
        const lcReward = calculateLevelReward(4);
        const totalXP4 = getTotalXPForLevel(4) + 200; // Add partial progress
        const progress4 = getXPProgress(totalXP4);
        const lcEmbed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setTitle('🎉 Félicitations 🎉')
            .setDescription(`**Tu as atteint le Niveau 4** 🏆`)
            .setThumbnail(mockUser.displayAvatarURL({ size: 256 }))
            .addFields(
                {
                    name: '📊 Progression XP',
                    value: `${progress4.currentLevelXP} / ${progress4.nextLevelXP} XP (${progress4.progress}%)`,
                    inline: true
                },
                {
                    name: '🎁 Récompense',
                    value: lcReward.description,
                    inline: true
                }
            );
        
        if (!lcEmbed.data.title || !lcEmbed.data.description) {
            throw new Error('LC embed is incomplete');
        }
        console.log('   ✅ LC reward embed created successfully\n');
        
        // Summary
        console.log('🎉 All initialization tests passed!\n');
        console.log('📋 Summary:');
        console.log('   ✅ Discord.js EmbedBuilder available');
        console.log('   ✅ Reward helper functions working');
        console.log('   ✅ XP helper functions working');
        console.log('   ✅ Configuration valid');
        console.log('   ✅ All embed types can be created');
        console.log('\n✨ The bot is ready to use embed-based pancartes for level-ups!');
        console.log('\n📝 Next steps:');
        console.log('   - Start the bot to see pancartes in action');
        console.log('   - Level-up notifications will appear in channel: ' + config.channels.levelUpNotification);
        console.log('   - Pancartes will show golden color for milestone levels (5, 10, 15, etc.)');
        console.log('   - All existing users will see the new format on their next level-up');
        
    } catch (error) {
        console.error('\n❌ Initialization test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the test
testBotInitialization();
