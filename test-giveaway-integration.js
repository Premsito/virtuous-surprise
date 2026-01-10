/**
 * Integration test to verify the giveaway system is properly wired up
 */

console.log('🧪 Running giveaway integration verification...\n');

const { Collection } = require('discord.js');

// Simulate loading all commands like bot.js does
console.log('Test 1: Verify command loading pattern matches bot.js');
try {
    const client = { commands: new Collection() };
    
    // Load giveaway command
    const giveawayCommand = require('./commands/giveaway');
    client.commands.set(giveawayCommand.name, giveawayCommand);
    
    // Verify it's registered
    const registered = client.commands.get('giveaway');
    if (registered && registered.name === 'giveaway') {
        console.log('✅ Command registration works correctly');
        console.log(`   - Registered as: "${registered.name}"`);
        console.log(`   - Description: "${registered.description}"`);
    } else {
        console.error('❌ Command registration failed');
        process.exit(1);
    }
} catch (error) {
    console.error('❌ Command loading error:', error.message);
    process.exit(1);
}

// Test response helper
console.log('\nTest 2: Verify response helper integration');
try {
    const { getResponse } = require('./utils/responseHelper');
    
    const testResponses = [
        'giveaway.invalidCommand',
        'giveaway.permissionDenied',
        'giveaway.create.invalidArgs',
        'giveaway.joined',
        'giveaway.alreadyJoined',
        'giveaway.alreadyEnded'
    ];
    
    let allWork = true;
    for (const key of testResponses) {
        const response = getResponse(key);
        if (!response || response.includes('undefined')) {
            console.error(`   ❌ Response missing or invalid: ${key}`);
            allWork = false;
        }
    }
    
    if (allWork) {
        console.log('✅ All giveaway responses work correctly');
        console.log(`   - Tested ${testResponses.length} response keys`);
    } else {
        process.exit(1);
    }
} catch (error) {
    console.error('❌ Response helper error:', error.message);
    process.exit(1);
}

// Test database functions are accessible
console.log('\nTest 3: Verify database functions are accessible');
try {
    const { db } = require('./database/db');
    
    // Check critical giveaway functions
    const criticalFunctions = [
        'createGiveaway',
        'joinGiveaway',
        'endGiveaway',
        'getGiveawayParticipants'
    ];
    
    for (const func of criticalFunctions) {
        if (typeof db[func] !== 'function') {
            console.error(`   ❌ Missing critical function: ${func}`);
            process.exit(1);
        }
    }
    
    console.log('✅ All critical database functions present');
    console.log(`   - Functions: ${criticalFunctions.join(', ')}`);
} catch (error) {
    console.error('❌ Database function error:', error.message);
    process.exit(1);
}

// Test admin helper
console.log('\nTest 4: Verify admin helper integration');
try {
    const { isAdmin } = require('./utils/adminHelper');
    
    if (typeof isAdmin === 'function') {
        console.log('✅ Admin helper is accessible');
    } else {
        console.error('❌ Admin helper not a function');
        process.exit(1);
    }
} catch (error) {
    console.error('❌ Admin helper error:', error.message);
    process.exit(1);
}

// Test config access
console.log('\nTest 5: Verify config integration');
try {
    const config = require('./config.json');
    
    if (config.colors && config.colors.gold && config.colors.success) {
        console.log('✅ Config colors accessible');
        console.log(`   - Gold: ${config.colors.gold}`);
        console.log(`   - Success: ${config.colors.success}`);
    } else {
        console.error('❌ Config colors missing');
        process.exit(1);
    }
} catch (error) {
    console.error('❌ Config error:', error.message);
    process.exit(1);
}

// Test Discord.js components
console.log('\nTest 6: Verify Discord.js components');
try {
    const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
    
    // Test creating components like the command does
    const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('Test Embed')
        .setDescription('Test description');
    
    const button = new ButtonBuilder()
        .setCustomId('test_button')
        .setLabel('Test')
        .setStyle(ButtonStyle.Primary);
    
    const row = new ActionRowBuilder()
        .addComponents(button);
    
    console.log('✅ Discord.js components work correctly');
    console.log('   - EmbedBuilder: OK');
    console.log('   - ButtonBuilder: OK');
    console.log('   - ActionRowBuilder: OK');
} catch (error) {
    console.error('❌ Discord.js component error:', error.message);
    process.exit(1);
}

console.log('\n✅ All integration tests passed!');
console.log('\n📋 Summary:');
console.log('   - Command registration: ✅');
console.log('   - Response system: ✅');
console.log('   - Database functions: ✅');
console.log('   - Admin helper: ✅');
console.log('   - Config access: ✅');
console.log('   - Discord.js components: ✅');
console.log('\n🎉 Giveaway system is ready to use!');
