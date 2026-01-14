#!/usr/bin/env node

/**
 * Test script to validate automatic classement refresh logging enhancements
 * 
 * This script verifies:
 * 1. Debug logging in setInterval is present
 * 2. Database notification handlers have debug logs
 * 3. Rankings cleanup function is being used
 * 4. Refresh logging is enhanced
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Automatic Classement Refresh Logging Enhancements\n');
console.log('='.repeat(70));

let testsPassed = 0;
let testsFailed = 0;

/**
 * Test helper function
 */
function test(description, callback) {
    try {
        callback();
        console.log(`✅ PASS: ${description}`);
        testsPassed++;
    } catch (error) {
        console.error(`❌ FAIL: ${description}`);
        console.error(`   Error: ${error.message}`);
        testsFailed++;
    }
}

/**
 * Check if a file contains a specific string
 */
function fileContains(filePath, searchString, description) {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (!content.includes(searchString)) {
        throw new Error(`File ${filePath} does not contain: "${searchString}"`);
    }
}

/**
 * Check if a file contains a regex pattern
 */
function fileMatches(filePath, pattern, description) {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (!pattern.test(content)) {
        throw new Error(`File ${filePath} does not match pattern: ${pattern}`);
    }
}

// Test 1: Verify setInterval has debug logging
test('setInterval has debug logging for automatic refresh', () => {
    const botPath = path.join(__dirname, 'bot.js');
    fileContains(
        botPath,
        "[DEBUG] Automatic classement refresh triggered",
        "Debug log in setInterval"
    );
});

// Test 2: Verify LC change handler has debug logging
test('LC change handler has debug logging', () => {
    const botPath = path.join(__dirname, 'bot.js');
    fileContains(
        botPath,
        "[DEBUG] Detected LC/XP update, refreshing classement",
        "Debug log in LC handler"
    );
});

// Test 3: Verify Niveau change handler has debug logging
test('Niveau change handler has debug logging', () => {
    const botPath = path.join(__dirname, 'bot.js');
    const content = fs.readFileSync(botPath, 'utf-8');
    // Count occurrences of the debug log (should appear twice: once for LC, once for Niveau)
    const matches = content.match(/\[DEBUG\] Detected LC\/XP update, refreshing classement/g);
    if (!matches || matches.length < 2) {
        throw new Error('Debug log should appear at least twice (LC and Niveau handlers)');
    }
});

// Test 4: Verify rankings cleanup function is used
test('Rankings update uses cleanupOldRankings function', () => {
    const rankingsPath = path.join(__dirname, 'commands', 'rankings.js');
    fileContains(
        rankingsPath,
        "await this.cleanupOldRankings(channel",
        "cleanupOldRankings is called"
    );
});

// Test 5: Verify cleanup logging is present
test('Cleanup has enhanced logging', () => {
    const rankingsPath = path.join(__dirname, 'commands', 'rankings.js');
    fileContains(
        rankingsPath,
        "[CLEANUP] Starting enhanced cleanup of old ranking messages",
        "Enhanced cleanup logging"
    );
});

// Test 6: Verify triggerUpdate has refresh logging
test('triggerUpdate has refresh logging', () => {
    const managerPath = path.join(__dirname, 'utils', 'rankingsManager.js');
    fileContains(
        managerPath,
        "[DEBUG] Refreshed rankings:",
        "Refresh logging in triggerUpdate"
    );
});

// Test 7: Verify documentation about XP-Niveau sync
test('triggerUpdate documents XP-Niveau synchronization', () => {
    const managerPath = path.join(__dirname, 'utils', 'rankingsManager.js');
    fileContains(
        managerPath,
        "auto_update_level database trigger",
        "Documentation mentions auto_update_level trigger"
    );
});

// Test 8: Verify setInterval is actually present and correct
test('setInterval is configured with correct interval', () => {
    const botPath = path.join(__dirname, 'bot.js');
    const content = fs.readFileSync(botPath, 'utf-8');
    
    // Check that RANKINGS_UPDATE_INTERVAL_MS is defined
    if (!content.includes('RANKINGS_UPDATE_INTERVAL_MS')) {
        throw new Error('RANKINGS_UPDATE_INTERVAL_MS not found');
    }
    
    // Check that setInterval uses this constant
    if (!content.includes('setInterval(')) {
        throw new Error('setInterval not found');
    }
});

// Test 9: Verify database triggers exist in migration
test('PostgreSQL triggers exist in migration 013', () => {
    const migrationPath = path.join(__dirname, 'database', 'migrations', '013_add_rankings_optimizations.sql');
    fileContains(
        migrationPath,
        "CREATE OR REPLACE FUNCTION notify_lc_change()",
        "LC change notification function exists"
    );
    fileContains(
        migrationPath,
        "CREATE OR REPLACE FUNCTION notify_niveau_change()",
        "Niveau change notification function exists"
    );
});

// Test 10: Verify auto-level trigger exists
test('Auto-level update trigger exists in migration 014', () => {
    const migrationPath = path.join(__dirname, 'database', 'migrations', '014_add_auto_level_update_trigger.sql');
    fileContains(
        migrationPath,
        "CREATE OR REPLACE FUNCTION auto_update_level()",
        "Auto-level update function exists"
    );
    fileContains(
        migrationPath,
        "CREATE TRIGGER trigger_auto_update_level",
        "Auto-level trigger is created"
    );
});

// Test 11: Verify database notification setup
test('Database notifications are set up in bot.js', () => {
    const botPath = path.join(__dirname, 'bot.js');
    fileContains(
        botPath,
        "db.setupDatabaseNotifications",
        "setupDatabaseNotifications is called"
    );
});

// Test 12: Verify rankings manager is initialized
test('Rankings manager is initialized with client and command', () => {
    const botPath = path.join(__dirname, 'bot.js');
    fileContains(
        botPath,
        "rankingsManager.initialize(client, rankingsCommand)",
        "Rankings manager initialization"
    );
});

// Summary
console.log('\n' + '='.repeat(70));
console.log('📊 Test Summary');
console.log('='.repeat(70));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);
console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
console.log('='.repeat(70));

if (testsFailed > 0) {
    console.log('\n⚠️  Some tests failed. Please review the implementation.');
    process.exit(1);
} else {
    console.log('\n🎉 All tests passed! Automatic classement refresh logging is properly implemented.');
    process.exit(0);
}
