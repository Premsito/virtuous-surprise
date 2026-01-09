const { EmbedBuilder } = require('discord.js');
const { db } = require('../database/db');
const config = require('../config.json');
const { getXPProgress } = require('../utils/xpHelper');

module.exports = {
    name: 'niveau',
    description: 'Display user level and XP progress',
    
    async execute(message, args) {
        try {
            // Get target user (mention or self)
            const targetUser = message.mentions.users.first() || message.author;
            const userId = targetUser.id;
            
            // Get user data from database
            let user = await db.getUser(userId);
            if (!user) {
                // Create user if doesn't exist
                user = await db.createUser(userId, targetUser.username);
            }
            
            const totalXP = user.xp || 0;
            const progress = getXPProgress(totalXP);
            
            // Create progress bar (20 characters)
            const progressBarLength = 20;
            const filledLength = Math.floor((progress.progress / 100) * progressBarLength);
            const emptyLength = progressBarLength - filledLength;
            const progressBar = '█'.repeat(filledLength) + '░'.repeat(emptyLength);
            
            // Create embed
            const embed = new EmbedBuilder()
                .setColor(config.colors.primary)
                .setTitle(`📊 Niveau de ${targetUser.username}`)
                .setThumbnail(targetUser.displayAvatarURL({ size: 128 }))
                .addFields(
                    {
                        name: '🎯 Niveau',
                        value: `**${progress.level}**`,
                        inline: true
                    },
                    {
                        name: '⭐ XP Total',
                        value: `**${totalXP.toLocaleString()}**`,
                        inline: true
                    },
                    {
                        name: '📈 Progression',
                        value: `\`${progressBar}\` ${progress.progress}%\n${progress.currentLevelXP} / ${progress.nextLevelXP} XP`,
                        inline: false
                    }
                )
                .setFooter({ text: `${progress.nextLevelXP - progress.currentLevelXP} XP pour le niveau ${progress.level + 1}` })
                .setTimestamp();
            
            await message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error in niveau command:', error);
            await message.reply('❌ Une erreur est survenue lors de la récupération des informations de niveau.');
        }
    }
};
