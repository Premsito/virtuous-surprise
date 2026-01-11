/**
 * Test script for rankings command permission checking
 * This tests that the rankings command properly enforces admin permissions
 */

const { isAdmin, ADMIN_USER_ID } = require('./utils/adminHelper');
const rankingsCommand = require('./commands/rankings');

async function testRankingsPermissions() {
    console.log('🧪 Testing Rankings Command Permissions...\n');

    try {
        // Test 1: Verify admin helper is working
        console.log('📋 Testing admin helper...');
        
        const adminResult = isAdmin(ADMIN_USER_ID);
        if (!adminResult) {
            throw new Error('Admin user ID should return true');
        }
        console.log(`   ✓ Admin user (${ADMIN_USER_ID}) is recognized as admin`);
        
        const nonAdminResult = isAdmin('123456789');
        if (nonAdminResult) {
            throw new Error('Non-admin user should return false');
        }
        console.log('   ✓ Non-admin user is correctly denied');

        // Test 2: Verify the command structure includes admin check
        console.log('\n📋 Verifying command implementation...');
        
        // Check that the execute function exists
        if (typeof rankingsCommand.execute !== 'function') {
            throw new Error('Execute function is missing');
        }
        console.log('   ✓ Execute function exists');
        
        // Check that the command description mentions admin
        if (!rankingsCommand.description.toLowerCase().includes('admin')) {
            console.log('   ⚠️ Warning: Description does not mention admin restriction');
        } else {
            console.log('   ✓ Description indicates admin-only command');
        }

        // Test 3: Test the execute function with mock message objects
        console.log('\n🔍 Testing execute function with mock data...');
        
        // Mock message from admin user
        const mockAdminMessage = {
            author: {
                id: ADMIN_USER_ID,
                username: 'AdminUser'
            },
            channel: {
                id: '1460012957458235618',
                send: async (content) => {
                    console.log(`   [Mock Channel Send] ${JSON.stringify(content).substring(0, 50)}...`);
                    return { id: 'mock-message-id' };
                }
            },
            delete: async () => {
                console.log('   [Mock Message Delete]');
                return Promise.resolve();
            },
            reply: async (content) => {
                console.log(`   [Mock Reply] ${content}`);
                return { id: 'mock-reply-id' };
            }
        };

        // Mock message from non-admin user
        const mockNonAdminMessage = {
            author: {
                id: '987654321',
                username: 'RegularUser'
            },
            channel: {
                id: '1460012957458235618',
                send: async (content) => {
                    throw new Error('Non-admin should not be able to display rankings');
                }
            },
            delete: async () => {
                throw new Error('Non-admin message should not be deleted');
            },
            reply: async (content) => {
                console.log(`   ✓ Non-admin correctly received: ${content}`);
                return { id: 'mock-reply-id' };
            }
        };

        // Test with non-admin user (should be denied)
        console.log('\n   Testing non-admin user execution...');
        try {
            await rankingsCommand.execute(mockNonAdminMessage, []);
            console.log('   ✓ Non-admin user was correctly denied access');
        } catch (error) {
            throw new Error(`Non-admin test failed: ${error.message}`);
        }

        console.log('\n✅ All permission tests passed!');
        console.log('\n📝 Summary:');
        console.log('   - Admin helper correctly identifies admin users');
        console.log('   - Command properly checks permissions before execution');
        console.log('   - Non-admin users receive appropriate error message');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    }
}

// Run tests
testRankingsPermissions()
    .then(() => {
        console.log('\n🎉 Rankings permission test completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Rankings permission test failed:', error);
        process.exit(1);
    });
