/**
 * Integration Test: Simulate level-up progression
 * This test simulates a user leveling up and shows the rewards they would receive
 */

const { calculateLevelReward, formatRewardEmbed, getMilestoneTreasure } = require('./utils/rewardHelper');

console.log('🎮 Simulating Level-Up Progression\n');
console.log('══════════════════════════════════════════════════════════════════\n');

// Simulate a user's progression through levels 1-25
console.log('📊 Level-Up Reward Summary for Levels 1-25:\n');

let totalLC = 0;
let totalBoosts = { xp: 0, lc: 0 };

for (let level = 1; level <= 25; level++) {
    const reward = calculateLevelReward(level);
    const embed = formatRewardEmbed(reward, level);
    
    // Track totals
    totalLC += reward.lcAmount;
    if (reward.boost) {
        totalBoosts[reward.boost.type]++;
    }
    
    console.log(`🎉 Niveau ${level}`);
    console.log(`   ${embed.title}`);
    console.log(`   ${embed.description.split('\n')[0]}`);
    if (embed.description.includes('Boost')) {
        const boostLine = embed.description.split('\n').find(line => line.includes('Boost'));
        if (boostLine) {
            console.log(`   ${boostLine}`);
        }
    }
    console.log('');
}

console.log('══════════════════════════════════════════════════════════════════\n');
console.log('📈 Summary Statistics:\n');
console.log(`   Total LC Earned: ${totalLC} LC 💰`);
console.log(`   XP Boosts Received: ${totalBoosts.xp} x (x2 for 1h each) ⚡`);
console.log(`   LC Boosts Received: ${totalBoosts.lc} x (x2 for 1h each) 💎`);
console.log(`   Total Boosts: ${totalBoosts.xp + totalBoosts.lc}\n`);

// Detailed breakdown by category
console.log('══════════════════════════════════════════════════════════════════\n');
console.log('📋 Detailed Breakdown by Level Type:\n');

let milestoneLC = 0;
let normalLC = 0;
let milestoneCount = 0;
let normalCount = 0;

for (let level = 1; level <= 25; level++) {
    const reward = calculateLevelReward(level);
    if (reward.type === 'milestone') {
        milestoneLC += reward.lcAmount;
        milestoneCount++;
    } else {
        normalLC += reward.lcAmount;
        normalCount++;
    }
}

console.log(`   🏆 Milestone Levels (${milestoneCount}):`);
console.log(`      - Levels: 1, 5, 10, 15, 20, 25`);
console.log(`      - Total LC: ${milestoneLC} LC`);
console.log(`      - Average per milestone: ${Math.round(milestoneLC / milestoneCount)} LC\n`);

console.log(`   📊 Normal Levels (${normalCount}):`);
console.log(`      - Even levels (LC): ${normalCount / 2} levels × 20 LC = ${normalLC} LC`);
console.log(`      - Odd levels (Boosts): ${normalCount / 2} levels`);
console.log(`        • XP Boosts: ${totalBoosts.xp} x`);
console.log(`        • LC Boosts: ${totalBoosts.lc} x\n`);

// Example use cases
console.log('══════════════════════════════════════════════════════════════════\n');
console.log('🎯 Example Milestone Rewards:\n');

const exampleMilestones = [
    { level: 1, description: 'First level - Small welcome treasure' },
    { level: 5, description: 'Early milestone - Bigger treasure' },
    { level: 10, description: 'Major milestone - Epic treasure with XP boost' },
    { level: 20, description: 'Legendary milestone - Best treasure with LC boost' }
];

exampleMilestones.forEach(example => {
    const reward = calculateLevelReward(example.level);
    const treasure = getMilestoneTreasure(example.level);
    console.log(`   Level ${example.level}: ${example.description}`);
    console.log(`   ├─ Treasure: ${reward.name}`);
    console.log(`   ├─ LC Range: ${treasure.minLC}-${treasure.maxLC} LC`);
    if (reward.boost) {
        console.log(`   └─ Bonus: x${reward.boost.multiplier} ${reward.boost.type.toUpperCase()} Boost for 1 hour`);
    } else {
        console.log(`   └─ Bonus: None`);
    }
    console.log('');
});

console.log('══════════════════════════════════════════════════════════════════\n');
console.log('✅ Integration Test Complete!\n');
console.log('The reward system provides a balanced progression with:');
console.log('  • Alternating LC and boost rewards for normal levels');
console.log('  • Special milestone treasures every 5 levels');
console.log('  • Increasing rewards as players level up');
console.log('  • Both immediate rewards (LC) and strategic bonuses (boosts)\n');
