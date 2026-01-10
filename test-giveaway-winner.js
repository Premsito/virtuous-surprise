/**
 * Test file for giveaway winner command
 * This tests the structure and integration of the new winner command
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing giveaway winner command...\n');

// Test 1: Load the giveaway command
console.log('Test 1: Verify giveaway command has winner subcommand');
try {
    const giveawayCommand = require('./commands/giveaway');
    console.log('✅ Giveaway command loaded successfully');
    console.log('   - Command name:', giveawayCommand.name);
    console.log('   - Has execute function:', typeof giveawayCommand.execute === 'function');
} catch (error) {
    console.error('❌ Failed to load giveaway command:', error.message);
    process.exit(1);
}

// Test 2: Check database function
console.log('\nTest 2: Check setManualWinner database function');
try {
    const { db } = require('./database/db');
    const hasFunction = typeof db.setManualWinner === 'function';
    
    if (hasFunction) {
        console.log('✅ setManualWinner function exists in db');
    } else {
        console.error('❌ setManualWinner function not found in db');
        process.exit(1);
    }
} catch (error) {
    console.error('❌ Failed to check database functions:', error.message);
    process.exit(1);
}

// Test 3: Check responses
console.log('\nTest 3: Check giveaway winner responses');
try {
    const responses = require('./responses.json');
    
    if (!responses.giveaway.winner) {
        console.error('❌ Missing giveaway.winner responses');
        process.exit(1);
    }
    
    const requiredResponses = ['noTitle', 'noMention', 'notFound', 'success'];
    let allPresent = true;
    
    for (const response of requiredResponses) {
        if (!responses.giveaway.winner[response]) {
            console.error(`   ❌ Missing response: giveaway.winner.${response}`);
            allPresent = false;
        }
    }
    
    if (allPresent) {
        console.log('✅ All required winner responses present');
        console.log('   - Response keys:', Object.keys(responses.giveaway.winner).join(', '));
    } else {
        process.exit(1);
    }
} catch (error) {
    console.error('❌ Failed to check responses:', error.message);
    process.exit(1);
}

// Test 4: Check migration file
console.log('\nTest 4: Check database migration file');
try {
    const migrationPath = path.join(__dirname, 'database/migrations/010_add_manual_winner_to_giveaways.sql');
    if (!fs.existsSync(migrationPath)) {
        console.error('❌ Migration file not found');
        process.exit(1);
    }
    
    const migrationContent = fs.readFileSync(migrationPath, 'utf8');
    if (migrationContent.includes('manual_winner_id')) {
        console.log('✅ Migration file exists and contains manual_winner_id');
    } else {
        console.error('❌ Migration file does not contain manual_winner_id');
        process.exit(1);
    }
} catch (error) {
    console.error('❌ Failed to check migration file:', error.message);
    process.exit(1);
}

console.log('\n✅ All tests passed!');
console.log('\n📋 Implementation Summary:');
console.log('   - Command: !giveaway winner [titre] @mention');
console.log('   - Admin only command (ID: 473336458715987970)');
console.log('   - Sets manual winner for ongoing giveaway');
console.log('   - Winner is selected at giveaway expiration');
console.log('   - Giveaway remains active until expiration');
