const { EmbedBuilder } = require('discord.js');
const { db } = require('../database/db');
const config = require('../config.json');

module.exports = {
    name: 'invites',
    description: 'Track and display invite statistics',
    
    async execute(message, args, client) {
        const subcommand = args[0];

        if (!subcommand || subcommand === 'me') {
            // Show user's invite count
            const userId = message.author.id;
            const username = message.author.username;

            let user = await db.getUser(userId);
            if (!user) {
                user = await db.createUser(userId, username);
            }

            const embed = new EmbedBuilder()
                .setColor(config.colors.primary)
                .setTitle('📊 Vos invitations')
                .setDescription(`Vous avez **${user.invites}** invitation(s) réussie(s)`)
                .setFooter({ text: 'Invitez des amis pour gagner des LC!' })
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }

        return message.reply('❌ Commande invalide. Utilisez `!invites` pour voir vos invitations.');
    }
};
