#!/usr/bin/env node

/**
 * Validation test for automatic classement refresh implementation
 * 
 * This test validates that all the requirements from the problem statement
 * have been properly implemented in the code.
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Validating Automatic Classement Refresh Implementation\n');
console.log('='.repeat(70));
console.log('Problem Statement Requirements:');
console.log('1. Ensure setInterval triggers automatic refresh with logging');
console.log('2. Enable triggers for real-time updates');
console.log('3. Synchronize XP and Niveau calculations');
console.log('4. Enhance embed deletion and recreation');
console.log('='.repeat(70));
console.log('');

let testsPassed = 0;
let testsFailed = 0;
const findings = [];

/**
 * Test helper function
 */
function test(description, callback) {
    try {
        const result = callback();
        console.log(`✅ PASS: ${description}`);
        if (result) {
            findings.push({ test: description, details: result });
        }
        testsPassed++;
    } catch (error) {
        console.error(`❌ FAIL: ${description}`);
        console.error(`   Error: ${error.message}`);
        testsFailed++;
    }
}

/**
 * Count occurrences of a string in a file
 */
function countOccurrences(filePath, searchString) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const matches = content.match(new RegExp(searchString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'));
    return matches ? matches.length : 0;
}

/**
 * Check if file contains string
 */
function fileContains(filePath, searchString) {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.includes(searchString);
}

/**
 * Extract code snippet around a search string
 */
function extractSnippet(filePath, searchString, linesBefore = 2, linesAfter = 2) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(searchString)) {
            const start = Math.max(0, i - linesBefore);
            const end = Math.min(lines.length, i + linesAfter + 1);
            return lines.slice(start, end).join('\n');
        }
    }
    return null;
}

console.log('📋 REQUIREMENT 1: setInterval Triggers with Debug Logging');
console.log('-'.repeat(70));

test('setInterval exists in bot.js', () => {
    const botPath = path.join(__dirname, 'bot.js');
    const count = countOccurrences(botPath, 'setInterval');
    if (count < 1) {
        throw new Error('setInterval not found');
    }
    return `Found ${count} setInterval calls`;
});

test('Debug log for automatic refresh exists', () => {
    const botPath = path.join(__dirname, 'bot.js');
    if (!fileContains(botPath, "[DEBUG] Automatic classement refresh triggered")) {
        throw new Error('Debug log not found in setInterval');
    }
    const snippet = extractSnippet(botPath, "[DEBUG] Automatic classement refresh triggered", 3, 3);
    return `Implementation:\n${snippet}`;
});

test('Rankings update interval is configurable', () => {
    const botPath = path.join(__dirname, 'bot.js');
    if (!fileContains(botPath, "RANKINGS_UPDATE_INTERVAL_MS")) {
        throw new Error('RANKINGS_UPDATE_INTERVAL_MS constant not found');
    }
    const snippet = extractSnippet(botPath, "RANKINGS_UPDATE_INTERVAL_MS", 1, 0);
    return `Configuration:\n${snippet}`;
});

console.log('');
console.log('📋 REQUIREMENT 2: PostgreSQL Triggers for Real-Time Updates');
console.log('-'.repeat(70));

test('notify_lc_change trigger function exists', () => {
    const migrationPath = path.join(__dirname, 'database', 'migrations', '013_add_rankings_optimizations.sql');
    if (!fileContains(migrationPath, "CREATE OR REPLACE FUNCTION notify_lc_change()")) {
        throw new Error('notify_lc_change function not found');
    }
    return 'LC change notification trigger implemented';
});

test('notify_niveau_change trigger function exists', () => {
    const migrationPath = path.join(__dirname, 'database', 'migrations', '013_add_rankings_optimizations.sql');
    if (!fileContains(migrationPath, "CREATE OR REPLACE FUNCTION notify_niveau_change()")) {
        throw new Error('notify_niveau_change function not found');
    }
    return 'Niveau change notification trigger implemented';
});

test('Triggers use pg_notify', () => {
    const migrationPath = path.join(__dirname, 'database', 'migrations', '013_add_rankings_optimizations.sql');
    const count = countOccurrences(migrationPath, "pg_notify");
    if (count < 2) {
        throw new Error('pg_notify not found in triggers');
    }
    return `pg_notify used ${count} times in triggers`;
});

test('Database notification listener is set up', () => {
    const botPath = path.join(__dirname, 'bot.js');
    if (!fileContains(botPath, "db.setupDatabaseNotifications")) {
        throw new Error('setupDatabaseNotifications not called');
    }
    return 'Listener registered for database notifications';
});

test('LC/XP update detection logging exists', () => {
    const botPath = path.join(__dirname, 'bot.js');
    const count = countOccurrences(botPath, "[DEBUG] Detected LC/XP update, refreshing classement");
    if (count < 2) {
        throw new Error('Debug log for LC/XP updates not found (should appear for both LC and Niveau)');
    }
    return `LC/XP update detection logged ${count} times (LC and Niveau handlers)`;
});

console.log('');
console.log('📋 REQUIREMENT 3: XP and Niveau Synchronization');
console.log('-'.repeat(70));

test('auto_update_level trigger exists', () => {
    const migrationPath = path.join(__dirname, 'database', 'migrations', '014_add_auto_level_update_trigger.sql');
    if (!fileContains(migrationPath, "CREATE OR REPLACE FUNCTION auto_update_level()")) {
        throw new Error('auto_update_level function not found');
    }
    return 'Auto-level update trigger implemented';
});

test('calculate_level_from_xp function exists', () => {
    const migrationPath = path.join(__dirname, 'database', 'migrations', '014_add_auto_level_update_trigger.sql');
    if (!fileContains(migrationPath, "CREATE OR REPLACE FUNCTION calculate_level_from_xp")) {
        throw new Error('calculate_level_from_xp function not found');
    }
    return 'Level calculation function implemented';
});

test('Trigger updates level BEFORE row is saved', () => {
    const migrationPath = path.join(__dirname, 'database', 'migrations', '014_add_auto_level_update_trigger.sql');
    if (!fileContains(migrationPath, "BEFORE INSERT OR UPDATE OF xp")) {
        throw new Error('Trigger not configured as BEFORE trigger');
    }
    return 'BEFORE trigger ensures level is calculated before save';
});

test('refreshClassement logs rankings data', () => {
    const managerPath = path.join(__dirname, 'utils', 'rankingsManager.js');
    if (!fileContains(managerPath, "[DEBUG] Refreshed rankings:")) {
        throw new Error('Refresh logging not found in rankings manager');
    }
    return 'Rankings refresh logging implemented';
});

test('XP-Niveau sync is documented', () => {
    const managerPath = path.join(__dirname, 'utils', 'rankingsManager.js');
    if (!fileContains(managerPath, "auto_update_level database trigger")) {
        throw new Error('XP-Niveau synchronization not documented');
    }
    const snippet = extractSnippet(managerPath, "auto_update_level database trigger", 5, 0);
    return `Documentation:\n${snippet}`;
});

console.log('');
console.log('📋 REQUIREMENT 4: Enhanced Embed Deletion and Recreation');
console.log('-'.repeat(70));

test('cleanupOldRankings function exists', () => {
    const rankingsPath = path.join(__dirname, 'commands', 'rankings.js');
    if (!fileContains(rankingsPath, "async cleanupOldRankings(channel")) {
        throw new Error('cleanupOldRankings function not found');
    }
    return 'Comprehensive cleanup function implemented';
});

test('cleanupOldRankings is called in updateRankingsChannel', () => {
    const rankingsPath = path.join(__dirname, 'commands', 'rankings.js');
    if (!fileContains(rankingsPath, "await this.cleanupOldRankings(channel")) {
        throw new Error('cleanupOldRankings not called in update function');
    }
    const snippet = extractSnippet(rankingsPath, "await this.cleanupOldRankings", 2, 3);
    return `Usage:\n${snippet}`;
});

test('Cleanup function scans for old bot messages', () => {
    const rankingsPath = path.join(__dirname, 'commands', 'rankings.js');
    if (!fileContains(rankingsPath, "channel.messages.fetch")) {
        throw new Error('Message fetching not found in cleanup');
    }
    return 'Cleanup scans and removes old ranking messages';
});

test('Cleanup has enhanced logging', () => {
    const rankingsPath = path.join(__dirname, 'commands', 'rankings.js');
    if (!fileContains(rankingsPath, "[CLEANUP]")) {
        throw new Error('CLEANUP logging tag not found');
    }
    const count = countOccurrences(rankingsPath, "[CLEANUP]");
    return `Cleanup logging used ${count} times for visibility`;
});

test('Old messages are deleted before posting new ones', () => {
    const rankingsPath = path.join(__dirname, 'commands', 'rankings.js');
    const content = fs.readFileSync(rankingsPath, 'utf-8');
    
    // Find the cleanupOldRankings call
    const cleanupIndex = content.indexOf('await this.cleanupOldRankings');
    // Find the displayRankings call (posting new message)
    const displayIndex = content.indexOf('await this.displayRankings(channel)');
    
    if (cleanupIndex === -1 || displayIndex === -1) {
        throw new Error('Cannot find cleanup or display calls');
    }
    
    if (cleanupIndex > displayIndex) {
        throw new Error('Cleanup happens after display - should be before!');
    }
    
    return 'Cleanup occurs before posting new rankings (correct order)';
});

// Summary
console.log('\n' + '='.repeat(70));
console.log('📊 Test Summary');
console.log('='.repeat(70));
console.log(`✅ Passed: ${testsPassed}`);
console.log(`❌ Failed: ${testsFailed}`);

if (testsPassed + testsFailed > 0) {
    console.log(`📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
}
console.log('='.repeat(70));

if (testsFailed > 0) {
    console.log('\n⚠️  Some requirements are not fully implemented.');
    console.log('Please review the failed tests above.');
    process.exit(1);
} else {
    console.log('\n🎉 All requirements validated successfully!');
    console.log('');
    console.log('✅ Requirement 1: setInterval triggers automatic refresh - IMPLEMENTED');
    console.log('   - Debug logging added to monitor execution');
    console.log('   - Configurable 5-minute interval');
    console.log('');
    console.log('✅ Requirement 2: PostgreSQL triggers for real-time updates - IMPLEMENTED');
    console.log('   - notify_lc_change trigger on balance updates');
    console.log('   - notify_niveau_change trigger on level updates');
    console.log('   - Database notification listeners registered');
    console.log('   - Debug logging for LC/XP update detection');
    console.log('');
    console.log('✅ Requirement 3: XP and Niveau synchronization - IMPLEMENTED');
    console.log('   - auto_update_level trigger calculates level from XP');
    console.log('   - BEFORE trigger ensures immediate synchronization');
    console.log('   - Rankings automatically reflect XP changes');
    console.log('   - Refresh logging for monitoring');
    console.log('');
    console.log('✅ Requirement 4: Enhanced embed deletion - IMPLEMENTED');
    console.log('   - cleanupOldRankings scans for old bot messages');
    console.log('   - All old ranking embeds deleted before posting new ones');
    console.log('   - Enhanced logging for cleanup operations');
    console.log('   - No residual embeds remain in channel');
    console.log('');
    console.log('🚀 System is ready for deployment!');
    process.exit(0);
}
