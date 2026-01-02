// Test script for invite history anti-cheat functionality
require('dotenv').config();
const { db, pool } = require('./database/db');

async function testInviteHistory() {
    console.log('🧪 Testing invite history anti-cheat system...\n');
    
    try {
        // Initialize database
        await db.initialize();
        console.log('✅ Database initialized\n');
        
        // Test data
        const testInviterId = 'test_inviter_123';
        const testInvitedId = 'test_invited_456';
        
        // Test 1: Check if invite history exists (should be false initially)
        console.log('Test 1: Checking if invite exists (should be false)...');
        const existsBefore = await db.checkInviteHistory(testInviterId, testInvitedId);
        if (!existsBefore) {
            console.log('✅ Test 1 passed: Invite does not exist initially\n');
        } else {
            console.log('❌ Test 1 failed: Invite should not exist initially\n');
            throw new Error('Test 1 failed');
        }
        
        // Test 2: Add invite to history (should succeed)
        console.log('Test 2: Adding invite to history (should succeed)...');
        const addedFirst = await db.addInviteHistory(testInviterId, testInvitedId);
        if (addedFirst) {
            console.log('✅ Test 2 passed: Invite added successfully\n');
        } else {
            console.log('❌ Test 2 failed: Invite should be added successfully\n');
            throw new Error('Test 2 failed');
        }
        
        // Test 3: Check if invite exists now (should be true)
        console.log('Test 3: Checking if invite exists (should be true)...');
        const existsAfter = await db.checkInviteHistory(testInviterId, testInvitedId);
        if (existsAfter) {
            console.log('✅ Test 3 passed: Invite exists in history\n');
        } else {
            console.log('❌ Test 3 failed: Invite should exist in history\n');
            throw new Error('Test 3 failed');
        }
        
        // Test 4: Try to add duplicate (should fail/return false)
        console.log('Test 4: Adding duplicate invite (should fail)...');
        const addedDuplicate = await db.addInviteHistory(testInviterId, testInvitedId);
        if (!addedDuplicate) {
            console.log('✅ Test 4 passed: Duplicate invite rejected\n');
        } else {
            console.log('❌ Test 4 failed: Duplicate should be rejected\n');
            throw new Error('Test 4 failed');
        }
        
        // Test 5: Verify the record in database
        console.log('Test 5: Verifying record in database...');
        const result = await pool.query(
            'SELECT * FROM invite_history WHERE inviter_id = $1 AND invited_id = $2',
            [testInviterId, testInvitedId]
        );
        if (result.rows.length === 1) {
            console.log('✅ Test 5 passed: Exactly one record exists\n');
            console.log('Record details:', result.rows[0]);
        } else {
            console.log(`❌ Test 5 failed: Expected 1 record, found ${result.rows.length}\n`);
            throw new Error('Test 5 failed');
        }
        
        // Cleanup: Remove test data
        console.log('\nCleaning up test data...');
        await pool.query(
            'DELETE FROM invite_history WHERE inviter_id = $1 AND invited_id = $2',
            [testInviterId, testInvitedId]
        );
        console.log('✅ Test data cleaned up\n');
        
        console.log('🎉 All tests passed!\n');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    } finally {
        await db.close();
        console.log('✅ Database connection closed');
    }
}

// Run tests
testInviteHistory();
