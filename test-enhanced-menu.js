/**
 * Test for enhanced menu functionality with LC, Loto, and Stats submenus
 * This script validates the new menu structure and interactions
 */

console.log('🧪 Testing enhanced menu functionality...\n');

// Load responses helper without loading the menu module
const { getResponse } = require('./utils/responseHelper');

// Test 1: Verify responses.json has all required menu entries
console.log('Test 1: Checking responses.json for new menu entries');
try {
    // Test LC submenu entries
    const lcTitle = getResponse('menu.submenu.lc.title');
    const lcDescription = getResponse('menu.submenu.lc.description');
    const lcBalance = getResponse('menu.submenu.lc.balance.info');
    const lcBalanceOther = getResponse('menu.submenu.lc.balance_other.info');
    const lcTransfer = getResponse('menu.submenu.lc.transfer.info');
    
    console.log('  ✓ LC menu entries found:');
    console.log(`    - Title: ${lcTitle}`);
    console.log(`    - Description: ${lcDescription}`);
    console.log(`    - Balance option: ${lcBalance.substring(0, 30)}...`);
    console.log(`    - Balance (other) option: ${lcBalanceOther.substring(0, 30)}...`);
    console.log(`    - Transfer option: ${lcTransfer.substring(0, 30)}...`);
    
    // Test Loto submenu entries
    const lotoTitle = getResponse('menu.submenu.loto.title');
    const lotoDescription = getResponse('menu.submenu.loto.description');
    const lotoAcheter = getResponse('menu.submenu.loto.acheter.info');
    const lotoVoir = getResponse('menu.submenu.loto.voir.info');
    const lotoJackpot = getResponse('menu.submenu.loto.jackpot.info');
    
    console.log('  ✓ Loto menu entries found:');
    console.log(`    - Title: ${lotoTitle}`);
    console.log(`    - Description: ${lotoDescription}`);
    console.log(`    - Acheter option: ${lotoAcheter.substring(0, 30)}...`);
    console.log(`    - Voir option: ${lotoVoir.substring(0, 30)}...`);
    console.log(`    - Jackpot option: ${lotoJackpot.substring(0, 30)}...`);
    
    // Test Stats submenu entries
    const statsTitle = getResponse('menu.submenu.statistiques.title');
    const statsDescription = getResponse('menu.submenu.statistiques.description');
    const statsOwn = getResponse('menu.submenu.statistiques.own.info');
    const statsOther = getResponse('menu.submenu.statistiques.other.info');
    
    console.log('  ✓ Stats menu entries found:');
    console.log(`    - Title: ${statsTitle}`);
    console.log(`    - Description: ${statsDescription}`);
    console.log(`    - Own stats option: ${statsOwn.substring(0, 30)}...`);
    console.log(`    - Other stats option: ${statsOther.substring(0, 30)}...`);
    
    console.log('\n✅ Test 1 passed: All responses found\n');
} catch (error) {
    console.error('❌ Test 1 failed:', error.message);
    process.exit(1);
}

// Test 2: Verify menu.js syntax and structure
console.log('Test 2: Verifying menu.js structure');
try {
    const fs = require('fs');
    const menuContent = fs.readFileSync('./commands/menu.js', 'utf8');
    
    // Check for new menu options
    const hasLCOption = menuContent.includes("value: 'lc'");
    const hasLotoOption = menuContent.includes("value: 'loto'");
    
    // Check for new handler functions
    const hasHandleLC = menuContent.includes('async function handleLC(');
    const hasHandleLoto = menuContent.includes('async function handleLoto(');
    const hasHandleLCInteraction = menuContent.includes('async function handleLCInteraction(');
    const hasHandleLotoInteraction = menuContent.includes('async function handleLotoInteraction(');
    const hasHandleStatistiquesInteraction = menuContent.includes('async function handleStatistiquesInteraction(');
    
    // Check for case statements
    const hasCaseLCRoute = menuContent.includes("case 'lc':");
    const hasCaseLotoRoute = menuContent.includes("case 'loto':");
    
    console.log('  Menu structure checks:');
    console.log(`    ✓ LC menu option: ${hasLCOption ? 'Found' : 'Missing'}`);
    console.log(`    ✓ Loto menu option: ${hasLotoOption ? 'Found' : 'Missing'}`);
    console.log(`    ✓ handleLC function: ${hasHandleLC ? 'Found' : 'Missing'}`);
    console.log(`    ✓ handleLoto function: ${hasHandleLoto ? 'Found' : 'Missing'}`);
    console.log(`    ✓ handleLCInteraction function: ${hasHandleLCInteraction ? 'Found' : 'Missing'}`);
    console.log(`    ✓ handleLotoInteraction function: ${hasHandleLotoInteraction ? 'Found' : 'Missing'}`);
    console.log(`    ✓ handleStatistiquesInteraction function: ${hasHandleStatistiquesInteraction ? 'Found' : 'Missing'}`);
    console.log(`    ✓ LC routing case: ${hasCaseLCRoute ? 'Found' : 'Missing'}`);
    console.log(`    ✓ Loto routing case: ${hasCaseLotoRoute ? 'Found' : 'Missing'}`);
    
    if (hasLCOption && hasLotoOption && hasHandleLC && hasHandleLoto && 
        hasHandleLCInteraction && hasHandleLotoInteraction && hasHandleStatistiquesInteraction &&
        hasCaseLCRoute && hasCaseLotoRoute) {
        console.log('\n✅ Test 2 passed: All menu components found\n');
    } else {
        throw new Error('Some menu components are missing');
    }
} catch (error) {
    console.error('❌ Test 2 failed:', error.message);
    process.exit(1);
}

// Test 3: Verify interaction flow structure
console.log('Test 3: Verifying menu interaction flow');
try {
    const fs = require('fs');
    const menuContent = fs.readFileSync('./commands/menu.js', 'utf8');
    
    // Check for proper interaction handling patterns
    const hasDeletePattern = (menuContent.match(/await interaction\.message\.delete\(\)/g) || []).length;
    const hasDeferUpdatePattern = (menuContent.match(/await interaction\.deferUpdate\(\)/g) || []).length;
    const hasFollowUpPattern = (menuContent.match(/await interaction\.followUp\(/g) || []).length;
    const hasCollectorAttachment = (menuContent.match(/attachMenuCollector\(/g) || []).length;
    
    console.log('  Interaction flow checks:');
    console.log(`    ✓ Message delete calls: ${hasDeletePattern} (expected: multiple)`);
    console.log(`    ✓ Defer update calls: ${hasDeferUpdatePattern} (expected: multiple)`);
    console.log(`    ✓ Follow-up calls: ${hasFollowUpPattern} (expected: multiple)`);
    console.log(`    ✓ Collector attachments: ${hasCollectorAttachment} (expected: multiple)`);
    
    if (hasDeletePattern >= 10 && hasDeferUpdatePattern >= 10 && 
        hasFollowUpPattern >= 5 && hasCollectorAttachment >= 5) {
        console.log('\n✅ Test 3 passed: Interaction flow properly implemented\n');
    } else {
        throw new Error('Interaction flow patterns incomplete');
    }
} catch (error) {
    console.error('❌ Test 3 failed:', error.message);
    process.exit(1);
}

// Test 4: Verify error handling
console.log('Test 4: Verifying error handling');
try {
    const fs = require('fs');
    const menuContent = fs.readFileSync('./commands/menu.js', 'utf8');
    
    // Check for error handling in delete operations
    const hasTryCatchBlocks = (menuContent.match(/try \{[\s\S]*?await interaction\.message\.delete\(\);[\s\S]*?\} catch/g) || []).length;
    const hasErrorLogging = menuContent.includes("console.error('Failed to delete menu message:'");
    
    console.log('  Error handling checks:');
    console.log(`    ✓ Try-catch blocks for delete: ${hasTryCatchBlocks} (expected: multiple)`);
    console.log(`    ✓ Error logging: ${hasErrorLogging ? 'Found' : 'Missing'}`);
    
    if (hasTryCatchBlocks >= 5 && hasErrorLogging) {
        console.log('\n✅ Test 4 passed: Error handling properly implemented\n');
    } else {
        throw new Error('Error handling incomplete');
    }
} catch (error) {
    console.error('❌ Test 4 failed:', error.message);
    process.exit(1);
}

console.log('╔════════════════════════════════════════════════════╗');
console.log('║  🎉 All tests passed successfully!                ║');
console.log('║                                                    ║');
console.log('║  ✓ New menu categories (LC, Loto) added          ║');
console.log('║  ✓ Dynamic submenus implemented                   ║');
console.log('║  ✓ Stats menu updated with submenu                ║');
console.log('║  ✓ Proper interaction flow maintained             ║');
console.log('║  ✓ Error handling in place                        ║');
console.log('║  ✓ Menu cleanup after interaction                 ║');
console.log('╚════════════════════════════════════════════════════╝');

process.exit(0);
