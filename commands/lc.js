const { EmbedBuilder } = require('discord.js');
const { db } = require('../database/db');
const config = require('../config.json');

module.exports = {
    name: 'lc',
    description: 'Manage your LC (virtual coins)',
    
    async execute(message, args) {
        const userId = message.author.id;
        const username = message.author.username;

        // Ensure user exists in database
        let user = await db.getUser(userId);
        if (!user) {
            user = await db.createUser(userId, username);
        }

        // No arguments - show balance
        if (args.length === 0) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.primary)
                .setTitle(`${config.currency.symbol} Votre solde LC`)
                .setDescription(`**${user.balance} LC**`)
                .setFooter({ text: `Utilisez ${config.prefix}don pour transférer des LC` })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        return message.reply('❌ Commande invalide. Utilisez `!lc` pour voir votre solde ou `!don` pour transférer des LC.');
    }
};
