/**
 * Integration test for level-up card system
 * This test simulates a real level-up scenario to ensure all components work together
 */

const fs = require('fs');
const path = require('path');

// Mock Discord.js components
class MockUser {
    constructor(username, id) {
        this.username = username;
        this.id = id;
        this.bot = false;
    }
    
    displayAvatarURL(options = {}) {
        // Return a placeholder URL that will trigger the fallback avatar
        return 'https://cdn.discordapp.com/embed/avatars/0.png';
    }
}

async function testIntegration() {
    console.log('🧪 Running integration test for level-up card system...\n');
    
    try {
        // Test 1: Module imports
        console.log('📦 Test 1: Checking module imports...');
        const { generateLevelUpCard } = require('./utils/levelUpCard');
        const { getXPProgress, getLevelFromXP } = require('./utils/xpHelper');
        console.log('   ✅ All modules imported successfully\n');
        
        // Test 2: XP calculation
        console.log('📊 Test 2: Verifying XP calculations...');
        const totalXP = 6600 + 915; // Level 12 with 915/1200 XP
        const level = getLevelFromXP(totalXP);
        const progress = getXPProgress(totalXP);
        
        console.log(`   Level from XP (${totalXP}): ${level}`);
        console.log(`   Progress: ${progress.currentLevelXP}/${progress.nextLevelXP} (${progress.progress}%)`);
        
        if (level !== 12) {
            throw new Error(`Expected level 12, got ${level}`);
        }
        console.log('   ✅ XP calculations correct\n');
        
        // Test 3: Card generation with mock user
        console.log('🎨 Test 3: Generating level-up card with mock user...');
        const mockUser = new MockUser('Premsito', '123456789');
        const cardBuffer = await generateLevelUpCard(mockUser, level, totalXP, 'Trésor 🗝️');
        
        if (!Buffer.isBuffer(cardBuffer)) {
            throw new Error('Card generation did not return a buffer');
        }
        
        console.log(`   Card buffer size: ${cardBuffer.length} bytes`);
        
        // Save the card
        const outputPath = path.join(__dirname, 'test-integration-card.png');
        fs.writeFileSync(outputPath, cardBuffer);
        console.log(`   ✅ Card saved to: ${outputPath}\n`);
        
        // Test 4: Verify card is valid PNG
        console.log('🖼️  Test 4: Verifying card is valid PNG...');
        const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
        const fileSignature = cardBuffer.slice(0, 8);
        
        if (!fileSignature.equals(pngSignature)) {
            throw new Error('Generated file is not a valid PNG');
        }
        console.log('   ✅ Card is a valid PNG image\n');
        
        // Test 5: Test different levels
        console.log('🎯 Test 5: Testing multiple level scenarios...');
        const scenarios = [
            { level: 1, xp: 50, description: 'Level 1 (50/100 XP)' },
            { level: 5, xp: 1000 + 250, description: 'Level 5 (250/500 XP)' },
            { level: 10, xp: 4500 + 900, description: 'Level 10 (900/1000 XP)' },
            { level: 20, xp: 19000 + 1900, description: 'Level 20 (1900/2000 XP)' },
        ];
        
        for (const scenario of scenarios) {
            const testUser = new MockUser(`TestUser${scenario.level}`, `${scenario.level}`);
            const testCard = await generateLevelUpCard(testUser, scenario.level, scenario.xp, 'Trésor 🗝️');
            
            if (testCard.length < 1000) {
                throw new Error(`Card for ${scenario.description} is suspiciously small (${testCard.length} bytes)`);
            }
            
            console.log(`   ✅ ${scenario.description}: ${testCard.length} bytes`);
        }
        console.log('');
        
        // Summary
        console.log('🎉 All integration tests passed!\n');
        console.log('📋 Summary:');
        console.log('   ✅ Module imports working');
        console.log('   ✅ XP calculations correct');
        console.log('   ✅ Card generation working');
        console.log('   ✅ PNG format valid');
        console.log('   ✅ Multiple level scenarios tested');
        console.log('\n✨ The level-up card system is ready to use!');
        
    } catch (error) {
        console.error('\n❌ Integration test failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run the test
testIntegration();
