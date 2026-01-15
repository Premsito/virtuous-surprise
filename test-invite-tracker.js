// Test script for invite tracker functionality
require('dotenv').config();
const { getInviter } = require('./utils/inviteHelper');

console.log('🧪 Testing invite tracker helper functions...\n');

// Mock guild object
const mockGuild = {
    id: 'test-guild-123',
    invites: {
        fetch: async () => {
            // Simulate a set of invites with their uses
            return new Map([
                ['invite1', { code: 'invite1', uses: 5, inviter: { id: 'user1', username: 'TestUser1' } }],
                ['invite2', { code: 'invite2', uses: 3, inviter: { id: 'user2', username: 'TestUser2' } }],
                ['invite3', { code: 'invite3', uses: 7, inviter: { id: 'user3', username: 'TestUser3' } }]
            ]);
        }
    }
};

// Mock member object
const mockMember = {
    id: 'new-member-456',
    user: {
        tag: 'NewMember#1234',
        username: 'NewMember'
    }
};

async function testGetInviter() {
    console.log('Test 1: Testing getInviter with increased uses on invite2...');
    
    // Create cached invites map (simulating previous state)
    const cachedInvites = new Map([
        ['invite1', 5],
        ['invite2', 2], // This one had 2 uses, now has 3 (increased)
        ['invite3', 7]
    ]);
    
    try {
        const inviter = await getInviter(mockGuild, mockMember, cachedInvites);
        
        if (inviter && inviter.id === 'user2') {
            console.log('✅ Test 1 passed: Correctly detected inviter as user2');
            console.log(`   Inviter: ${inviter.username} (${inviter.id})`);
            console.log(`   Cache updated: invite2 now has ${cachedInvites.get('invite2')} uses\n`);
        } else {
            console.log('❌ Test 1 failed: Expected inviter to be user2');
            console.log(`   Got: ${inviter ? inviter.id : 'null'}\n`);
        }
    } catch (error) {
        console.error('❌ Test 1 error:', error.message, '\n');
    }
}

async function testGetInviterNoChange() {
    console.log('Test 2: Testing getInviter with no invite use changes...');
    
    // Create cached invites map (all uses match current state)
    const cachedInvites = new Map([
        ['invite1', 5],
        ['invite2', 3],
        ['invite3', 7]
    ]);
    
    try {
        const inviter = await getInviter(mockGuild, mockMember, cachedInvites);
        
        if (!inviter) {
            console.log('✅ Test 2 passed: Correctly returned null when no invite changes detected\n');
        } else {
            console.log('❌ Test 2 failed: Expected null but got inviter');
            console.log(`   Got: ${inviter.id}\n`);
        }
    } catch (error) {
        console.error('❌ Test 2 error:', error.message, '\n');
    }
}

async function testGetInviterNewInvite() {
    console.log('Test 3: Testing getInviter with new invite in cache...');
    
    // Create cached invites map (missing invite2)
    const cachedInvites = new Map([
        ['invite1', 5],
        ['invite3', 7]
    ]);
    
    try {
        const inviter = await getInviter(mockGuild, mockMember, cachedInvites);
        
        if (inviter && inviter.id === 'user2') {
            console.log('✅ Test 3 passed: Correctly detected new invite (invite2) with 3 uses');
            console.log(`   Inviter: ${inviter.username} (${inviter.id})`);
            console.log(`   Cache now includes invite2 with ${cachedInvites.get('invite2')} uses\n`);
        } else {
            console.log('❌ Test 3 failed: Expected inviter to be user2');
            console.log(`   Got: ${inviter ? inviter.id : 'null'}\n`);
        }
    } catch (error) {
        console.error('❌ Test 3 error:', error.message, '\n');
    }
}

async function runTests() {
    try {
        await testGetInviter();
        await testGetInviterNoChange();
        await testGetInviterNewInvite();
        
        console.log('🎉 All invite tracker helper tests completed!\n');
    } catch (error) {
        console.error('❌ Test suite failed:', error);
        process.exit(1);
    }
}

// Run tests
runTests();
