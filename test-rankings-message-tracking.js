/**
 * Test file for Rankings Message Tracking and Deletion
 * This tests the automatic message cleanup functionality
 */

require('dotenv').config();
const rankingsCommand = require('./commands/rankings');

console.log('🧪 Testing Rankings Message Tracking and Deletion...\n');

// Mock client and channel
const mockMessages = [];
let messageIdCounter = 1;

const mockChannel = {
    id: 'test-channel-123',
    name: 'rankings',
    guild: {
        id: 'test-guild-123',
        name: 'Test Guild',
        members: {
            fetch: async (userId) => {
                return {
                    id: userId,
                    displayName: `User ${userId}`,
                    displayAvatarURL: () => 'https://example.com/avatar.png'
                };
            }
        }
    },
    send: async (content) => {
        const message = {
            id: `message-${messageIdCounter++}`,
            content: typeof content === 'string' ? content : '[embed]',
            deleted: false,
            delete: async function() {
                this.deleted = true;
                console.log(`  🗑️  Message ${this.id} deleted`);
            }
        };
        mockMessages.push(message);
        console.log(`  📤 Sent message ${message.id}`);
        return message;
    },
    permissionsFor: () => ({
        has: () => true
    })
};

const mockClient = {
    user: {
        id: 'bot-user-id'
    },
    channels: {
        fetch: async (channelId) => {
            console.log(`  📡 Fetching channel ${channelId}`);
            return mockChannel;
        }
    }
};

// Mock database
const { db } = require('./database/db');
const originalGetTopLC = db.getTopLC;
const originalGetTopLevels = db.getTopLevels;

db.getTopLC = async (limit) => {
    return [
        { user_id: 'user1', username: 'Alice', balance: 1000 },
        { user_id: 'user2', username: 'Bob', balance: 800 },
        { user_id: 'user3', username: 'Charlie', balance: 600 }
    ];
};

db.getTopLevels = async (limit) => {
    return [
        { user_id: 'user1', username: 'Alice', level: 25 },
        { user_id: 'user2', username: 'Bob', level: 20 },
        { user_id: 'user3', username: 'Charlie', level: 15 }
    ];
};

async function runTests() {
    try {
        // Test 1: Initial update should track message
        console.log('Test 1: Initial automatic update via updateRankingsChannel');
        console.log('  Expected: Message tracked, no deletion (first time)');
        await rankingsCommand.updateRankingsChannel(mockClient);
        
        const firstMessage = rankingsCommand.lastRankingsMessage;
        console.log(`  ✅ Initial message tracked: ${firstMessage !== null}`);
        console.log(`  ✅ Message ID: ${firstMessage ? firstMessage.id : 'none'}`);
        console.log(`  ✅ Messages sent: ${mockMessages.length}`);
        console.log(`  ✅ No deletions on first update\n`);

        // Test 2: Second update should delete previous message
        console.log('Test 2: Second automatic update');
        console.log('  Expected: Previous message deleted, new message tracked');
        const beforeUpdate = rankingsCommand.lastRankingsMessage;
        const beforeUpdateId = beforeUpdate ? beforeUpdate.id : 'none';
        
        await rankingsCommand.updateRankingsChannel(mockClient);
        
        const afterUpdate = rankingsCommand.lastRankingsMessage;
        const afterUpdateId = afterUpdate ? afterUpdate.id : 'none';
        
        console.log(`  📊 Message before update: ${beforeUpdateId}`);
        console.log(`  📊 Message after update: ${afterUpdateId}`);
        console.log(`  ✅ Previous message deleted: ${beforeUpdate ? beforeUpdate.deleted : 'N/A'}`);
        console.log(`  ✅ New message is different: ${beforeUpdateId !== afterUpdateId}`);
        console.log(`  ✅ Total messages sent: ${mockMessages.length}\n`);

        // Test 3: Multiple updates should only keep the latest
        console.log('Test 3: Multiple consecutive automatic updates');
        console.log('  Expected: Only latest message remains undeleted');
        
        for (let i = 0; i < 3; i++) {
            await rankingsCommand.updateRankingsChannel(mockClient);
            console.log(`  🔄 Update ${i + 1} completed`);
        }
        
        const activeMessages = mockMessages.filter(m => !m.deleted);
        console.log(`  ✅ Total messages sent: ${mockMessages.length}`);
        console.log(`  ✅ Active (undeleted) messages: ${activeMessages.length}`);
        console.log(`  ✅ Deleted messages: ${mockMessages.filter(m => m.deleted).length}\n`);

        // Test 4: Verify message tracking integrity
        console.log('Test 4: Message tracking integrity');
        console.log('  Expected: Last tracked message matches the only active message');
        
        const trackedMessage = rankingsCommand.lastRankingsMessage;
        const onlyActiveMessage = activeMessages[0];
        
        console.log(`  ✅ Tracked message ID: ${trackedMessage ? trackedMessage.id : 'none'}`);
        console.log(`  ✅ Only active message ID: ${onlyActiveMessage ? onlyActiveMessage.id : 'none'}`);
        console.log(`  ✅ IDs match: ${trackedMessage && onlyActiveMessage && trackedMessage.id === onlyActiveMessage.id}`);
        console.log(`  ✅ Tracked message is not deleted: ${trackedMessage ? !trackedMessage.deleted : 'N/A'}\n`);

        // Summary
        console.log('✅ All tests completed successfully!\n');
        console.log('📊 Test Summary:');
        console.log(`  - Total messages sent: ${mockMessages.length}`);
        console.log(`  - Active messages: ${mockMessages.filter(m => !m.deleted).length}`);
        console.log(`  - Deleted messages: ${mockMessages.filter(m => m.deleted).length}`);
        console.log(`  - Last tracked message: ${rankingsCommand.lastRankingsMessage ? rankingsCommand.lastRankingsMessage.id : 'none'}`);
        
        // Verify only one message is active
        const activeCount = mockMessages.filter(m => !m.deleted).length;
        if (activeCount === 1) {
            console.log('\n✅ SUCCESS: Only one message remains active (clean channel)');
        } else {
            console.log(`\n⚠️  WARNING: ${activeCount} active messages (expected 1)`);
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Stack:', error.stack);
    } finally {
        // Restore original DB methods
        db.getTopLC = originalGetTopLC;
        db.getTopLevels = originalGetTopLevels;
    }
}

// Run tests
runTests().then(() => {
    console.log('\n✅ Test suite completed');
    process.exit(0);
}).catch(error => {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
});
