/**
 * Test script for lottery commands
 * This tests that the lottery module loads correctly and has the expected structure
 */

const config = require('./config.json');
const { getResponse } = require('./utils/responseHelper');

// Test 1: Load lottery module
console.log('Test 1: Loading lottery module...');
try {
    const lotoCommand = require('./commands/loto');
    console.log('✅ Lottery module loaded successfully');
    console.log('   - Name:', lotoCommand.name);
    console.log('   - Has execute method:', typeof lotoCommand.execute === 'function');
    console.log('   - Has performDraw method:', typeof lotoCommand.performDraw === 'function');
    console.log('   - Has checkDrawTime method:', typeof lotoCommand.checkDrawTime === 'function');
    console.log('   - Has getNextDrawTime method:', typeof lotoCommand.getNextDrawTime === 'function');
} catch (error) {
    console.error('❌ Failed to load lottery module:', error.message);
    process.exit(1);
}

// Test 2: Check config.json has lottery config
console.log('\nTest 2: Checking config.json...');
if (!config.games.loto) {
    console.error('❌ Missing config for loto');
    process.exit(1);
}

const requiredConfigs = ['ticketPrice', 'baseJackpot', 'ticketIncrement', 'drawDay', 'drawHour', 'drawMinute', 'suspenseDelay'];
let configValid = true;

for (const cfg of requiredConfigs) {
    if (config.games.loto[cfg] === undefined) {
        console.error(`❌ Missing config: loto.${cfg}`);
        configValid = false;
    }
}

if (!configValid) {
    console.error('❌ Config validation failed');
    process.exit(1);
}

console.log('✅ Lottery config found:');
console.log('   - Ticket Price:', config.games.loto.ticketPrice, 'LC');
console.log('   - Base Jackpot:', config.games.loto.baseJackpot, 'LC');
console.log('   - Ticket Increment:', config.games.loto.ticketIncrement, 'LC');
console.log('   - Draw Day:', config.games.loto.drawDay, '(0 = Sunday)');
console.log('   - Draw Time:', `${config.games.loto.drawHour}:${String(config.games.loto.drawMinute).padStart(2, '0')}`);

// Test 3: Check responses.json has lottery section
console.log('\nTest 3: Checking responses.json...');
try {
    // Check purchase responses
    const purchaseInvalidAmount = getResponse('loto.purchase.invalidAmount');
    const purchaseInsufficientBalance = getResponse('loto.purchase.insufficientBalance');
    const purchaseSuccess = getResponse('loto.purchase.success');
    console.log('✅ Purchase responses found');
    
    // Check view responses
    const viewTitle = getResponse('loto.view.title');
    const viewNoTickets = getResponse('loto.view.noTickets');
    const viewDescription = getResponse('loto.view.description');
    console.log('✅ View responses found');
    
    // Check jackpot responses
    const jackpotTitle = getResponse('loto.jackpot.title');
    const jackpotDescription = getResponse('loto.jackpot.description');
    console.log('✅ Jackpot responses found');
    
    // Check draw responses
    const responses = require('./responses.json');
    const drawSuspense = responses.loto.draw.suspense;
    const drawResultTitle = getResponse('loto.draw.result.title');
    console.log('✅ Draw responses found');
    console.log('   - Number of suspense messages:', drawSuspense.length);
    
    // Check general responses
    const invalidCommand = getResponse('loto.invalidCommand');
    const error = getResponse('loto.error');
    console.log('✅ General lottery responses found');
} catch (error) {
    console.error('❌ Failed to get lottery responses:', error.message);
    process.exit(1);
}

// Test 4: Check help section includes lottery
console.log('\nTest 4: Checking help section...');
try {
    const lotoHelpTitle = getResponse('help.sections.loto.title');
    const lotoHelpCommands = getResponse('help.sections.loto.commands');
    console.log('✅ Lottery help section found:');
    console.log('   - Title:', lotoHelpTitle);
    console.log('   - Commands:', lotoHelpCommands);
} catch (error) {
    console.error('❌ Failed to get lottery help:', error.message);
    process.exit(1);
}

// Test 5: Test getNextDrawTime function
console.log('\nTest 5: Testing getNextDrawTime function...');
try {
    const lotoCommand = require('./commands/loto');
    const nextDrawTime = lotoCommand.getNextDrawTime();
    const now = new Date();
    
    console.log('✅ Next draw time calculated:');
    console.log('   - Current time:', now.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }));
    console.log('   - Next draw:', nextDrawTime.toLocaleString('fr-FR', { timeZone: 'Europe/Paris' }));
    console.log('   - Day of week:', nextDrawTime.getDay(), '(should be 0 for Sunday)');
    console.log('   - Hour:', nextDrawTime.getHours(), '(should be', config.games.loto.drawHour + ')');
    console.log('   - Is in future:', nextDrawTime > now);
    
    if (nextDrawTime <= now) {
        console.error('❌ Next draw time is not in the future!');
        process.exit(1);
    }
    
    if (nextDrawTime.getDay() !== config.games.loto.drawDay) {
        console.error('❌ Next draw is not on the configured day!');
        process.exit(1);
    }
    
    if (nextDrawTime.getHours() !== config.games.loto.drawHour) {
        console.error('❌ Next draw is not at the configured hour!');
        process.exit(1);
    }
} catch (error) {
    console.error('❌ Failed to test getNextDrawTime:', error.message);
    process.exit(1);
}

// Test 6: Check database migration exists
console.log('\nTest 6: Checking database migration...');
const fs = require('fs');
const path = require('path');

try {
    const migrationPath = path.join(__dirname, 'database', 'migrations', '005_add_lottery_tables.sql');
    if (!fs.existsSync(migrationPath)) {
        console.error('❌ Lottery migration file not found');
        process.exit(1);
    }
    
    const migrationContent = fs.readFileSync(migrationPath, 'utf-8');
    const requiredTables = ['lottery_state', 'lottery_tickets', 'lottery_draws'];
    
    for (const table of requiredTables) {
        if (!migrationContent.includes(`CREATE TABLE IF NOT EXISTS ${table}`)) {
            console.error(`❌ Migration missing table: ${table}`);
            process.exit(1);
        }
    }
    
    console.log('✅ Database migration found and validated');
    console.log('   - Tables:', requiredTables.join(', '));
} catch (error) {
    console.error('❌ Failed to check migration:', error.message);
    process.exit(1);
}

console.log('\n✅ All tests passed!');
console.log('\nLottery commands available:');
console.log('  - !loto acheter [nombre] - Buy lottery tickets');
console.log('  - !loto voir - View your tickets');
console.log('  - !loto jackpot - View current jackpot');
console.log('\nAutomatic draw: Every', ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][config.games.loto.drawDay], 'at', `${config.games.loto.drawHour}:${String(config.games.loto.drawMinute).padStart(2, '0')}`);
