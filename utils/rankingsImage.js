const { createCanvas, loadImage } = require('canvas');

// Constants for visual styling
const ALPHA_TRANSPARENCY = '20';

// Layout constants for consistent spacing
const LAYOUT = {
    CANVAS_WIDTH: 1200,
    CANVAS_HEIGHT: 800,
    BORDER_MARGIN: 10,
    BORDER_WIDTH: 6,
    HEADER_HEIGHT: 100,
    COLUMN_HEADER_HEIGHT: 50,
    COLUMN_GAP: 20,           // Gap between columns for visual separation
    ENTRY_HEIGHT: 62,         // Increased for better vertical spacing
    ENTRY_PADDING: 12,        // Increased for better horizontal padding
    AVATAR_SIZE: 42,          // Slightly larger for better visibility
    MEDAL_WIDTH: 45,          // Reserved space for medal/number
    AVATAR_MARGIN: 15,        // Space between medal and avatar
    TEXT_MARGIN: 15,          // Space between avatar and text (increased from 10)
    VALUE_PADDING: 20         // Minimum padding for value text on the right
};

/**
 * Generate a rankings image (pancarte) using Canvas
 * Displays Top 10 for both LC and Niveaux side-by-side
 * @param {Array} topLC - Top LC users (all users included)
 * @param {Array} topLevels - Top Level users (all users included)
 * @param {Guild} guild - Discord guild for fetching avatars
 * @returns {Buffer} - PNG image buffer
 */
async function generateRankingsImage(topLC, topLevels, guild) {
    // Create canvas
    const canvas = createCanvas(LAYOUT.CANVAS_WIDTH, LAYOUT.CANVAS_HEIGHT);
    const ctx = canvas.getContext('2d');
    
    // Background - light colored gradient
    const gradient = ctx.createLinearGradient(0, 0, LAYOUT.CANVAS_WIDTH, LAYOUT.CANVAS_HEIGHT);
    gradient.addColorStop(0, '#F0F4FF');
    gradient.addColorStop(0.5, '#E8EFFF');
    gradient.addColorStop(1, '#F0F4FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, LAYOUT.CANVAS_WIDTH, LAYOUT.CANVAS_HEIGHT);
    
    // Main decorative border
    ctx.strokeStyle = '#5865F2';
    ctx.lineWidth = LAYOUT.BORDER_WIDTH;
    ctx.strokeRect(
        LAYOUT.BORDER_MARGIN, 
        LAYOUT.BORDER_MARGIN, 
        LAYOUT.CANVAS_WIDTH - (LAYOUT.BORDER_MARGIN * 2), 
        LAYOUT.CANVAS_HEIGHT - (LAYOUT.BORDER_MARGIN * 2)
    );
    
    // Header section with colored background
    const headerGradient = ctx.createLinearGradient(0, 0, LAYOUT.CANVAS_WIDTH, LAYOUT.HEADER_HEIGHT);
    headerGradient.addColorStop(0, '#5865F2');
    headerGradient.addColorStop(0.5, '#7289DA');
    headerGradient.addColorStop(1, '#5865F2');
    ctx.fillStyle = headerGradient;
    ctx.fillRect(20, 20, LAYOUT.CANVAS_WIDTH - 40, LAYOUT.HEADER_HEIGHT);
    
    // Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 CLASSEMENTS DISCORD 🏆', LAYOUT.CANVAS_WIDTH / 2, 80);
    
    // Column setup - equal widths with centered gap
    const contentWidth = LAYOUT.CANVAS_WIDTH - (LAYOUT.BORDER_MARGIN * 2) - (LAYOUT.BORDER_WIDTH * 2) - 20;
    const columnWidth = (contentWidth - LAYOUT.COLUMN_GAP) / 2;
    const leftColumnX = LAYOUT.BORDER_MARGIN + LAYOUT.BORDER_WIDTH + 10;
    const rightColumnX = leftColumnX + columnWidth + LAYOUT.COLUMN_GAP;
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
 * Draw a placeholder avatar circle
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} size - Avatar size
 * @param {string} borderColor - Border color
 */
function drawPlaceholderAvatar(ctx, x, y, size, borderColor) {
    // Draw placeholder circle
    ctx.fillStyle = '#7289DA';
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Avatar border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.stroke();
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
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, LAYOUT.COLUMN_HEADER_HEIGHT);
    
    // Column header text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, x + width / 2, y + 35);
    
    // Reset text alignment for entries
    ctx.textAlign = 'left';
    
    let currentY = y + LAYOUT.COLUMN_HEADER_HEIGHT + 10;
    
    // Draw up to 10 entries
    const displayUsers = users.slice(0, 10);
    
    for (let i = 0; i < displayUsers.length; i++) {
        const user = displayUsers[i];
        const entryY = currentY + i * LAYOUT.ENTRY_HEIGHT;
        
        // Entry background - alternating colors
        if (i < 3) {
            // Top 3 get special gold/silver/bronze tint
            const topColors = ['#FFD700', '#C0C0C0', '#CD7F32'];
            ctx.fillStyle = topColors[i] + ALPHA_TRANSPARENCY;
        } else {
            ctx.fillStyle = i % 2 === 0 ? '#FFFFFF' : '#F5F5F5';
        }
        ctx.fillRect(x, entryY, width, LAYOUT.ENTRY_HEIGHT);
        
        // Entry border
        ctx.strokeStyle = '#E0E0E0';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, entryY, width, LAYOUT.ENTRY_HEIGHT);
        
        // Medal or position number - centered in reserved space
        const medal = getMedal(i);
        ctx.fillStyle = '#2C2F33';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(medal, x + LAYOUT.ENTRY_PADDING + (LAYOUT.MEDAL_WIDTH / 2), entryY + 35);
        ctx.textAlign = 'left';
        
        // Avatar - positioned after medal space
        const avatarX = x + LAYOUT.ENTRY_PADDING + LAYOUT.MEDAL_WIDTH + LAYOUT.AVATAR_MARGIN;
        const avatarY = entryY + (LAYOUT.ENTRY_HEIGHT - LAYOUT.AVATAR_SIZE) / 2;
        
        // Fetch guild member once for both avatar and display name
        let guildMember = null;
        try {
            guildMember = await guild.members.fetch(user.user_id).catch(() => null);
        } catch (error) {
            // Member fetch failed, will use placeholder
        }
        
        if (guildMember) {
            try {
                const avatarURL = guildMember.displayAvatarURL({ extension: 'png', size: 128 });
                const avatar = await loadImage(avatarURL);
                
                // Draw circular avatar
                ctx.save();
                ctx.beginPath();
                ctx.arc(avatarX + LAYOUT.AVATAR_SIZE / 2, avatarY + LAYOUT.AVATAR_SIZE / 2, LAYOUT.AVATAR_SIZE / 2, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(avatar, avatarX, avatarY, LAYOUT.AVATAR_SIZE, LAYOUT.AVATAR_SIZE);
                ctx.restore();
                
                // Avatar border
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(avatarX + LAYOUT.AVATAR_SIZE / 2, avatarY + LAYOUT.AVATAR_SIZE / 2, LAYOUT.AVATAR_SIZE / 2, 0, Math.PI * 2);
                ctx.stroke();
            } catch (error) {
                console.error(`Error loading avatar for user ${user.user_id}:`, error.message);
                // Draw placeholder on error
                drawPlaceholderAvatar(ctx, avatarX, avatarY, LAYOUT.AVATAR_SIZE, color);
            }
        } else {
            // Draw placeholder circle if member not found
            drawPlaceholderAvatar(ctx, avatarX, avatarY, LAYOUT.AVATAR_SIZE, color);
        }
        
        // Username - positioned after avatar with proper margin
        const nameX = avatarX + LAYOUT.AVATAR_SIZE + LAYOUT.TEXT_MARGIN;
        const nameY = entryY + 28;
        
        const displayName = guildMember ? guildMember.displayName : user.username;
        ctx.fillStyle = '#2C2F33';
        ctx.font = i < 3 ? 'bold 20px sans-serif' : '18px sans-serif';
        
        // Calculate available width for name (accounting for all spacing and padding)
        const usedWidth = LAYOUT.ENTRY_PADDING + LAYOUT.MEDAL_WIDTH + LAYOUT.AVATAR_MARGIN + 
                         LAYOUT.AVATAR_SIZE + LAYOUT.TEXT_MARGIN;
        const maxNameWidth = width - usedWidth - LAYOUT.VALUE_PADDING;
        
        // Truncate name if too long
        let truncatedName = displayName;
        if (ctx.measureText(displayName).width > maxNameWidth) {
            while (ctx.measureText(truncatedName + '...').width > maxNameWidth && truncatedName.length > 0) {
                truncatedName = truncatedName.slice(0, -1);
            }
            truncatedName += '...';
        }
        
        ctx.fillText(truncatedName, nameX, nameY);
        
        // Value (LC or Niveau) - positioned below username
        const valueY = entryY + 50;
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
