const { EmbedBuilder } = require('discord.js');
const { db } = require('../database/db');
const config = require('../config.json');
const { getXPProgress } = require('../utils/xpHelper');

module.exports = {
    name: 'niveau',
    description: 'Display user level and XP progress in the levels channel',
    
    async execute(message, args) {
        try {
            // Check if command is used in the correct channel
            const levelsChannelId = config.channels.levelUpNotification;
            if (message.channel.id !== levelsChannelId) {
                await message.reply('⛔ Utilisez cette commande uniquement dans le salon des niveaux pour voir votre progression !');
                return;
            }
            
            // Get target user (always the message author)
            const targetUser = message.author;
            const userId = targetUser.id;
            
            // Get user data from database
            let user = await db.getUser(userId);
            if (!user) {
                // Create user if doesn't exist
                user = await db.createUser(userId, targetUser.username);
            }
            
            const totalXP = user.xp || 0;
            const progress = getXPProgress(totalXP);
            const xpNeeded = progress.nextLevelXP - progress.currentLevelXP;
            
            // Create progress bar (10 sections, each representing 10%)
            const progressBarLength = 10;
            const filledLength = Math.floor((progress.progress / 100) * progressBarLength);
            const emptyLength = progressBarLength - filledLength;
            const progressBar = '█'.repeat(filledLength) + '░'.repeat(emptyLength);
            
            // Create enhanced embed with detailed information
            const embed = new EmbedBuilder()
                .setColor(config.colors.primary)
                .setTitle(`👤 Niveau de ${targetUser.username}`)
                .setDescription(
                    `🆙 **Niveau Actuel :** ${progress.level}\n` +
                    `💪 **XP Actuel :** ${progress.currentLevelXP} / ${progress.nextLevelXP}\n` +
                    `📊 **Progression :** [${progressBar}] ${progress.progress}%\n` +
                    `Encore **${xpNeeded} XP** nécessaires pour atteindre le niveau suivant !\n\n` +
                    `Continuez à progresser pour débloquer des récompenses 🎁 !`
                )
                .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
                .setTimestamp();
            
            await message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Error in niveau command:', error);
            await message.reply('❌ Une erreur est survenue lors de la récupération des informations de niveau.');
        }
    }
};
