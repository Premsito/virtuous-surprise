const { db, pool } = require('../database/db');
const config = require('../config.json');
const { getResponse } = require('../utils/responseHelper');

module.exports = {
    name: 'stats',
    description: 'View user statistics',
    
    async execute(message, args) {
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

        // Format join date
        const joinDate = user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : getResponse('stats.notAvailable');

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

        // Create compact frame message (design option 3)
        const statsMessage = 
`📊 **Statistiques de ${username}**
════════════════════════════
💰 Balance : ${user.balance} LC
🤝 Invitations : ${user.invites}
📩 Messages : ${user.message_count || 0}
🎙️ Temps vocal : ${voiceTime}
📅 Date d'arrivée : ${joinDate}
════════════════════════════
🏆 Classement : #${ranking}
🎮 Jouées : ${gameStats.games_played} 🎉 Gagnées : ${gameStats.games_won}
════════════════════════════
📋 Mise à jour : ${updateDate} à ${updateTime}`;

        return message.reply(statsMessage);
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
