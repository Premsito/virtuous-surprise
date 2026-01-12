const { createCanvas, loadImage } = require('canvas');

/**
 * Generate a rankings image (pancarte) using Canvas
 * Displays Top 10 for both LC and Niveaux side-by-side
 * @param {Array} topLC - Top LC users (filtered: >= 200 LC)
 * @param {Array} topLevels - Top Level users (filtered: >= 2 Niveau)
 * @param {Guild} guild - Discord guild for fetching avatars
 * @returns {Buffer} - PNG image buffer
 */
async function generateRankingsImage(topLC, topLevels, guild) {
    // Canvas dimensions - wide format for side-by-side columns
    const width = 1200;
    const height = 800;
    
    // Create canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Background - light colored gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#F0F4FF');
    gradient.addColorStop(0.5, '#E8EFFF');
    gradient.addColorStop(1, '#F0F4FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Main decorative border
    ctx.strokeStyle = '#5865F2';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, width - 20, height - 20);
    
    // Header section with colored background
    const headerHeight = 100;
    const headerGradient = ctx.createLinearGradient(0, 0, width, headerHeight);
    headerGradient.addColorStop(0, '#5865F2');
    headerGradient.addColorStop(0.5, '#7289DA');
    headerGradient.addColorStop(1, '#5865F2');
    ctx.fillStyle = headerGradient;
    ctx.fillRect(20, 20, width - 40, headerHeight);
    
    // Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 CLASSEMENTS DISCORD 🏆', width / 2, 80);
    
    // Column setup
    const columnWidth = (width - 60) / 2;
    const leftColumnX = 30;
    const rightColumnX = 30 + columnWidth + 10;
    const startY = 140;
    
    // Left column - LC Rankings
    await drawRankingColumn(
        ctx,
        leftColumnX,
        startY,
        columnWidth,
        topLC,
        '💰 Classement LC',
        '#FFD700',
        'LC',
        guild
    );
    
    // Right column - Niveaux Rankings
    await drawRankingColumn(
        ctx,
        rightColumnX,
        startY,
        columnWidth,
        topLevels,
        '📊 Classement Niveaux',
        '#5865F2',
        'Niveau',
        guild
    );
    
    // Return PNG buffer
    return canvas.toBuffer('image/png');
}

/**
 * Draw a ranking column with header and user entries
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - Column X position
 * @param {number} y - Column Y position
 * @param {number} width - Column width
 * @param {Array} users - User data array
 * @param {string} title - Column title
 * @param {string} color - Theme color for this column
 * @param {string} valueType - 'LC' or 'Niveau'
 * @param {Guild} guild - Discord guild
 */
async function drawRankingColumn(ctx, x, y, width, users, title, color, valueType, guild) {
    // Column header panel
    const headerHeight = 50;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, headerHeight);
    
    // Column header text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, x + width / 2, y + 35);
    
    // Reset text alignment for entries
    ctx.textAlign = 'left';
    
    // Entry settings
    const entryHeight = 60;
    const avatarSize = 40;
    const entryPadding = 8;
    let currentY = y + headerHeight + 10;
    
    // Draw up to 10 entries
    const displayUsers = users.slice(0, 10);
    
    for (let i = 0; i < displayUsers.length; i++) {
        const user = displayUsers[i];
        const entryY = currentY + i * entryHeight;
        
        // Entry background - alternating colors
        if (i < 3) {
            // Top 3 get special gold/silver/bronze tint
            const topColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
            ctx.fillStyle = topColors[i] + '20'; // 20 = alpha for transparency
        } else {
            ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : '#F5F5F5';
        }
        ctx.fillRect(x, entryY, width, entryHeight);
        
        // Entry border
        ctx.strokeStyle = '#E0E0E0';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, entryY, width, entryHeight);
        
        // Medal or position number
        const medal = getMedal(i);
        ctx.fillStyle = '#2C2F33';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(medal, x + entryPadding, entryY + 32);
        
        // Avatar
        const avatarX = x + 50;
        const avatarY = entryY + (entryHeight - avatarSize) / 2;
        
        try {
            // Fetch guild member to get avatar
            const guildMember = await guild.members.fetch(user.user_id).catch(() => null);
            
            if (guildMember) {
                const avatarURL = guildMember.displayAvatarURL({ extension: 'png', size: 128 });
                const avatar = await loadImage(avatarURL);
                
                // Draw circular avatar
                ctx.save();
                ctx.beginPath();
                ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
                ctx.restore();
                
                // Avatar border
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
                ctx.stroke();
            } else {
                // Fallback: draw placeholder circle
                ctx.fillStyle = '#7289DA';
                ctx.beginPath();
                ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        } catch (error) {
            console.error(`Error loading avatar for user ${user.user_id}:`, error.message);
            // Draw placeholder on error
            ctx.fillStyle = '#7289DA';
            ctx.beginPath();
            ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Username
        const nameX = avatarX + avatarSize + 10;
        const nameY = entryY + 28;
        
        let guildMember;
        try {
            guildMember = await guild.members.fetch(user.user_id).catch(() => null);
        } catch (error) {
            // Ignore fetch errors
        }
        
        const displayName = guildMember ? guildMember.displayName : user.username;
        ctx.fillStyle = '#2C2F33';
        ctx.font = i < 3 ? 'bold 20px sans-serif' : '18px sans-serif';
        
        // Truncate name if too long
        const maxNameWidth = width - (nameX - x) - 100;
        let truncatedName = displayName;
        if (ctx.measureText(displayName).width > maxNameWidth) {
            while (ctx.measureText(truncatedName + '...').width > maxNameWidth && truncatedName.length > 0) {
                truncatedName = truncatedName.slice(0, -1);
            }
            truncatedName += '...';
        }
        
        ctx.fillText(truncatedName, nameX, nameY);
        
        // Value (LC or Niveau)
        const valueY = entryY + 48;
        const value = valueType === 'LC' ? `${user.balance} LC` : `Niveau ${user.level}`;
        ctx.fillStyle = color;
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(value, nameX, valueY);
    }
}

/**
 * Get medal emoji or position number
 * @param {number} index - Zero-based index
 * @returns {string} Medal or position
 */
function getMedal(index) {
    const medals = ['🥇', '🥈', '🥉'];
    return index < 3 ? medals[index] : `${index + 1}.`;
}

module.exports = {
    generateRankingsImage
};
