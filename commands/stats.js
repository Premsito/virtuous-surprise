const { EmbedBuilder } = require('discord.js');
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

        // Note: Message count is not tracked in current schema
        // Using 'N/A' as placeholder
        const messageCount = 'N/A';

        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setTitle(getResponse('stats.title', { username: username }))
            .setDescription(
                getResponse('stats.balance', { balance: user.balance }) + '\n' +
                getResponse('stats.invites', { invites: user.invites }) + '\n' +
                getResponse('stats.messages', { messages: messageCount }) + '\n' +
                getResponse('stats.gamesPlayed', { gamesPlayed: gameStats.games_played }) + '\n' +
                getResponse('stats.gamesWon', { gamesWon: gameStats.games_won })
            )
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    }
};
