const { EmbedBuilder } = require('discord.js');
const { db } = require('../database/db');
const config = require('../config.json');
const { getResponse } = require('../utils/responseHelper');

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
                .setTitle(getResponse('lc.balance.title'))
                .setDescription(getResponse('lc.balance.description', { balance: user.balance }))
                .setFooter({ text: getResponse('lc.balance.footer') })
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        return message.reply(getResponse('lc.invalidCommand'));
    }
};

async function handleTransfer(message, args) {
    const sender = message.author;
    const senderId = sender.id;

    const recipient = message.mentions.users.first();
    if (!recipient) {
        return message.reply(getResponse('transfer.noRecipient'));
    }

    if (recipient.id === senderId) {
        return message.reply(getResponse('transfer.selfTransfer'));
    }

    if (recipient.bot) {
        return message.reply(getResponse('transfer.botTransfer'));
    }

    const amount = parseInt(args[1]);
    if (!amount || amount <= 0) {
        return message.reply(getResponse('transfer.invalidAmount'));
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
        return message.reply(getResponse('transfer.insufficientBalance', { balance: senderUser.balance }));
    }

    // Transfer LC
    try {
        await db.transferLC(senderId, recipientId, amount, 'User transfer');

        const embed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle(getResponse('transfer.success.title'))
            .setDescription(getResponse('transfer.success.description', {
                sender: sender,
                amount: amount,
                recipient: recipient,
                newBalance: senderUser.balance - amount
            }))
            .setTimestamp();

        return message.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Transfer error:', error);
        return message.reply(getResponse('transfer.error'));
    }
}

module.exports.handleTransfer = handleTransfer;
