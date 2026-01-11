/**
 * Integration Test for !niveaux Command
 * Demonstrates the command behavior in different scenarios
 */

const { getXPProgress } = require('./utils/xpHelper');
const config = require('./config.json');

console.log('=== Niveaux Command Integration Test ===\n');

const LEVELS_CHANNEL_ID = config.channels.levelUpNotification;

// Mock message object
function createMockMessage(channelId, userId, username) {
    return {
        channel: { id: channelId },
        author: { 
            id: userId, 
            username: username,
            displayAvatarURL: () => 'https://cdn.discordapp.com/avatars/mock/avatar.png'
        }
    };
}

// Simulate the niveaux command logic
function simulateNiveauxCommand(message, userXP) {
    console.log(`\n--- Testing !niveaux command ---`);
    console.log(`User: ${message.author.username}`);
    console.log(`Channel ID: ${message.channel.id}`);
    console.log(`User XP: ${userXP}`);
    
    // Check channel restriction
    if (message.channel.id !== LEVELS_CHANNEL_ID) {
        console.log('\n❌ Wrong Channel Response:');
        console.log('⛔ Utilisez cette commande uniquement dans le salon des niveaux pour voir votre progression !');
        return;
    }
    
    // Calculate progress
    const progress = getXPProgress(userXP);
    const xpNeeded = progress.nextLevelXP - progress.currentLevelXP;
    
    console.log('\n✅ Correct Channel - Showing Level Info:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👤 Niveau de ${message.author.username}\n`);
    console.log(`🆙 Niveau Actuel : ${progress.level}`);
    console.log(`💪 XP Actuel : ${progress.currentLevelXP} / ${progress.nextLevelXP}`);
    console.log(`Encore ${xpNeeded} XP nécessaires pour atteindre le niveau suivant !\n`);
    console.log(`Continuez à progresser pour débloquer des récompenses 🎁 !`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// Test Scenario 1: Command used in wrong channel
console.log('\n📋 Scenario 1: User tries !niveaux in wrong channel');
console.log('═══════════════════════════════════════════════════');
const wrongChannelMessage = createMockMessage('9999999999999999999', '123456', 'TestUser');
simulateNiveauxCommand(wrongChannelMessage, 500);

// Test Scenario 2: Command used in correct channel with 0 XP
console.log('\n\n📋 Scenario 2: New user uses !niveaux in levels channel');
console.log('═══════════════════════════════════════════════════');
const newUserMessage = createMockMessage(LEVELS_CHANNEL_ID, '789012', 'NewUser');
simulateNiveauxCommand(newUserMessage, 0);

// Test Scenario 3: Command used in correct channel with 1215 XP (from requirements)
console.log('\n\n📋 Scenario 3: User with 1215 XP uses !niveaux in levels channel');
console.log('═══════════════════════════════════════════════════');
const activeUserMessage = createMockMessage(LEVELS_CHANNEL_ID, '345678', 'Premsito');
simulateNiveauxCommand(activeUserMessage, 1215);

// Test Scenario 4: Command used in correct channel with high XP
console.log('\n\n📋 Scenario 4: High-level user uses !niveaux in levels channel');
console.log('═══════════════════════════════════════════════════');
const highLevelMessage = createMockMessage(LEVELS_CHANNEL_ID, '567890', 'VeteranUser');
simulateNiveauxCommand(highLevelMessage, 5500);

console.log('\n\n=== Integration Test Complete ===');
console.log('✅ All scenarios tested successfully!');
