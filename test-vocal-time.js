/**
 * Test for vocal time tracking functionality
 * This test validates that the voice time formatting works correctly
 */

const statsCommand = require('./commands/stats');

console.log('=== Vocal Time Tracking Test ===\n');

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

// Test 1: Zero seconds
test('Format 0 seconds as "0m"', () => {
    const result = statsCommand.formatVoiceTime(0);
    if (result !== '0m') {
        throw new Error(`Expected "0m", got "${result}"`);
    }
});

// Test 2: Less than a minute
test('Format 30 seconds as "0m"', () => {
    const result = statsCommand.formatVoiceTime(30);
    if (result !== '0m') {
        throw new Error(`Expected "0m", got "${result}"`);
    }
});

// Test 3: Exactly 1 minute
test('Format 60 seconds as "1m"', () => {
    const result = statsCommand.formatVoiceTime(60);
    if (result !== '1m') {
        throw new Error(`Expected "1m", got "${result}"`);
    }
});

// Test 4: Multiple minutes
test('Format 300 seconds (5 minutes) as "5m"', () => {
    const result = statsCommand.formatVoiceTime(300);
    if (result !== '5m') {
        throw new Error(`Expected "5m", got "${result}"`);
    }
});

// Test 5: Exactly 1 hour
test('Format 3600 seconds (1 hour) as "1h 0m"', () => {
    const result = statsCommand.formatVoiceTime(3600);
    if (result !== '1h 0m') {
        throw new Error(`Expected "1h 0m", got "${result}"`);
    }
});

// Test 6: Hours and minutes
test('Format 7800 seconds (2 hours 10 minutes) as "2h 10m"', () => {
    const result = statsCommand.formatVoiceTime(7800);
    if (result !== '2h 10m') {
        throw new Error(`Expected "2h 10m", got "${result}"`);
    }
});

// Test 7: Large value
test('Format 36000 seconds (10 hours) as "10h 0m"', () => {
    const result = statsCommand.formatVoiceTime(36000);
    if (result !== '10h 0m') {
        throw new Error(`Expected "10h 0m", got "${result}"`);
    }
});

// Test 8: 59 minutes (edge case)
test('Format 3540 seconds (59 minutes) as "59m"', () => {
    const result = statsCommand.formatVoiceTime(3540);
    if (result !== '59m') {
        throw new Error(`Expected "59m", got "${result}"`);
    }
});

// Test 9: 1 hour 1 minute
test('Format 3660 seconds (1 hour 1 minute) as "1h 1m"', () => {
    const result = statsCommand.formatVoiceTime(3660);
    if (result !== '1h 1m') {
        throw new Error(`Expected "1h 1m", got "${result}"`);
    }
});

// Test 10: Verify database helper function exists
test('Database updateVoiceTime function exists', () => {
    const { db } = require('./database/db');
    if (typeof db.updateVoiceTime !== 'function') {
        throw new Error('updateVoiceTime function not found in database module');
    }
});

// Summary
console.log('\n=== Test Summary ===');
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
console.log(`Total: ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
    console.log('\n✅ All vocal time tracking tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed. Please review the errors above.');
    process.exit(1);
}
