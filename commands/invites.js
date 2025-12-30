const { EmbedBuilder } = require('discord.js');
const { db } = require('../database/db');
const config = require('../config.json');
const { getResponse } = require('../utils/responseHelper');

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
                .setTitle(getResponse('invites.count.title'))
                .setDescription(getResponse('invites.count.description', { invites: user.invites }))
                .setFooter({ text: getResponse('invites.count.footer') })
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        }

        return message.reply(getResponse('invites.invalidCommand'));
    }
};

async function handleTopInvites(message, args) {
    const topUsers = await db.getTopInvites(10);

    if (topUsers.length === 0) {
        return message.reply(getResponse('invites.top.noData'));
    }

    let description = '';
    for (let i = 0; i < topUsers.length; i++) {
        const user = topUsers[i];
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
        description += getResponse('invites.top.entry', {
            medal: medal,
            username: user.username,
            invites: user.invites
        });
    }

    const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle(getResponse('invites.top.title'))
        .setDescription(description)
        .setTimestamp();

    return message.reply({ embeds: [embed] });
}

module.exports.handleTopInvites = handleTopInvites;
