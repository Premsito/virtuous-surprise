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
