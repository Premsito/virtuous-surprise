const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'pp',
    description: 'Afficher l\'avatar d\'un utilisateur ou du demandeur si aucun utilisateur n\'est mentionné.',
    
    async execute(message, args) {
        try {
            const targetUser = message.mentions.users.first() || message.author;
            const avatarUrl = targetUser.displayAvatarURL({ size: 512, dynamic: true });

            const embed = new EmbedBuilder()
                .setColor('#0099ff')
                .setTitle(`Avatar de ${targetUser.username}`)
                .setImage(avatarUrl)
                .setFooter({ text: `Demandé par ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) });

            await message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('[Avatar Command Error]', error);
            await message.reply('❌ Une erreur est survenue lors de l\'affichage de l\'avatar.');
        }
    },
};
