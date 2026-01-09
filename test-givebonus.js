// Test to validate givebonus command logic using actual implementation
console.log('🧪 Testing !givebonus command logic...\n');

// Import the actual item type map from the implementation
const { ITEM_TYPE_MAP } = require('./utils/inventoryItems');

const testCases = [
    { input: 'jackpot', expected: 'jackpot' },
    { input: 'x2', expected: 'multiplier_x2' },
    { input: 'x3', expected: 'multiplier_x3' },
    { input: 'multiplieur_x2', expected: 'multiplier_x2' },
    { input: 'multiplieur_x3', expected: 'multiplier_x3' },
    { input: 'invalid', expected: undefined }
];

let passedTests = 0;
let failedTests = 0;

console.log('Testing item type mapping:');
for (const testCase of testCases) {
    const result = ITEM_TYPE_MAP[testCase.input];
    const passed = result === testCase.expected;
    
    if (passed) {
        console.log(`✅ "${testCase.input}" -> "${result}"`);
        passedTests++;
    } else {
        console.log(`❌ "${testCase.input}" -> Expected: "${testCase.expected}", Got: "${result}"`);
        failedTests++;
    }
}

console.log('\n=== Test Summary ===');
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);

if (failedTests === 0) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
} else {
    console.log('\n⚠️ Some tests failed!');
    process.exit(1);
}
