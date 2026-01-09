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
            
            // Create compact progress bar (10 sections, each representing 10%)
            const progressBarLength = 10;
            const filledLength = Math.floor((progress.progress / 100) * progressBarLength);
            const emptyLength = progressBarLength - filledLength;
            const progressBar = '█'.repeat(filledLength) + '░'.repeat(emptyLength);
            
            // Create compact single-line description
            const description = `🏆 Niveau : ${progress.level} | 🌟 Progression : [${progressBar}] ${progress.progress}% (${progress.currentLevelXP}/${progress.nextLevelXP} XP)`;
            
            // Create embed
            const embed = new EmbedBuilder()
                .setColor(config.colors.primary)
                .setTitle(`📊 Niveau de ${targetUser.username}`)
                .setDescription(description)
                .setThumbnail(targetUser.displayAvatarURL({ size: 128 }))
                .setFooter({ text: `${progress.nextLevelXP - progress.currentLevelXP} XP pour le niveau ${progress.level + 1}` })
                .setTimestamp();
            
            await message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error in niveau command:', error);
            await message.reply('❌ Une erreur est survenue lors de la récupération des informations de niveau.');
        }
    }
};
