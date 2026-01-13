const { EmbedBuilder } = require('discord.js');
const { db } = require('../database/db');
const config = require('../config.json');
const { getResponse } = require('../utils/responseHelper');

module.exports = {
    name: 'cadeau',
    description: 'Receive 100 LC as a daily gift',
    
    async execute(message, args) {
        const userId = message.author.id;
        const username = message.author.username;

        // Ensure user exists in database
        let user = await db.getUser(userId);
        if (!user) {
            user = await db.createUser(userId, username);
        }

        // Check if user has already claimed gift in the last 24 hours
        const lastGiftTime = user.last_gift_time ? new Date(user.last_gift_time).getTime() : 0;
        const currentTime = Date.now();
        const timeSinceLastGift = currentTime - lastGiftTime;
        const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const timeRemaining = Math.max(cooldownPeriod - timeSinceLastGift, 0);

        // If cooldown has not expired
        if (timeRemaining > 0) {
            const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
            const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
            
            const embed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setDescription(getResponse('cadeau.cooldown', { hours, minutes }))
                .setTimestamp();
            
            return message.channel.send({ embeds: [embed] });
        }

        // Update user's last_gift_time and add 100 LC
        try {
            await db.updateGiftTime(userId, new Date());
            await db.updateBalance(userId, 100, 'daily_gift');
            await db.recordTransaction(null, userId, 100, 'daily_gift', 'Daily gift via !cadeau');

            const embed = new EmbedBuilder()
                .setColor(config.colors.gold)
                .setDescription(getResponse('cadeau.success'))
                .setTimestamp();
            
            return message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error claiming gift:', error);
            return message.reply(getResponse('cadeau.error'));
        }
    }
};
