const { EmbedBuilder } = require('discord.js');
const { db } = require('../database/db');
const config = require('../config.json');

module.exports = {
    name: 'rankings',
    description: 'Display LC and Level rankings with podiums',
    
    async execute(message, args) {
        try {
            await this.displayRankings(message.channel);
            // Delete the command message to keep the channel clean
            await message.delete().catch(() => {});
        } catch (error) {
            console.error('Error displaying rankings:', error);
            await message.reply('❌ Une erreur est survenue lors de l\'affichage des classements.');
        }
    },

    /**
     * Display the rankings in a channel
     * @param {TextChannel} channel - The channel to display rankings in
     */
    async displayRankings(channel) {
        try {
            // Get top users
            const topLC = await db.getTopLC(10);
            const topLevels = await db.getTopLevels(10);

            // Create LC Podium Embed
            const lcPodiumEmbed = await this.createPodiumEmbed(
                channel.client,
                topLC.slice(0, 3),
                'LC',
                '💰 Podium LC',
                config.colors.gold,
                (user) => `${user.balance} LC`
            );

            // Create Levels Podium Embed
            const levelsPodiumEmbed = await this.createPodiumEmbed(
                channel.client,
                topLevels.slice(0, 3),
                'Levels',
                '⭐ Podium Niveaux',
                config.colors.primary,
                (user) => `Niveau ${user.level}`
            );

            // Create LC Rankings Table Embed
            const lcRankingsEmbed = this.createRankingsTableEmbed(
                topLC,
                '📊 Classement LC - Top 10',
                config.colors.blue,
                (user) => `${user.balance} LC`
            );

            // Create Levels Rankings Table Embed
            const levelsRankingsEmbed = this.createRankingsTableEmbed(
                topLevels,
                '🏆 Classement Niveaux - Top 10',
                config.colors.primary,
                (user) => `Niveau ${user.level}`
            );

            // Send the embeds
            await channel.send({ embeds: [lcPodiumEmbed] });
            await channel.send({ embeds: [levelsPodiumEmbed] });
            await channel.send({ embeds: [lcRankingsEmbed, levelsRankingsEmbed] });

        } catch (error) {
            console.error('Error in displayRankings:', error);
            throw error;
        }
    },

    /**
     * Create a podium embed with profile pictures
     * @param {Client} client - Discord client
     * @param {Array} topUsers - Top 3 users
     * @param {string} type - Type of ranking (LC or Levels)
     * @param {string} title - Embed title
     * @param {string} color - Embed color
     * @param {Function} valueFormatter - Function to format the value display
     */
    async createPodiumEmbed(client, topUsers, type, title, color, valueFormatter) {
        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(title)
            .setTimestamp();

        let description = '';

        for (let i = 0; i < Math.min(3, topUsers.length); i++) {
            const user = topUsers[i];
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
            
            // Fetch user from Discord to get avatar
            let discordUser;
            try {
                discordUser = await client.users.fetch(user.user_id);
            } catch (error) {
                console.error(`Could not fetch user ${user.user_id}:`, error.message);
            }

            const username = discordUser ? discordUser.username : user.username;
            const value = valueFormatter(user);

            // Add to description with appropriate spacing based on position
            if (i === 0) {
                // First place - larger spacing
                description += `\n**${medal} ${username}**\n`;
                description += `└─ ${value}\n`;
                if (discordUser) {
                    // Set the main thumbnail as 1st place user
                    embed.setThumbnail(discordUser.displayAvatarURL({ size: 256, dynamic: true }));
                }
            } else if (i === 1) {
                // Second place - medium spacing
                description += `\n**${medal} ${username}**\n`;
                description += `└─ ${value}\n`;
            } else {
                // Third place - smaller spacing
                description += `\n**${medal} ${username}**\n`;
                description += `└─ ${value}\n`;
            }
        }

        embed.setDescription(description || 'Aucune donnée disponible');
        return embed;
    },

    /**
     * Create a rankings table embed
     * @param {Array} topUsers - Top 10 users
     * @param {string} title - Embed title
     * @param {string} color - Embed color
     * @param {Function} valueFormatter - Function to format the value display
     */
    createRankingsTableEmbed(topUsers, title, color, valueFormatter) {
        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(title)
            .setTimestamp();

        let description = '';

        for (let i = 0; i < Math.min(10, topUsers.length); i++) {
            const user = topUsers[i];
            const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
            const value = valueFormatter(user);
            
            description += `${medal} **${user.username}** → ${value}\n`;
        }

        if (description === '') {
            description = 'Aucune donnée disponible';
        }

        embed.setDescription(description);
        return embed;
    },

    /**
     * Update rankings in the configured channel
     * @param {Client} client - Discord client
     */
    async updateRankingsChannel(client) {
        try {
            const rankingsChannelId = config.channels.rankings;
            if (!rankingsChannelId) {
                console.warn('⚠️ Rankings channel not configured');
                return;
            }

            const channel = await client.channels.fetch(rankingsChannelId);
            if (!channel) {
                console.error('❌ Could not fetch rankings channel');
                return;
            }

            // Delete previous messages in the channel (clean slate)
            const messages = await channel.messages.fetch({ limit: 100 });
            await channel.bulkDelete(messages).catch(() => {
                // If bulk delete fails, delete one by one
                messages.forEach(msg => msg.delete().catch(() => {}));
            });

            // Display new rankings
            await this.displayRankings(channel);
            
            console.log(`✅ Rankings updated in channel ${rankingsChannelId}`);
        } catch (error) {
            console.error('Error updating rankings channel:', error);
        }
    }
};
