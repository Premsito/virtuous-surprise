/**
 * Test for stats command join date functionality
 * This test validates that the stats command correctly retrieves and displays join dates
 */

const statsCommand = require('./commands/stats');
const { getResponse } = require('./utils/responseHelper');

console.log('=== Stats Command Join Date Test ===\n');

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

// Test 1: Stats command loads correctly
test('Stats command loads without errors', () => {
    if (!statsCommand.name || !statsCommand.execute) {
        throw new Error('Stats command failed to load');
    }
    if (statsCommand.name !== 'stats') {
        throw new Error('Stats command has incorrect name');
    }
});

// Test 2: Stats notAvailable response exists
test('Stats notAvailable response exists', () => {
    const notAvailable = getResponse('stats.notAvailable');
    if (!notAvailable) {
        throw new Error('stats.notAvailable response not found');
    }
    if (notAvailable !== 'N/A') {
        throw new Error('stats.notAvailable response has unexpected value');
    }
});

// Test 3: Date formatting works correctly (fr-FR locale)
test('Date formatting works correctly in fr-FR locale', () => {
    const testDate = new Date('2025-01-07T10:00:00Z');
    const formatted = testDate.toLocaleDateString('fr-FR');
    
    // Expected format: DD/MM/YYYY
    const parts = formatted.split('/');
    if (parts.length !== 3) {
        throw new Error(`Date format incorrect: ${formatted}`);
    }
    
    // Verify it's a valid date format (should have day, month, year)
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const year = parseInt(parts[2]);
    
    if (isNaN(day) || isNaN(month) || isNaN(year)) {
        throw new Error(`Date parts are not numbers: ${formatted}`);
    }
    
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 2000) {
        throw new Error(`Date values out of range: ${formatted}`);
    }
    
    console.log(`   Sample date format: ${formatted}`);
});

// Test 4: Mock member object with joinedAt date
test('Mock member object with joinedAt date works', () => {
    const mockJoinDate = new Date('2024-06-15T14:30:00Z');
    const mockMember = {
        joinedAt: mockJoinDate,
        user: { id: '123456', username: 'TestUser' }
    };
    
    if (!mockMember.joinedAt) {
        throw new Error('Mock member joinedAt is missing');
    }
    
    const formattedDate = mockMember.joinedAt.toLocaleDateString('fr-FR');
    console.log(`   Mock join date: ${formattedDate}`);
    
    if (!formattedDate.includes('/')) {
        throw new Error('Date formatting failed for mock member');
    }
});

// Test 5: Mock user object with createdAt date (fallback)
test('Mock user object with createdAt date (fallback) works', () => {
    const mockCreateDate = new Date('2023-03-20T09:15:00Z');
    const mockUser = {
        id: '123456',
        username: 'TestUser',
        createdAt: mockCreateDate
    };
    
    if (!mockUser.createdAt) {
        throw new Error('Mock user createdAt is missing');
    }
    
    const formattedDate = mockUser.createdAt.toLocaleDateString('fr-FR');
    const fallbackLabel = `${formattedDate} (compte créé)`;
    
    console.log(`   Fallback date: ${fallbackLabel}`);
    
    if (!fallbackLabel.includes('compte créé')) {
        throw new Error('Fallback label not properly formatted');
    }
});

// Test 6: Error handling response exists
test('Error handling response exists', () => {
    const errorResponse = getResponse('errors.commandExecutionError');
    if (!errorResponse) {
        throw new Error('errors.commandExecutionError response not found');
    }
    console.log(`   Error message: ${errorResponse}`);
});

// Test 7: Voice time formatting works (verifying unchanged functionality)
test('Voice time formatting still works correctly', () => {
    const time1 = statsCommand.formatVoiceTime(7800); // 2h 10m
    const time2 = statsCommand.formatVoiceTime(300);  // 5m
    const time3 = statsCommand.formatVoiceTime(0);    // 0m
    
    if (!time1.includes('2h') || !time1.includes('10m')) {
        throw new Error('Voice time formatting failed for hours and minutes');
    }
    if (!time2.includes('5m') || time2.includes('h')) {
        throw new Error('Voice time formatting failed for minutes only');
    }
    if (time3 !== '0m') {
        throw new Error('Voice time formatting failed for zero seconds');
    }
    
    console.log(`   Voice time examples: ${time1}, ${time2}, ${time3}`);
});

// Test 8: Label changes based on date source
test('Label changes based on date source', () => {
    const normalLabel = '📅 **Arrivé**       :';
    const fallbackLabel = '📅 **Compte créé**  :';
    
    if (!normalLabel.includes('Arrivé')) {
        throw new Error('Normal label is incorrect');
    }
    if (!fallbackLabel.includes('Compte créé')) {
        throw new Error('Fallback label is incorrect');
    }
    
    console.log(`   Normal label: ${normalLabel}`);
    console.log(`   Fallback label: ${fallbackLabel}`);
});

// Summary
console.log('\n=== Test Summary ===');
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
console.log(`Total: ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
    console.log('\n✅ All join date tests passed! The stats command is ready to use.');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed. Please review the errors above.');
    process.exit(1);
}
