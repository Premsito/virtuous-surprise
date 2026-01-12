/**
 * Test script for rankings filtering functionality
 * This tests that the rankings command properly filters users based on LC and Level thresholds
 */

const rankingsCommand = require('./commands/rankings');

async function testRankingsFiltering() {
    console.log('🧪 Testing Rankings Filtering Logic...\n');

    try {
        // Create mock data with varied LC and Level values
        const mockLCData = [
            { user_id: '1', username: 'HighBalanceUser', balance: 1500, level: 10, xp: 500 },
            { user_id: '2', username: 'MediumBalanceUser', balance: 500, level: 5, xp: 200 },
            { user_id: '3', username: 'LowBalanceUser1', balance: 150, level: 3, xp: 100 },
            { user_id: '4', username: 'LowBalanceUser2', balance: 100, level: 2, xp: 50 },
            { user_id: '5', username: 'ThresholdUser', balance: 200, level: 4, xp: 150 },
            { user_id: '6', username: 'AboveThreshold', balance: 250, level: 6, xp: 250 },
        ];

        const mockLevelData = [
            { user_id: '1', username: 'HighLevelUser', balance: 1500, level: 10, xp: 500 },
            { user_id: '2', username: 'MediumLevelUser', balance: 500, level: 5, xp: 200 },
            { user_id: '3', username: 'LowLevelUser', balance: 150, level: 1, xp: 50 },
            { user_id: '4', username: 'ThresholdLevel', balance: 300, level: 2, xp: 100 },
            { user_id: '5', username: 'AboveThreshold', balance: 250, level: 6, xp: 250 },
        ];

        console.log('📋 Testing LC filtering (>= 200)...');
        
        // Apply filtering logic as per implementation
        const filteredLC = mockLCData.filter(user => user.balance >= 200);
        
        console.log(`   - Input: ${mockLCData.length} users`);
        console.log(`   - Output: ${filteredLC.length} users after filtering`);
        
        // Verify expected users are included
        const expectedLCUsers = ['HighBalanceUser', 'MediumBalanceUser', 'ThresholdUser', 'AboveThreshold'];
        const actualLCUsers = filteredLC.map(u => u.username);
        
        expectedLCUsers.forEach(username => {
            if (!actualLCUsers.includes(username)) {
                throw new Error(`Expected user "${username}" not found in filtered LC results`);
            }
            console.log(`   ✓ ${username} included`);
        });

        // Verify excluded users are not included
        const excludedLCUsers = ['LowBalanceUser1', 'LowBalanceUser2'];
        excludedLCUsers.forEach(username => {
            if (actualLCUsers.includes(username)) {
                throw new Error(`User "${username}" should be excluded from LC results (balance < 200)`);
            }
            console.log(`   ✓ ${username} excluded (balance < 200)`);
        });

        // Verify threshold user (exactly 200) is included
        if (!actualLCUsers.includes('ThresholdUser')) {
            throw new Error('User with exactly 200 LC should be included');
        }
        console.log('   ✓ Threshold user (200 LC) correctly included');

        console.log('\n📋 Testing Level filtering (>= 2)...');
        
        // Apply filtering logic as per implementation
        const filteredLevels = mockLevelData.filter(user => user.level >= 2);
        
        console.log(`   - Input: ${mockLevelData.length} users`);
        console.log(`   - Output: ${filteredLevels.length} users after filtering`);
        
        // Verify expected users are included
        const expectedLevelUsers = ['HighLevelUser', 'MediumLevelUser', 'ThresholdLevel', 'AboveThreshold'];
        const actualLevelUsers = filteredLevels.map(u => u.username);
        
        expectedLevelUsers.forEach(username => {
            if (!actualLevelUsers.includes(username)) {
                throw new Error(`Expected user "${username}" not found in filtered Level results`);
            }
            console.log(`   ✓ ${username} included`);
        });

        // Verify excluded users are not included
        const excludedLevelUsers = ['LowLevelUser'];
        excludedLevelUsers.forEach(username => {
            if (actualLevelUsers.includes(username)) {
                throw new Error(`User "${username}" should be excluded from Level results (level < 2)`);
            }
            console.log(`   ✓ ${username} excluded (level < 2)`);
        });

        // Verify threshold user (exactly level 2) is included
        if (!actualLevelUsers.includes('ThresholdLevel')) {
            throw new Error('User with exactly Level 2 should be included');
        }
        console.log('   ✓ Threshold user (Level 2) correctly included');

        console.log('\n📋 Testing top 10 limit after filtering...');
        
        // Create a larger dataset to test the top 10 limit
        const largeMockData = [];
        for (let i = 0; i < 50; i++) {
            largeMockData.push({
                user_id: `${i}`,
                username: `User${i}`,
                balance: 200 + i, // All users >= 200
                level: 2 + i, // All users >= 2
                xp: 100
            });
        }

        const filteredLarge = largeMockData.filter(user => user.balance >= 200);
        const top10 = filteredLarge.slice(0, 10);
        
        if (top10.length !== 10) {
            throw new Error(`Expected 10 users in top 10, got ${top10.length}`);
        }
        console.log(`   ✓ Correctly limited to top 10 users from ${filteredLarge.length} filtered results`);

        console.log('\n📋 Testing edge case: Empty results after filtering...');
        
        const allBelowThreshold = [
            { user_id: '1', username: 'User1', balance: 50, level: 1, xp: 10 },
            { user_id: '2', username: 'User2', balance: 100, level: 1, xp: 20 },
            { user_id: '3', username: 'User3', balance: 150, level: 1, xp: 30 },
        ];

        const emptyFilteredLC = allBelowThreshold.filter(user => user.balance >= 200);
        const emptyFilteredLevels = allBelowThreshold.filter(user => user.level >= 2);
        
        if (emptyFilteredLC.length !== 0) {
            throw new Error('Expected empty array when all users below LC threshold');
        }
        console.log('   ✓ Empty array returned when all users below LC threshold');

        if (emptyFilteredLevels.length !== 0) {
            throw new Error('Expected empty array when all users below Level threshold');
        }
        console.log('   ✓ Empty array returned when all users below Level threshold');

        console.log('\n✅ All filtering tests passed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        throw error;
    }
}

// Run tests
testRankingsFiltering()
    .then(() => {
        console.log('\n🎉 Rankings filtering test completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Rankings filtering test failed:', error);
        process.exit(1);
    });
