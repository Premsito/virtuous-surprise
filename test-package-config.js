/**
 * Test to verify package.json configuration for npm warning fix
 * This validates that the prestart hook is correctly configured
 */

const packageJson = require('./package.json');

console.log('=== Package.json Configuration Test ===\n');

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

// Test 1: Verify prestart script exists
test('prestart script exists in package.json', () => {
    if (!packageJson.scripts || !packageJson.scripts.prestart) {
        throw new Error('prestart script is missing');
    }
});

// Test 2: Verify prestart uses --omit=dev flag
test('prestart script uses --omit=dev flag', () => {
    const prestart = packageJson.scripts.prestart;
    if (!prestart.includes('npm install --omit=dev')) {
        throw new Error('prestart script does not use npm install --omit=dev command');
    }
});

// Test 2.5: Verify prestart unsets npm_config_production environment variable
test('prestart script unsets npm_config_production environment variable', () => {
    const prestart = packageJson.scripts.prestart;
    if (!prestart.includes('-u npm_config_production')) {
        throw new Error('prestart script does not unset npm_config_production environment variable');
    }
});

// Test 2.6: Verify prestart sets npm_config_omit environment variable
test('prestart script sets npm_config_omit environment variable', () => {
    const prestart = packageJson.scripts.prestart;
    if (!prestart.includes('npm_config_omit=dev')) {
        throw new Error('prestart script does not set npm_config_omit environment variable');
    }
});

// Test 3: Verify prestart does not use deprecated --production flag
test('prestart script does not use deprecated --production flag', () => {
    const prestart = packageJson.scripts.prestart;
    if (prestart.includes('--production')) {
        throw new Error('prestart script uses deprecated --production flag');
    }
});

// Test 4: Verify start script exists
test('start script exists in package.json', () => {
    if (!packageJson.scripts || !packageJson.scripts.start) {
        throw new Error('start script is missing');
    }
});

// Test 5: Verify start script runs bot.js
test('start script runs bot.js', () => {
    const start = packageJson.scripts.start;
    if (!start.includes('bot.js')) {
        throw new Error('start script does not run bot.js');
    }
});

// Summary
console.log('\n=== Test Summary ===');
console.log(`Passed: ${testsPassed}`);
console.log(`Failed: ${testsFailed}`);
console.log(`Total: ${testsPassed + testsFailed}`);

if (testsFailed === 0) {
    console.log('\n✅ All package.json configuration tests passed!');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed. Please review the errors above.');
    process.exit(1);
}
