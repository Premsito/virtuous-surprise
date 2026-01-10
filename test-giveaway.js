/**
 * Test file for giveaway command
 * This tests the basic structure and integration of the giveaway command
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing giveaway command structure...\n');

// Test 1: Load the giveaway command
console.log('Test 1: Load giveaway command');
try {
    const giveawayCommand = require('./commands/giveaway');
    console.log('✅ Giveaway command loaded successfully');
    console.log('   - Name:', giveawayCommand.name);
    console.log('   - Description:', giveawayCommand.description);
    console.log('   - Has execute function:', typeof giveawayCommand.execute === 'function');
    console.log('   - Has handleButtonInteraction:', typeof giveawayCommand.handleButtonInteraction === 'function');
} catch (error) {
    console.error('❌ Failed to load giveaway command:', error.message);
    process.exit(1);
}

// Test 2: Check database functions
console.log('\nTest 2: Check database giveaway functions');
try {
    const { db } = require('./database/db');
    const giveawayFunctions = [
        'createGiveaway',
        'updateGiveawayMessage',
        'getGiveaway',
        'getGiveawayByTitle',
        'getActiveGiveaways',
        'endGiveaway',
        'joinGiveaway',
        'getGiveawayParticipants',
        'getGiveawayParticipantCount',
        'hasJoinedGiveaway'
    ];
    
    let allPresent = true;
    for (const func of giveawayFunctions) {
        const exists = typeof db[func] === 'function';
        if (!exists) {
            console.error(`   ❌ Missing function: ${func}`);
            allPresent = false;
        }
    }
    
    if (allPresent) {
        console.log('✅ All database giveaway functions present');
        console.log('   Functions:', giveawayFunctions.join(', '));
    } else {
        process.exit(1);
    }
} catch (error) {
    console.error('❌ Failed to check database functions:', error.message);
    process.exit(1);
}

// Test 3: Check responses
console.log('\nTest 3: Check giveaway responses');
try {
    const responses = require('./responses.json');
    if (responses.giveaway) {
        console.log('✅ Giveaway responses found');
        console.log('   - invalidCommand:', !!responses.giveaway.invalidCommand);
        console.log('   - permissionDenied:', !!responses.giveaway.permissionDenied);
        console.log('   - create section:', !!responses.giveaway.create);
        console.log('   - end section:', !!responses.giveaway.end);
        console.log('   - joined:', !!responses.giveaway.joined);
    } else {
        console.error('❌ Giveaway responses not found');
        process.exit(1);
    }
} catch (error) {
    console.error('❌ Failed to check responses:', error.message);
    process.exit(1);
}

// Test 4: Check migration file
console.log('\nTest 4: Check migration file');
try {
    const migrationPath = path.join(__dirname, 'database', 'migrations', '009_add_giveaway_tables.sql');
    
    if (fs.existsSync(migrationPath)) {
        const content = fs.readFileSync(migrationPath, 'utf-8');
        const hasGiveawaysTable = content.includes('CREATE TABLE IF NOT EXISTS giveaways');
        const hasParticipantsTable = content.includes('CREATE TABLE IF NOT EXISTS giveaway_participants');
        
        if (hasGiveawaysTable && hasParticipantsTable) {
            console.log('✅ Migration file is valid');
            console.log('   - Has giveaways table:', hasGiveawaysTable);
            console.log('   - Has participants table:', hasParticipantsTable);
        } else {
            console.error('❌ Migration file is missing required tables');
            process.exit(1);
        }
    } else {
        console.error('❌ Migration file not found');
        process.exit(1);
    }
} catch (error) {
    console.error('❌ Failed to check migration file:', error.message);
    process.exit(1);
}

// Test 5: Check bot.js integration
console.log('\nTest 5: Check bot.js integration');
try {
    const botContent = fs.readFileSync('./bot.js', 'utf-8');
    
    const hasRequire = botContent.includes("require('./commands/giveaway')");
    const hasCommandSet = botContent.includes('giveawayCommand');
    const hasInteractionHandler = botContent.includes("giveaway_join_");
    
    if (hasRequire && hasCommandSet && hasInteractionHandler) {
        console.log('✅ Bot.js integration complete');
        console.log('   - Command required:', hasRequire);
        console.log('   - Command registered:', hasCommandSet);
        console.log('   - Interaction handler added:', hasInteractionHandler);
    } else {
        console.error('❌ Bot.js integration incomplete');
        console.error('   - Command required:', hasRequire);
        console.error('   - Command registered:', hasCommandSet);
        console.error('   - Interaction handler added:', hasInteractionHandler);
        process.exit(1);
    }
} catch (error) {
    console.error('❌ Failed to check bot.js integration:', error.message);
    process.exit(1);
}

console.log('\n✅ All tests passed! Giveaway command is properly integrated.');
console.log('\n📝 Usage:');
console.log('   - Create: !giveaway créer [titre] [objet] [durée] [gagnants] [quantité]');
console.log('   - End:    !giveaway terminer [titre]');
console.log('   - Example: !giveaway créer Nitro "Nitro 🎁" 10 1 1');
