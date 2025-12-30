const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { db } = require('../database/db');
const config = require('../config.json');
const { getResponse } = require('../utils/responseHelper');

module.exports = {
    name: 'moderation',
    description: 'Moderation commands for admins',
    
    async execute(message, args, command) {
        // Check if user has administrator permission
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply(getResponse('moderation.noPermission'));
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
        return message.reply(getResponse('moderation.setlc.noUser'));
    }

    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount < 0) {
        return message.reply(getResponse('moderation.setlc.invalidAmount'));
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
        .setTitle(getResponse('moderation.setlc.success.title'))
        .setDescription(getResponse('moderation.setlc.success.description', {
            user: targetUser,
            amount: amount
        }))
        .setTimestamp();

    return message.reply({ embeds: [embed] });
}

async function handleSetInvites(message, args) {
    const targetUser = message.mentions.users.first();
    if (!targetUser) {
        return message.reply(getResponse('moderation.setinvites.noUser'));
    }

    const count = parseInt(args[1]);
    if (isNaN(count) || count < 0) {
        return message.reply(getResponse('moderation.setinvites.invalidCount'));
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
        .setTitle(getResponse('moderation.setinvites.success.title'))
        .setDescription(getResponse('moderation.setinvites.success.description', {
            user: targetUser,
            count: count
        }))
        .setTimestamp();

    return message.reply({ embeds: [embed] });
}
