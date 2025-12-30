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

async function handleTransfer(message, args) {
    const sender = message.author;
    const senderId = sender.id;

    const recipient = message.mentions.users.first();
    if (!recipient) {
        return message.reply('❌ Vous devez mentionner un utilisateur! Exemple: `!don @user 50`');
    }

    if (recipient.id === senderId) {
        return message.reply('❌ Vous ne pouvez pas vous transférer des LC à vous-même!');
    }

    if (recipient.bot) {
        return message.reply('❌ Vous ne pouvez pas transférer des LC à un bot!');
    }

    const amount = parseInt(args[1]);
    if (!amount || amount <= 0) {
        return message.reply('❌ Montant invalide! Le montant doit être un nombre positif.');
    }

    const recipientId = recipient.id;

    // Ensure both users exist
    let senderUser = await db.getUser(senderId);
    if (!senderUser) {
        senderUser = await db.createUser(senderId, sender.username);
    }

    let recipientUser = await db.getUser(recipientId);
    if (!recipientUser) {
        recipientUser = await db.createUser(recipientId, recipient.username);
    }

    // Check sender balance
    if (senderUser.balance < amount) {
        return message.reply(`❌ Vous n'avez pas assez de LC! Votre solde: ${senderUser.balance} LC`);
    }

    // Transfer LC
    try {
        await db.transferLC(senderId, recipientId, amount, 'User transfer');

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle(`${config.currency.symbol} Transfert réussi`)
            .setDescription(
                `${sender} a transféré **${amount} LC** à ${recipient}!\n\n` +
                `Nouveau solde: **${senderUser.balance - amount} LC**`
            )
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Transfer error:', error);
        return message.reply('❌ Erreur lors du transfert. Veuillez réessayer.');
    }
}

module.exports.handleTransfer = handleTransfer;
