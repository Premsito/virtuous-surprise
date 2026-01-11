const { createCanvas, loadImage, registerFont } = require('canvas');
const { getXPProgress } = require('./xpHelper');

/**
 * Generate a level-up announcement card using Canvas
 * @param {Object} user - Discord user object
 * @param {number} level - New level reached
 * @param {number} totalXP - Total XP of the user
 * @param {string} reward - Reward description (e.g., 'Trésor 🗝️')
 * @returns {Buffer} - PNG image buffer
 */
async function generateLevelUpCard(user, level, totalXP, reward = 'Trésor 🗝️') {
    // Card dimensions
    const width = 800;
    const height = 400;
    
    // Create canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#5865F2');
    gradient.addColorStop(0.5, '#7289DA');
    gradient.addColorStop(1, '#5865F2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add decorative border
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, width - 20, height - 20);
    
    // Inner border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, width - 36, height - 36);
    
    // Title - Félicitations
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎉 FÉLICITATIONS 🎉', width / 2, 70);
    
    // Load and draw user avatar (circular)
    try {
        const avatarURL = user.displayAvatarURL({ extension: 'png', size: 128 });
        const avatar = await loadImage(avatarURL);
        
        // Draw circular avatar
        const avatarSize = 100;
        const avatarX = 80;
        const avatarY = 120;
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
        
        // Avatar border
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
        ctx.stroke();
    } catch (error) {
        console.error('Error loading avatar:', error);
        // Draw placeholder if avatar fails to load
        ctx.fillStyle = '#7289DA';
        ctx.beginPath();
        ctx.arc(130, 170, 50, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // User information section
    const textX = 220;
    let textY = 135;
    const lineHeight = 35;
    
    ctx.textAlign = 'left';
    ctx.font = 'bold 28px sans-serif';
    
    // Username
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`👤 User: ${user.username}`, textX, textY);
    textY += lineHeight;
    
    // Level
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`🆙 Niveau: ${level}`, textX, textY);
    textY += lineHeight;
    
    // XP Progress
    const progress = getXPProgress(totalXP);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px sans-serif';
    ctx.fillText(`📊 XP: ${progress.currentLevelXP} / ${progress.nextLevelXP}`, textX, textY);
    textY += lineHeight + 10;
    
    // Progress bar
    const barX = textX;
    const barY = textY - 10;
    const barWidth = 350;
    const barHeight = 25;
    const barProgress = progress.currentLevelXP / progress.nextLevelXP;
    
    // Progress bar background
    ctx.fillStyle = '#2C2F33';
    ctx.fillRect(barX, barY, barWidth, barHeight);
    
    // Progress bar fill with gradient
    const progressGradient = ctx.createLinearGradient(barX, barY, barX + barWidth * barProgress, barY);
    progressGradient.addColorStop(0, '#57F287');
    progressGradient.addColorStop(1, '#FFD700');
    ctx.fillStyle = progressGradient;
    ctx.fillRect(barX, barY, barWidth * barProgress, barHeight);
    
    // Progress bar border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barWidth, barHeight);
    
    // Progress percentage text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${progress.progress}%`, barX + barWidth / 2, barY + barHeight / 2 + 6);
    
    textY += barHeight + 25;
    
    // Reward section
    ctx.textAlign = 'center';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillStyle = '#FFD700';
    ctx.fillText(`🎁 Cadeau gagné : ${reward}`, width / 2, textY);
    
    // Footer
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#E0E0E0';
    ctx.fillText('💡 Les !missions permettent de gagner de l\'XP et des LC !', width / 2, height - 40);
    
    // Return PNG buffer
    return canvas.toBuffer('image/png');
}

module.exports = {
    generateLevelUpCard
};
