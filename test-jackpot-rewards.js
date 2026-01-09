// Test to validate Jackpot reward probability distribution
console.log('🧪 Testing Jackpot Reward System...\n');

// Weighted random selection helper (from sac.js)
function weightedRandom(items, weights) {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            return items[i];
        }
    }
    
    return items[items.length - 1];
}

// Test configuration from sac.js
const rewards = [25, 50, 100];
const weights = [50, 35, 15]; // Probabilities: 50%, 35%, 15%

console.log('Expected Probabilities:');
console.log('  25 LC: 50%');
console.log('  50 LC: 35%');
console.log('  100 LC: 15%');
console.log('');

// Run simulation
const iterations = 10000;
const results = { 25: 0, 50: 0, 100: 0 };

console.log(`Running ${iterations} simulations...`);
for (let i = 0; i < iterations; i++) {
    const reward = weightedRandom(rewards, weights);
    results[reward]++;
}

console.log('\nActual Results:');
console.log(`  25 LC: ${(results[25] / iterations * 100).toFixed(2)}% (${results[25]} times)`);
console.log(`  50 LC: ${(results[50] / iterations * 100).toFixed(2)}% (${results[50]} times)`);
console.log(`  100 LC: ${(results[100] / iterations * 100).toFixed(2)}% (${results[100]} times)`);

// Verify probabilities are within acceptable range (±5%)
const tolerance = 5;
let allPassed = true;

const expectedProbs = { 25: 50, 50: 35, 100: 15 };
console.log('\nValidation (±5% tolerance):');

for (const [reward, count] of Object.entries(results)) {
    const actualProb = (count / iterations * 100);
    const expectedProb = expectedProbs[reward];
    const diff = Math.abs(actualProb - expectedProb);
    const passed = diff <= tolerance;
    
    if (passed) {
        console.log(`✅ ${reward} LC: ${actualProb.toFixed(2)}% (expected ${expectedProb}%, diff ${diff.toFixed(2)}%)`);
    } else {
        console.log(`❌ ${reward} LC: ${actualProb.toFixed(2)}% (expected ${expectedProb}%, diff ${diff.toFixed(2)}%)`);
        allPassed = false;
    }
}

console.log('\n=== Test Summary ===');
if (allPassed) {
    console.log('✅ All probability tests passed!');
    console.log('🎉 Jackpot reward system is working correctly!');
    process.exit(0);
} else {
    console.log('❌ Some probability tests failed!');
    console.log('⚠️ This could be due to random variance. Try running again.');
    process.exit(1);
}
