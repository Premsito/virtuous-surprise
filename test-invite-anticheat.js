/**
 * Test for anti-cheat invite system
 * This test verifies that the invite_history table and anti-cheat functions work correctly
 */

require('dotenv').config();
const { pool, db } = require('./database/db');

async function runTests() {
    console.log('🧪 Starting anti-cheat invite system tests...\n');
    
    try {
        // Initialize database
        console.log('📦 Initializing database...');
        await db.initialize();
        console.log('✅ Database initialized\n');
        
        // Test 1: Check if invite_history table exists
        console.log('Test 1: Checking if invite_history table exists...');
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT 1 
                FROM information_schema.tables 
                WHERE table_name = 'invite_history'
            )
        `);
        
        if (tableCheck.rows[0].exists) {
            console.log('✅ invite_history table exists\n');
        } else {
            console.log('❌ invite_history table does not exist\n');
            process.exit(1);
        }
        
        // Test 2: Test checkInviteExists with non-existent invite
        console.log('Test 2: Testing checkInviteExists with non-existent invite...');
        const testInviterId = 'test_inviter_001';
        const testInvitedId = 'test_invited_001';
        
        const exists1 = await db.checkInviteExists(testInviterId, testInvitedId);
        if (!exists1) {
            console.log('✅ checkInviteExists correctly returns false for non-existent invite\n');
        } else {
            console.log('❌ checkInviteExists should return false for non-existent invite\n');
            process.exit(1);
        }
        
        // Test 3: Add invite to history
        console.log('Test 3: Adding invite to history...');
        await db.addInviteHistory(testInviterId, testInvitedId);
        console.log('✅ Invite added to history\n');
        
        // Test 4: Test checkInviteExists with existing invite
        console.log('Test 4: Testing checkInviteExists with existing invite...');
        const exists2 = await db.checkInviteExists(testInviterId, testInvitedId);
        if (exists2) {
            console.log('✅ checkInviteExists correctly returns true for existing invite\n');
        } else {
            console.log('❌ checkInviteExists should return true for existing invite\n');
            process.exit(1);
        }
        
        // Test 5: Test duplicate insert (should not cause error due to ON CONFLICT)
        console.log('Test 5: Testing duplicate insert (should be handled gracefully)...');
        try {
            await db.addInviteHistory(testInviterId, testInvitedId);
            console.log('✅ Duplicate insert handled gracefully with ON CONFLICT DO NOTHING\n');
        } catch (error) {
            console.log('❌ Duplicate insert should not throw error:', error.message);
            process.exit(1);
        }
        
        // Test 6: Test different invited user with same inviter
        console.log('Test 6: Testing different invited user with same inviter...');
        const testInvitedId2 = 'test_invited_002';
        const exists3 = await db.checkInviteExists(testInviterId, testInvitedId2);
        if (!exists3) {
            console.log('✅ Different invited user correctly returns false\n');
        } else {
            console.log('❌ Different invited user should return false\n');
            process.exit(1);
        }
        
        await db.addInviteHistory(testInviterId, testInvitedId2);
        const exists4 = await db.checkInviteExists(testInviterId, testInvitedId2);
        if (exists4) {
            console.log('✅ Second invited user correctly tracked\n');
        } else {
            console.log('❌ Second invited user should be tracked\n');
            process.exit(1);
        }
        
        // Test 7: Verify composite primary key works (same users, different order)
        console.log('Test 7: Testing composite primary key uniqueness...');
        const differentInviterId = 'test_inviter_002';
        await db.addInviteHistory(differentInviterId, testInvitedId);
        const exists5 = await db.checkInviteExists(differentInviterId, testInvitedId);
        if (exists5) {
            console.log('✅ Different inviter can invite same user\n');
        } else {
            console.log('❌ Different inviter should be able to invite same user\n');
            process.exit(1);
        }
        
        // Cleanup test data
        console.log('🧹 Cleaning up test data...');
        await pool.query(
            'DELETE FROM invite_history WHERE inviter_id LIKE $1 OR invited_id LIKE $2',
            ['test_inviter_%', 'test_invited_%']
        );
        console.log('✅ Test data cleaned up\n');
        
        console.log('🎉 All tests passed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    } finally {
        await db.close();
    }
}

// Run tests
runTests();
