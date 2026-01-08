// Test script for cadeau command logic
const { getResponse } = require('./utils/responseHelper');

console.log('=== Testing Cadeau Command Responses ===\n');

let passed = 0;
let failed = 0;

// Test 1: Success message
try {
    const successMsg = getResponse('cadeau.success');
    if (successMsg === '🎁 **Cadeau récupéré !** +25 LC\n🕒 Revenez demain pour un autre cadeau !') {
        console.log('✅ Success message is correct');
        passed++;
    } else {
        console.log('❌ Success message is incorrect');
        console.log('   Expected: 🎁 **Cadeau récupéré !** +25 LC\\n🕒 Revenez demain pour un autre cadeau !');
        console.log('   Got:', successMsg);
        failed++;
    }
} catch (error) {
    console.log('❌ Error loading success message:', error.message);
    failed++;
}

// Test 2: Cooldown message with placeholders
try {
    const cooldownMsg = getResponse('cadeau.cooldown', { hours: 5, minutes: 30 });
    if (cooldownMsg.includes('5h') && cooldownMsg.includes('30min')) {
        console.log('✅ Cooldown message with placeholders works');
        passed++;
    } else {
        console.log('❌ Cooldown message placeholders failed');
        console.log('   Got:', cooldownMsg);
        failed++;
    }
} catch (error) {
    console.log('❌ Error loading cooldown message:', error.message);
    failed++;
}

// Test 3: Error message
try {
    const errorMsg = getResponse('cadeau.error');
    if (errorMsg.includes('erreur')) {
        console.log('✅ Error message is correct');
        passed++;
    } else {
        console.log('❌ Error message is incorrect');
        console.log('   Got:', errorMsg);
        failed++;
    }
} catch (error) {
    console.log('❌ Error loading error message:', error.message);
    failed++;
}

// Test 4: Cadeau in help section
try {
    const helpLc = getResponse('help.sections.lc.commands');
    if (helpLc.includes('cadeau')) {
        console.log('✅ Cadeau command appears in help');
        passed++;
    } else {
        console.log('❌ Cadeau command missing from help');
        console.log('   Got:', helpLc);
        failed++;
    }
} catch (error) {
    console.log('❌ Error loading help section:', error.message);
    failed++;
}

// Test 5: Check cooldown calculation logic
console.log('\n=== Testing Cooldown Logic ===\n');

const currentTime = Date.now();
const lastGiftTime24HoursAgo = currentTime - (24 * 60 * 60 * 1000);
const lastGiftTime23HoursAgo = currentTime - (23 * 60 * 60 * 1000);
const lastGiftTime1HourAgo = currentTime - (1 * 60 * 60 * 1000);

const cooldownPeriod = 24 * 60 * 60 * 1000;

// Test 5a: 24 hours passed - should be 0 remaining
const timeRemaining24 = Math.max(cooldownPeriod - (currentTime - lastGiftTime24HoursAgo), 0);
if (timeRemaining24 === 0) {
    console.log('✅ Cooldown expired after 24 hours');
    passed++;
} else {
    console.log('❌ Cooldown calculation failed for 24 hours');
    console.log('   Expected: 0, Got:', timeRemaining24);
    failed++;
}

// Test 5b: 23 hours passed - should be ~1 hour remaining
const timeRemaining23 = Math.max(cooldownPeriod - (currentTime - lastGiftTime23HoursAgo), 0);
const hours23 = Math.floor(timeRemaining23 / (1000 * 60 * 60));
if (hours23 === 1) {
    console.log('✅ Cooldown shows 1 hour remaining after 23 hours');
    passed++;
} else {
    console.log('❌ Cooldown calculation failed for 23 hours');
    console.log('   Expected hours: 1, Got:', hours23);
    failed++;
}

// Test 5c: 1 hour passed - should be ~23 hours remaining
const timeRemaining1 = Math.max(cooldownPeriod - (currentTime - lastGiftTime1HourAgo), 0);
const hours1 = Math.floor(timeRemaining1 / (1000 * 60 * 60));
if (hours1 === 23) {
    console.log('✅ Cooldown shows 23 hours remaining after 1 hour');
    passed++;
} else {
    console.log('❌ Cooldown calculation failed for 1 hour');
    console.log('   Expected hours: 23, Got:', hours1);
    failed++;
}

console.log('\n=== Test Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}\n`);

if (failed === 0) {
    console.log('✅ All cadeau tests passed!\n');
    process.exit(0);
} else {
    console.log('❌ Some cadeau tests failed. Please review the errors above.\n');
    process.exit(1);
}
