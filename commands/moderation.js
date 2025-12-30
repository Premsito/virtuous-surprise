const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { db } = require('../database/db');
const config = require('../config.json');

module.exports = {
    name: 'moderation',
    description: 'Moderation commands for admins',
    
    async execute(message, args, command) {
        // Check if user has administrator permission
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ Vous devez être administrateur pour utiliser cette commande!');
        }

        if (command === 'setlc') {
            return handleSetLC(message, args);
        } else if (command === 'setinvites') {
            return handleSetInvites(message, args);
        } else if (command === 'topinvites') {
            return handleTopInvites(message, args);
        } else if (command === 'don') {
            return handleTransfer(message, args);
        }
    }
};

async function handleSetLC(message, args) {
    const targetUser = message.mentions.users.first();
    if (!targetUser) {
        return message.reply('❌ Vous devez mentionner un utilisateur! Exemple: `!setlc @user 500`');
    }

    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount < 0) {
        return message.reply('❌ Montant invalide! Le montant doit être un nombre positif.');
    }

    const targetId = targetUser.id;
    
    // Ensure user exists
    let user = await db.getUser(targetId);
    if (!user) {
        user = await db.createUser(targetId, targetUser.username);
    }

    // Set balance
    await db.setBalance(targetId, amount);
    
    // Record transaction
    await db.recordTransaction(null, targetId, amount, 'admin_set', `Admin set balance to ${amount}`);

    const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle('✅ Balance mise à jour')
        .setDescription(`Le solde de ${targetUser} a été défini à **${amount} LC**`)
        .setTimestamp();

    return message.reply({ embeds: [embed] });
}

async function handleSetInvites(message, args) {
    const targetUser = message.mentions.users.first();
    if (!targetUser) {
        return message.reply('❌ Vous devez mentionner un utilisateur! Exemple: `!setinvites @user 10`');
    }

    const count = parseInt(args[1]);
    if (isNaN(count) || count < 0) {
        return message.reply('❌ Nombre invalide! Le nombre doit être un entier positif.');
    }

    const targetId = targetUser.id;
    
    // Ensure user exists
    let user = await db.getUser(targetId);
    if (!user) {
        user = await db.createUser(targetId, targetUser.username);
    }

    // Set invites
    await db.setInvites(targetId, count);

    const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle('✅ Invitations mises à jour')
        .setDescription(`Les invitations de ${targetUser} ont été définies à **${count}**`)
        .setTimestamp();

    return message.reply({ embeds: [embed] });
}

async function handleTopInvites(message, args) {
    const topUsers = await db.getTopInvites(10);

    if (topUsers.length === 0) {
        return message.reply('❌ Aucune donnée d\'invitation disponible.');
    }

    let description = '';
    for (let i = 0; i < topUsers.length; i++) {
        const user = topUsers[i];
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        description += `${medal} **${user.username}** - ${user.invites} invitation(s)\n`;
    }

    const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle('🏆 Top invitations')
        .setDescription(description)
        .setTimestamp();

    return message.reply({ embeds: [embed] });
}

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
