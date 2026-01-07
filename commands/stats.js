const { db, pool } = require('../database/db');
const config = require('../config.json');
const { getResponse } = require('../utils/responseHelper');

module.exports = {
    name: 'stats',
    description: 'View user statistics',
    
    async execute(message, args) {
        try {
            // Check if a user is mentioned
            const targetUser = message.mentions.users.first() || message.author;
            const userId = targetUser.id;
            const username = targetUser.username;

            // Ensure user exists in database
            let user = await db.getUser(userId);
            if (!user) {
                user = await db.createUser(userId, username);
            }

            // Get game statistics
            const gameStatsResult = await pool.query(
                `SELECT 
                    COUNT(*) as games_played,
                    COUNT(CASE WHEN result = 'win' THEN 1 END) as games_won
                 FROM game_history 
                 WHERE player_id = $1`,
                [userId]
            );
            
            const gameStats = gameStatsResult.rows[0] || { games_played: 0, games_won: 0 };

            // Calculate server ranking based on balance
            const rankingResult = await pool.query(
                `SELECT COUNT(*) + 1 as rank
                 FROM users
                 WHERE balance > $1`,
                [user.balance]
            );
            const ranking = rankingResult.rows[0]?.rank || 1;

            // Fetch member data from Discord API to get accurate join date
            let joinDate = getResponse('stats.notAvailable');
            let joinDateLabel = '📅 **Arrivé**       :';
            
            try {
                // Force refresh member cache to ensure accurate data
                const member = await message.guild.members.fetch(userId);
                
                if (member && member.joinedAt) {
                    // Use Discord server join date
                    joinDate = member.joinedAt.toLocaleDateString('fr-FR');
                    console.log(`[Stats] Retrieved join date for ${username}: ${joinDate} (from member.joinedAt)`);
                } else if (targetUser.createdAt) {
                    // Fallback to account creation date with clear indication
                    joinDate = `${targetUser.createdAt.toLocaleDateString('fr-FR')} (compte créé)`;
                    joinDateLabel = '📅 **Compte créé**  :';
                    console.log(`[Stats] Using account creation date for ${username}: ${joinDate} (member.joinedAt not available)`);
                } else {
                    console.warn(`[Stats] No date information available for user ${username} (${userId})`);
                }
            } catch (fetchError) {
                console.error(`[Stats] Error fetching member data for ${username} (${userId}):`, fetchError);
                
                // Try fallback to user creation date
                if (targetUser.createdAt) {
                    joinDate = `${targetUser.createdAt.toLocaleDateString('fr-FR')} (compte créé)`;
                    joinDateLabel = '📅 **Compte créé**  :';
                    console.log(`[Stats] Fallback to account creation date for ${username}: ${joinDate}`);
                } else {
                    console.error(`[Stats] Unable to retrieve any date information for ${username} (${userId})`);
                }
            }

            // Format voice time (convert seconds to hours and minutes)
            const voiceTime = this.formatVoiceTime(user.voice_time || 0);

            // Format current time
            const now = new Date();
            const updateTime = now.toLocaleString('fr-FR', { 
                hour: '2-digit', 
                minute: '2-digit'
            });
            
            // Always use "Aujourd'hui" for the update date since stats are always current
            const updateDate = 'Aujourd\'hui';

            // Create compact frame message with box-drawing characters
            const statsMessage = 
`🏆 **Profil : @${username}**
╔════════════════════════════════╗
║ 💰 **Balance**      : ${user.balance} LC
║ 🤝 **Invitations**  : ${user.invites}
║ 📩 **Messages**     : ${user.message_count || 0}
║ 🎙️ **Temps vocal**  : ${voiceTime}
║ ${joinDateLabel} ${joinDate}
╠════════════════════════════════╣
║ 🎮 **Jouées**       : ${gameStats.games_played}
║ 🎉 **Gagnées**      : ${gameStats.games_won}
╚════════════════════════════════╝
📋 Mise à jour : ${updateDate} à ${updateTime}`;

            return message.reply(statsMessage);
        } catch (error) {
            console.error(`[Stats] Error executing stats command for user ${message.author.username}:`, error);
            return message.reply(getResponse('errors.commandExecutionError') || '❌ Une erreur est survenue lors de la récupération de vos statistiques. Veuillez réessayer plus tard.');
        }
    },

    formatVoiceTime(seconds) {
        if (seconds === 0) {
            return '0m';
        }
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }
};
