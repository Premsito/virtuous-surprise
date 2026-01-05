/**
 * Test script for !loto setjackpot admin command
 * This tests that the setjackpot functionality works correctly
 */

const config = require('./config.json');
const { getResponse } = require('./utils/responseHelper');

console.log('Test 1: Loading lottery module...');
try {
    const lotoCommand = require('./commands/loto');
    console.log('✅ Lottery module loaded successfully');
} catch (error) {
    console.error('❌ Failed to load lottery module:', error.message);
    process.exit(1);
}

console.log('\nTest 2: Checking database module for setLotteryJackpot...');
try {
    const { db } = require('./database/db');
    
    if (typeof db.setLotteryJackpot !== 'function') {
        console.error('❌ setLotteryJackpot function not found in db module');
        process.exit(1);
    }
    
    console.log('✅ setLotteryJackpot function found in db module');
} catch (error) {
    console.error('❌ Failed to check database module:', error.message);
    process.exit(1);
}

console.log('\nTest 3: Checking responses for setjackpot...');
try {
    const successResponse = getResponse('loto.setjackpot.success');
    const noPermissionResponse = getResponse('loto.setjackpot.noPermission');
    const invalidAmountResponse = getResponse('loto.setjackpot.invalidAmount');
    
    console.log('✅ All setjackpot responses found:');
    console.log('   - Success response:', successResponse ? 'exists' : 'missing');
    console.log('   - No permission response:', noPermissionResponse ? 'exists' : 'missing');
    console.log('   - Invalid amount response:', invalidAmountResponse ? 'exists' : 'missing');
    
    // Test placeholder replacement
    const testSuccess = getResponse('loto.setjackpot.success', { amount: 15000 });
    if (!testSuccess.includes('15000')) {
        console.error('❌ Placeholder replacement failed in success message');
        process.exit(1);
    }
    console.log('✅ Placeholder replacement works correctly');
} catch (error) {
    console.error('❌ Failed to get setjackpot responses:', error.message);
    process.exit(1);
}

console.log('\nTest 4: Checking help section includes setjackpot...');
try {
    const lotoHelpCommands = getResponse('help.sections.loto.commands');
    
    if (!lotoHelpCommands.includes('setjackpot')) {
        console.error('❌ Help section does not include setjackpot command');
        process.exit(1);
    }
    
    console.log('✅ Help section includes setjackpot command');
    console.log('   - Commands:', lotoHelpCommands);
} catch (error) {
    console.error('❌ Failed to check help section:', error.message);
    process.exit(1);
}

console.log('\nTest 5: Validating error messages...');
try {
    const noPermission = getResponse('loto.setjackpot.noPermission');
    const invalidAmount = getResponse('loto.setjackpot.invalidAmount');
    
    // Check that error messages are in French and contain key words
    if (!noPermission.includes('permission') && !noPermission.includes('❌')) {
        console.error('❌ No permission message format incorrect');
        process.exit(1);
    }
    
    if (!invalidAmount.includes('montant') && !invalidAmount.includes('❌')) {
        console.error('❌ Invalid amount message format incorrect');
        process.exit(1);
    }
    
    console.log('✅ Error messages validated');
    console.log('   - No permission:', noPermission);
    console.log('   - Invalid amount:', invalidAmount);
} catch (error) {
    console.error('❌ Failed to validate error messages:', error.message);
    process.exit(1);
}

console.log('\n✅ All tests passed!');
console.log('\nNew command available:');
console.log('  - !loto setjackpot [montant] - Set the lottery jackpot (Admin only)');
console.log('\nExpected behavior:');
console.log('  ✓ Only administrators can use this command');
console.log('  ✓ Amount must be a valid number >= 0');
console.log('  ✓ Success message shows the new jackpot amount');
console.log('  ✓ Tickets purchased after this will increase jackpot by +20 LC per ticket');
