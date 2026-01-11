/**
 * Level Up Card Generator
 * 
 * This module generates visually appealing level-up announcement cards
 * using canvas to display user achievements.
 */

const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
const { AttachmentBuilder } = require('discord.js');
const { getXPProgress } = require('./xpHelper');
const { ITEMS } = require('./inventoryItems');

// Card dimensions
const CARD_WIDTH = 800;
const CARD_HEIGHT = 400;

// Colors
const COLORS = {
    background: '#2C2F33',
    headerBg: '#7289DA',
    progressBarBg: '#40444B',
    progressBarFill: '#43B581',
    text: '#FFFFFF',
    textSecondary: '#B9BBBE',
    accent: '#FAA61A',
    shadow: 'rgba(0, 0, 0, 0.5)'
};

/**
 * Generate a level-up announcement card
 * @param {Object} params - Card parameters
 * @param {string} params.username - User's display name
 * @param {string} params.avatarURL - URL to user's avatar
 * @param {number} params.level - New level achieved
 * @param {number} params.xp - Total XP
 * @param {string} params.reward - Reward description (e.g., "Trésor 🗝️")
 * @returns {Promise<AttachmentBuilder>} Discord attachment with the card image
 */
async function generateLevelUpCard({ username, avatarURL, level, xp, reward }) {
    // Create canvas
    const canvas = createCanvas(CARD_WIDTH, CARD_HEIGHT);
    const ctx = canvas.getContext('2d');

    // Draw background
    drawBackground(ctx);

    // Draw header section
    drawHeader(ctx);

    // Draw avatar
    await drawAvatar(ctx, avatarURL);

    // Draw user info
    drawUserInfo(ctx, username, level);

    // Draw XP progress
    drawXPProgress(ctx, xp, level);

    // Draw reward section
    drawReward(ctx, reward);

    // Draw footer
    drawFooter(ctx);

    // Convert canvas to buffer and create attachment
    const buffer = canvas.toBuffer('image/png');
    return new AttachmentBuilder(buffer, { name: 'level-up.png' });
}

/**
 * Draw background with gradient
 */
function drawBackground(ctx) {
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
    gradient.addColorStop(0, '#434C5E');
    gradient.addColorStop(1, '#2E3440');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);

    // Add subtle pattern overlay
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    for (let i = 0; i < CARD_WIDTH; i += 20) {
        ctx.fillRect(i, 0, 10, CARD_HEIGHT);
    }
}

/**
 * Draw header section
 */
function drawHeader(ctx) {
    // Header background
    ctx.fillStyle = COLORS.headerBg;
    ctx.fillRect(0, 0, CARD_WIDTH, 80);

    // Title text with shadow
    ctx.shadowColor = COLORS.shadow;
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 42px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎉 FÉLICITATIONS 🎉', CARD_WIDTH / 2, 55);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

/**
 * Draw user avatar
 */
async function drawAvatar(ctx, avatarURL) {
    try {
        const avatar = await loadImage(avatarURL);
        
        const avatarSize = 120;
        const avatarX = 50;
        const avatarY = 110;

        // Draw circular avatar with border
        ctx.save();
        
        // Outer border (glow effect)
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 5, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.accent;
        ctx.fill();
        
        // Clip to circle for avatar
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        
        // Draw avatar
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
        
        ctx.restore();
    } catch (error) {
        console.error('Error loading avatar:', error.message);
        // Draw placeholder circle if avatar fails to load
        ctx.fillStyle = COLORS.progressBarBg;
        ctx.beginPath();
        ctx.arc(110, 170, 60, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = COLORS.textSecondary;
        ctx.font = 'bold 40px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('👤', 110, 185);
    }
}

/**
 * Draw user information
 */
function drawUserInfo(ctx, username, level) {
    const startX = 200;
    const startY = 130;

    // Username
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`👤 ${username}`, startX, startY);

    // Level
    ctx.fillStyle = COLORS.accent;
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(`🆙 Niveau : ${level}`, startX, startY + 50);
}

/**
 * Draw XP progress bar
 */
function drawXPProgress(ctx, totalXP, level) {
    const progress = getXPProgress(totalXP);
    const barWidth = 550;
    const barHeight = 30;
    const barX = 200;
    const barY = 210;

    // Progress bar background
    ctx.fillStyle = COLORS.progressBarBg;
    roundRect(ctx, barX, barY, barWidth, barHeight, 15);
    ctx.fill();

    // Progress bar fill
    const fillWidth = (progress.currentLevelXP / progress.nextLevelXP) * barWidth;
    ctx.fillStyle = COLORS.progressBarFill;
    roundRect(ctx, barX, barY, fillWidth, barHeight, 15);
    ctx.fill();

    // Progress text
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    const progressText = `${progress.currentLevelXP} / ${progress.nextLevelXP} XP`;
    ctx.fillText(progressText, barX + barWidth / 2, barY + 20);

    // XP label
    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('📊 Progression XP:', barX, barY - 10);
}

/**
 * Draw reward section
 */
function drawReward(ctx, reward) {
    const rewardY = 280;
    const rewardX = CARD_WIDTH / 2;

    // Reward box background
    ctx.fillStyle = 'rgba(250, 166, 26, 0.2)';
    roundRect(ctx, 150, rewardY - 30, 500, 50, 10);
    ctx.fill();

    // Reward text
    ctx.fillStyle = COLORS.accent;
    ctx.font = 'bold 26px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`🎁 Cadeau gagné : ${reward}`, rewardX, rewardY);
}

/**
 * Draw footer
 */
function drawFooter(ctx) {
    const footerY = CARD_HEIGHT - 40;

    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = 'italic 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💡 Les !missions permettent de gagner de l\'XP et des LC !', CARD_WIDTH / 2, footerY);
}

/**
 * Helper function to draw rounded rectangles
 */
function roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

/**
 * Send level-up card to a channel
 * @param {Object} channel - Discord channel object
 * @param {Object} user - Discord user object with id and username
 * @param {number} level - New level achieved
 * @param {number} xp - Total XP
 * @returns {Promise<void>}
 */
async function sendLevelUpCard(channel, user, level, xp) {
    try {
        // Get user's avatar URL
        const avatarURL = user.displayAvatarURL({ extension: 'png', size: 256 });
        
        // Determine reward (always Trésor for level ups)
        const reward = ITEMS.tresor.name;

        // Generate the card
        const attachment = await generateLevelUpCard({
            username: user.username,
            avatarURL,
            level,
            xp,
            reward
        });

        // Send the card to the channel
        await channel.send({
            content: `<@${user.id}>`,
            files: [attachment]
        });
    } catch (error) {
        console.error('Error sending level-up card:', error);
        // Fallback to text message if card generation fails
        await channel.send(
            `🎉 **Bravo <@${user.id}>** 🎉\n` +
            `Tu as atteint le **Niveau ${level}** 🏆 !\n` +
            `💝 Tu reçois un **Trésor 🗝️**, ouvre vite pour découvrir ta récompense incroyable 🚀 !`
        );
    }
}

module.exports = {
    generateLevelUpCard,
    sendLevelUpCard
};
