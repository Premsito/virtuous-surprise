/**
 * Level-Up Card Generator
 * 
 * This module creates visually appealing canvas-based cards for level-up announcements
 */

const { createCanvas, loadImage } = require('@napi-rs/canvas');
const { AttachmentBuilder } = require('discord.js');
const { getXPProgress } = require('./xpHelper');

/**
 * Generate a level-up announcement card
 * @param {object} options - Card generation options
 * @param {string} options.username - User's display name
 * @param {string} options.avatarURL - User's avatar URL
 * @param {number} options.level - New level reached
 * @param {number} options.xp - Total XP
 * @param {string} options.reward - Reward description (default: 'Trésor 🗝️')
 * @returns {AttachmentBuilder} - Discord attachment with the generated card
 */
async function generateLevelUpCard(options) {
    const {
        username,
        avatarURL,
        level,
        xp,
        reward = 'Trésor 🗝️'
    } = options;

    // Canvas dimensions
    const width = 800;
    const height = 400;
    
    // Create canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add decorative elements
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(650, 80, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(150, 320, 80, 0, Math.PI * 2);
    ctx.fill();

    // Title: FÉLICITATIONS
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎉 FÉLICITATIONS 🎉', width / 2, 60);

    // Load and draw avatar
    try {
        const avatar = await loadImage(avatarURL);
        const avatarSize = 120;
        const avatarX = width / 2 - avatarSize / 2;
        const avatarY = 80;

        // Draw circular avatar background
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(width / 2, avatarY + avatarSize / 2, avatarSize / 2 + 5, 0, Math.PI * 2);
        ctx.fill();

        // Draw circular avatar
        ctx.save();
        ctx.beginPath();
        ctx.arc(width / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
    } catch (error) {
        console.error('Error loading avatar:', error);
        // Draw placeholder circle if avatar fails to load
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(width / 2, 140, 60, 0, Math.PI * 2);
        ctx.fill();
    }

    // Username
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`👤 ${username}`, width / 2, 240);

    // Level
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(`🆙 Niveau: ${level}`, width / 2, 285);

    // XP Progress
    const progress = getXPProgress(xp);
    const progressText = `📊 XP: ${progress.currentLevelXP} / ${progress.nextLevelXP}`;
    ctx.font = '24px sans-serif';
    ctx.fillText(progressText, width / 2, 315);

    // Draw XP progress bar
    const barWidth = 600;
    const barHeight = 25;
    const barX = (width - barWidth) / 2;
    const barY = 325;

    // Progress bar background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Progress bar fill
    const fillWidth = (progress.progress / 100) * barWidth;
    const barGradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0);
    barGradient.addColorStop(0, '#FFD700');
    barGradient.addColorStop(1, '#FFA500');
    ctx.fillStyle = barGradient;
    ctx.fillRect(barX, barY, fillWidth, barHeight);

    // Progress bar border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // Reward text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(`🎁 Cadeau gagné : ${reward}`, width / 2, 375);

    // Footer
    ctx.font = 'italic 16px sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText('💡 Les !missions permettent de gagner de l\'XP et des LC !', width / 2, 395);

    // Convert canvas to buffer
    const buffer = canvas.toBuffer('image/png');
    
    // Create Discord attachment
    return new AttachmentBuilder(buffer, { name: 'level-up-card.png' });
}

module.exports = {
    generateLevelUpCard
};
