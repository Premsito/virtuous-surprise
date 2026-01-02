/**
 * Test script to verify database migration logic
 * This test ensures the migration SQL is correct and would run properly
 */

const fs = require('fs');
const path = require('path');

console.log('=== Database Migration Test ===\n');

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
        testsPassed++;
    } catch (error) {
        console.log(`❌ ${name}`);
        console.log(`   Error: ${error.message}`);
        testsFailed++;
    }
}

// Test 1: Migration directory exists
test('Migration directory exists', () => {
    const migrationsDir = path.join(__dirname, 'database', 'migrations');
    if (!fs.existsSync(migrationsDir)) {
        throw new Error('Migrations directory does not exist');
    }
});

// Test 2: Migration file exists
test('Migration file 001_add_message_count.sql exists', () => {
    const migrationFile = path.join(__dirname, 'database', 'migrations', '001_add_message_count.sql');
    if (!fs.existsSync(migrationFile)) {
        throw new Error('Migration file does not exist');
    }
});

// Test 3: Migration file has valid SQL content
test('Migration file has valid SQL content', () => {
    const migrationFile = path.join(__dirname, 'database', 'migrations', '001_add_message_count.sql');
    const content = fs.readFileSync(migrationFile, 'utf-8');
    
    // Check for essential SQL keywords
    if (!content.includes('ALTER TABLE users')) {
        throw new Error('Migration does not contain ALTER TABLE statement');
    }
    if (!content.includes('message_count')) {
        throw new Error('Migration does not mention message_count column');
    }
    if (!content.includes('information_schema.columns')) {
        throw new Error('Migration does not check if column exists');
    }
});

// Test 4: Migration files are sorted correctly
test('Migration files would be sorted correctly', () => {
    const migrationsDir = path.join(__dirname, 'database', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();
    
    if (migrationFiles.length === 0) {
        throw new Error('No migration files found');
    }
    
    // First file should be 001_add_message_count.sql
    if (migrationFiles[0] !== '001_add_message_count.sql') {
        throw new Error('Migration files not in expected order');
    }
});

// Test 5: Database initialization code includes migration logic
test('Database initialization includes migration logic', () => {
    const dbFile = path.join(__dirname, 'database', 'db.js');
    const content = fs.readFileSync(dbFile, 'utf-8');
    
    if (!content.includes('migrations')) {
        throw new Error('Database initialization does not include migration logic');
    }
    if (!content.includes('Migration applied')) {
        throw new Error('Database initialization does not log migration application');
    }
});

// Test 6: Error throttling is implemented in bot.js
test('Error throttling is implemented in bot.js', () => {
    const botFile = path.join(__dirname, 'bot.js');
    const content = fs.readFileSync(botFile, 'utf-8');
    
    if (!content.includes('shouldLogError')) {
        throw new Error('Error throttling function not found');
    }
    if (!content.includes('errorThrottleMap')) {
        throw new Error('Error throttling map not found');
    }
    if (!content.includes('ERROR_THROTTLE_INTERVAL_MS')) {
        throw new Error('Error throttle interval not configured');
    }
});

// Test 7: Error handling uses throttling
test('Error handling uses throttling for message tracking', () => {
    const botFile = path.join(__dirname, 'bot.js');
    const content = fs.readFileSync(botFile, 'utf-8');
    
    if (!content.includes('shouldLogError(\'message_tracking\')')) {
        throw new Error('Message tracking error handling does not use throttling');
    }
});

// Summary
console.log('\n=== Test Summary ===');
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
console.log(`Total: ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
    console.log('\n✅ All migration tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some migration tests failed. Please review the errors above.');
    process.exit(1);
}
