const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const { getResponse } = require('../utils/responseHelper');
const config = require('../config.json');
const { db, pool } = require('../database/db');

// Helper function to create main menu options
function createMainMenuOptions() {
    return [
        {
            label: 'Jeux Solo',
            description: 'Jeux en solo pour tester votre chance',
            value: 'jeux_solo',
            emoji: '🎮'
        },
        {
            label: 'Jeux 1v1',
            description: 'Défiez d\'autres joueurs',
            value: 'jeux_1v1',
            emoji: '🤼'
        },
        {
            label: 'Casino',
            description: 'Jeux de casino et paris',
            value: 'casino',
            emoji: '🎰'
        },
        {
            label: 'LC',
            description: 'Gérez votre monnaie virtuelle',
            value: 'lc',
            emoji: '🪙'
        },
        {
            label: 'Loto',
            description: 'Participez à la loterie',
            value: 'loto',
            emoji: '🎟'
        },
        {
            label: 'Statistiques',
            description: 'Consultez vos statistiques',
            value: 'statistiques',
            emoji: '📊'
        }
    ];
}

// Helper function to create and attach collector to a menu message
function attachMenuCollector(menuMessage, originalUserId, handleInteraction) {
    const collector = menuMessage.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 120000 // 2 minutes
    });
    
    collector.on('collect', async (interaction) => {
        // Only allow the original user to interact
        if (interaction.user.id !== originalUserId) {
            return interaction.reply({
                content: getResponse('menu.notYourMenu'),
                ephemeral: true
            });
        }
        
        await handleInteraction(interaction, originalUserId);
    });
    
    collector.on('end', async () => {
        // Try to disable the menu after timeout
        try {
            const components = menuMessage.components;
            if (components?.[0]?.components?.[0]?.data) {
                components[0].components[0].data.disabled = true;
                await menuMessage.edit({ components: components }).catch(() => {});
            }
        } catch (error) {
            // Menu message may have been deleted, ignore error
        }
    });
    
    return collector;
}

module.exports = {
    name: 'menu',
    description: 'Display interactive menu with game categories',
    
    async execute(message, args) {
        await showMainMenu(message, message.author.id);
    }
};

async function showMainMenu(messageOrInteraction, userId, isFollowUp = false) {
    const mainMenuEmbed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle(getResponse('menu.main.title'))
        .setDescription(getResponse('menu.main.description'))
        .setTimestamp();
    
    const mainMenuRow = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('main_menu')
                .setPlaceholder(getResponse('menu.main.placeholder'))
                .addOptions(createMainMenuOptions())
        );
    
    let menuMessage;
    if (isFollowUp) {
        // messageOrInteraction is an interaction
        menuMessage = await messageOrInteraction.followUp({
            embeds: [mainMenuEmbed],
            components: [mainMenuRow]
        });
    } else {
        // messageOrInteraction is a message
        menuMessage = await messageOrInteraction.reply({
            embeds: [mainMenuEmbed],
            components: [mainMenuRow]
        });
    }
    
    attachMenuCollector(menuMessage, userId, handleMainMenuInteraction);
}

async function handleMainMenuInteraction(interaction, userId) {
    const selectedValue = interaction.values[0];
    
    switch (selectedValue) {
        case 'jeux_solo':
            await handleJeuxSolo(interaction, userId);
            break;
        case 'jeux_1v1':
            await handleJeux1v1(interaction, userId);
            break;
        case 'casino':
            await handleCasino(interaction, userId);
            break;
        case 'lc':
            await handleLC(interaction, userId);
            break;
        case 'loto':
            await handleLoto(interaction, userId);
            break;
        case 'statistiques':
            await handleStatistiques(interaction, userId);
            break;
    }
}

async function handleJeuxSolo(interaction, userId) {
    const submenuEmbed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle(getResponse('menu.submenu.jeux_solo.title'))
        .setDescription(getResponse('menu.submenu.jeux_solo.description'))
        .setTimestamp();
    
    const submenuRow = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('jeux_solo_submenu')
                .setPlaceholder(getResponse('menu.submenu.placeholder'))
                .addOptions([
                    {
                        label: 'Roulette',
                        description: 'Pariez et tentez votre chance',
                        value: 'roulette',
                        emoji: '🎲'
                    },
                    {
                        label: 'Retour',
                        description: 'Retour au menu principal',
                        value: 'back',
                        emoji: '◀️'
                    }
                ])
        );
    
    // Delete the original dropdown message and send new submenu
    await interaction.deferUpdate();
    try {
        await interaction.message.delete();
    } catch (error) {
        console.error('Failed to delete menu message:', error);
    }
    
    const submenuMessage = await interaction.followUp({
        embeds: [submenuEmbed],
        components: [submenuRow]
    });
    
    attachMenuCollector(submenuMessage, userId, handleJeuxSoloInteraction);
}

async function handleJeuxSoloInteraction(interaction, userId) {
    const selectedValue = interaction.values[0];
    
    if (selectedValue === 'back') {
        await interaction.deferUpdate();
        try {
            await interaction.message.delete();
        } catch (error) {
            console.error('Failed to delete menu message:', error);
        }
        await showMainMenu(interaction, userId, true);
    } else if (selectedValue === 'roulette') {
        const infoEmbed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('🎲 Roulette Multijoueur')
            .setDescription('**Commande:** `!jeu roulette [montant]`\n\n**Comment jouer:**\n1️⃣ Rejoignez la roulette avec votre mise\n2️⃣ D\'autres joueurs peuvent rejoindre\n3️⃣ Après 30 secondes, un gagnant est choisi\n4️⃣ Le gagnant remporte le pot total!\n\n💰 Le pot augmente avec chaque joueur!')
            .setTimestamp();
        
        // Delete the menu message before showing info
        await interaction.deferUpdate();
        try {
            await interaction.message.delete();
        } catch (error) {
            console.error('Failed to delete menu message:', error);
        }
        
        await interaction.followUp({ embeds: [infoEmbed], ephemeral: true });
    }
}

async function handleJeux1v1(interaction, userId) {
    const submenuEmbed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle(getResponse('menu.submenu.jeux_1v1.title'))
        .setDescription(getResponse('menu.submenu.jeux_1v1.description'))
        .setTimestamp();
    
    const submenuRow = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('jeux_1v1_submenu')
                .setPlaceholder(getResponse('menu.submenu.placeholder'))
                .addOptions([
                    {
                        label: 'Jeu Rapide',
                        description: 'Défi de frappe rapide - !rapide @user [montant]',
                        value: 'rapide',
                        emoji: '⚡'
                    },
                    {
                        label: 'Duel',
                        description: 'Défi classique - !jeu duel @user [montant]',
                        value: 'duel',
                        emoji: '⚔️'
                    },
                    {
                        label: 'Retour',
                        description: 'Retour au menu principal',
                        value: 'back',
                        emoji: '◀️'
                    }
                ])
        );
    
    // Delete the original dropdown message and send new submenu
    await interaction.deferUpdate();
    try {
        await interaction.message.delete();
    } catch (error) {
        console.error('Failed to delete menu message:', error);
    }
    
    const submenuMessage = await interaction.followUp({
        embeds: [submenuEmbed],
        components: [submenuRow]
    });
    
    attachMenuCollector(submenuMessage, userId, handleJeux1v1Interaction);
}

async function handleJeux1v1Interaction(interaction, userId) {
    const selectedValue = interaction.values[0];
    
    if (selectedValue === 'back') {
        await interaction.deferUpdate();
        try {
            await interaction.message.delete();
        } catch (error) {
            console.error('Failed to delete menu message:', error);
        }
        await showMainMenu(interaction, userId, true);
    } else if (selectedValue === 'rapide') {
        const infoEmbed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle(getResponse('menu.submenu.jeux_1v1.rapide.title'))
            .setDescription(getResponse('menu.submenu.jeux_1v1.rapide.info'))
            .setTimestamp();
        
        // Delete the menu message before showing info
        await interaction.deferUpdate();
        try {
            await interaction.message.delete();
        } catch (error) {
            console.error('Failed to delete menu message:', error);
        }
        
        await interaction.followUp({ embeds: [infoEmbed], ephemeral: true });
    } else if (selectedValue === 'duel') {
        const infoEmbed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle(getResponse('menu.submenu.jeux_1v1.duel.title'))
            .setDescription(getResponse('menu.submenu.jeux_1v1.duel.info'))
            .setTimestamp();
        
        // Delete the menu message before showing info
        await interaction.deferUpdate();
        try {
            await interaction.message.delete();
        } catch (error) {
            console.error('Failed to delete menu message:', error);
        }
        
        await interaction.followUp({ embeds: [infoEmbed], ephemeral: true });
    }
}

async function handleCasino(interaction, userId) {
    const submenuEmbed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle(getResponse('menu.submenu.casino.title'))
        .setDescription(getResponse('menu.submenu.casino.description'))
        .setTimestamp();
    
    const submenuRow = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('casino_submenu')
                .setPlaceholder(getResponse('menu.submenu.placeholder'))
                .addOptions([
                    {
                        label: 'Roulette',
                        description: 'Pariez sur une couleur - !roue [montant] [couleur]',
                        value: 'roue',
                        emoji: '🎯'
                    },
                    {
                        label: 'Blackjack',
                        description: 'Affrontez le croupier - !bj [montant]',
                        value: 'blackjack',
                        emoji: '🃏'
                    },
                    {
                        label: 'Machine à sous',
                        description: 'Tentez le jackpot - !machine [montant]',
                        value: 'machine',
                        emoji: '🎰'
                    },
                    {
                        label: 'Retour',
                        description: 'Retour au menu principal',
                        value: 'back',
                        emoji: '◀️'
                    }
                ])
        );
    
    // Delete the original dropdown message and send new submenu
    await interaction.deferUpdate();
    try {
        await interaction.message.delete();
    } catch (error) {
        console.error('Failed to delete menu message:', error);
    }
    
    const submenuMessage = await interaction.followUp({
        embeds: [submenuEmbed],
        components: [submenuRow]
    });
    
    attachMenuCollector(submenuMessage, userId, handleCasinoInteraction);
}

async function handleCasinoInteraction(interaction, userId) {
    const selectedValue = interaction.values[0];
    
    if (selectedValue === 'back') {
        await interaction.deferUpdate();
        try {
            await interaction.message.delete();
        } catch (error) {
            console.error('Failed to delete menu message:', error);
        }
        await showMainMenu(interaction, userId, true);
    } else {
        let infoEmbed;
        if (selectedValue === 'roue') {
            infoEmbed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle(getResponse('menu.submenu.casino.roue.title'))
                .setDescription(getResponse('menu.submenu.casino.roue.info'))
                .setTimestamp();
        } else if (selectedValue === 'blackjack') {
            infoEmbed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle(getResponse('menu.submenu.casino.blackjack.title'))
                .setDescription(getResponse('menu.submenu.casino.blackjack.info'))
                .setTimestamp();
        } else if (selectedValue === 'machine') {
            infoEmbed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle(getResponse('menu.submenu.casino.machine.title'))
                .setDescription(getResponse('menu.submenu.casino.machine.info'))
                .setTimestamp();
        }
        
        // Delete the menu message before showing info
        await interaction.deferUpdate();
        try {
            await interaction.message.delete();
        } catch (error) {
            console.error('Failed to delete menu message:', error);
        }
        
        await interaction.followUp({ embeds: [infoEmbed], ephemeral: true });
    }
}

async function handleLC(interaction, userId) {
    const submenuEmbed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle(getResponse('menu.submenu.lc.title'))
        .setDescription(getResponse('menu.submenu.lc.description'))
        .setTimestamp();
    
    const submenuRow = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('lc_submenu')
                .setPlaceholder(getResponse('menu.submenu.placeholder'))
                .addOptions([
                    {
                        label: 'Voir mon solde',
                        description: 'Consultez votre solde de LC',
                        value: 'balance',
                        emoji: '💰'
                    },
                    {
                        label: 'Voir le solde d\'un autre utilisateur',
                        description: 'Consultez le solde d\'un membre',
                        value: 'balance_other',
                        emoji: '👤'
                    },
                    {
                        label: 'Transférer LC',
                        description: 'Envoyez des LC à quelqu\'un',
                        value: 'transfer',
                        emoji: '💸'
                    },
                    {
                        label: 'Retour',
                        description: 'Retour au menu principal',
                        value: 'back',
                        emoji: '◀️'
                    }
                ])
        );
    
    // Delete the original dropdown message and send new submenu
    await interaction.deferUpdate();
    try {
        await interaction.message.delete();
    } catch (error) {
        console.error('Failed to delete menu message:', error);
    }
    
    const submenuMessage = await interaction.followUp({
        embeds: [submenuEmbed],
        components: [submenuRow]
    });
    
    attachMenuCollector(submenuMessage, userId, handleLCInteraction);
}

async function handleLCInteraction(interaction, userId) {
    const selectedValue = interaction.values[0];
    
    if (selectedValue === 'back') {
        await interaction.deferUpdate();
        try {
            await interaction.message.delete();
        } catch (error) {
            console.error('Failed to delete menu message:', error);
        }
        await showMainMenu(interaction, userId, true);
    } else {
        // Delete the menu message before showing info
        await interaction.deferUpdate();
        try {
            await interaction.message.delete();
        } catch (error) {
            console.error('Failed to delete menu message:', error);
        }
        
        let response;
        if (selectedValue === 'balance') {
            // Get actual balance and show it immediately with command hint
            try {
                let user = await db.getUser(userId);
                if (!user) {
                    user = await db.createUser(userId, interaction.user.username);
                }
                
                response = `🪙 Votre solde actuel est **${user.balance} LC**.
(Astuce : tapez \`!lc\` pour consulter votre solde plus rapidement la prochaine fois.)`;
            } catch (error) {
                console.error('Error fetching user balance:', error);
                response = `❌ Une erreur est survenue lors de la récupération de votre solde.
(Astuce : tapez \`!lc\` pour consulter votre solde.)`;
            }
        } else if (selectedValue === 'balance_other') {
            response = getResponse('menu.submenu.lc.balance_other.info');
        } else if (selectedValue === 'transfer') {
            response = `💸 Pour transférer des LC à quelqu'un, utilisez : 
\`!don @user [montant]\` 
(Exemple : \`!don @Premsito 500\`)`;
        }
        
        await interaction.followUp({ content: response, ephemeral: true });
    }
}

async function handleLoto(interaction, userId) {
    const submenuEmbed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle(getResponse('menu.submenu.loto.title'))
        .setDescription(getResponse('menu.submenu.loto.description'))
        .setTimestamp();
    
    const submenuRow = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('loto_submenu')
                .setPlaceholder(getResponse('menu.submenu.placeholder'))
                .addOptions([
                    {
                        label: 'Acheter des tickets',
                        description: 'Achetez des tickets de loterie',
                        value: 'acheter',
                        emoji: '🎫'
                    },
                    {
                        label: 'Voir vos tickets',
                        description: 'Consultez vos tickets actifs',
                        value: 'voir',
                        emoji: '🎟'
                    },
                    {
                        label: 'Jackpot actuel',
                        description: 'Voir le montant du jackpot',
                        value: 'jackpot',
                        emoji: '💰'
                    },
                    {
                        label: 'Retour',
                        description: 'Retour au menu principal',
                        value: 'back',
                        emoji: '◀️'
                    }
                ])
        );
    
    // Delete the original dropdown message and send new submenu
    await interaction.deferUpdate();
    try {
        await interaction.message.delete();
    } catch (error) {
        console.error('Failed to delete menu message:', error);
    }
    
    const submenuMessage = await interaction.followUp({
        embeds: [submenuEmbed],
        components: [submenuRow]
    });
    
    attachMenuCollector(submenuMessage, userId, handleLotoInteraction);
}

async function handleLotoInteraction(interaction, userId) {
    const selectedValue = interaction.values[0];
    
    if (selectedValue === 'back') {
        await interaction.deferUpdate();
        try {
            await interaction.message.delete();
        } catch (error) {
            console.error('Failed to delete menu message:', error);
        }
        await showMainMenu(interaction, userId, true);
    } else {
        let infoEmbed;
        if (selectedValue === 'acheter') {
            infoEmbed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle(getResponse('menu.submenu.loto.acheter.title'))
                .setDescription(getResponse('menu.submenu.loto.acheter.info'))
                .setTimestamp();
        } else if (selectedValue === 'voir') {
            infoEmbed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle(getResponse('menu.submenu.loto.voir.title'))
                .setDescription(getResponse('menu.submenu.loto.voir.info'))
                .setTimestamp();
        } else if (selectedValue === 'jackpot') {
            infoEmbed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle(getResponse('menu.submenu.loto.jackpot.title'))
                .setDescription(getResponse('menu.submenu.loto.jackpot.info'))
                .setTimestamp();
        }
        
        // Delete the menu message before showing info
        await interaction.deferUpdate();
        try {
            await interaction.message.delete();
        } catch (error) {
            console.error('Failed to delete menu message:', error);
        }
        
        await interaction.followUp({ embeds: [infoEmbed], ephemeral: true });
    }
}

async function handleStatistiques(interaction, userId) {
    const submenuEmbed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle(getResponse('menu.submenu.statistiques.title'))
        .setDescription(getResponse('menu.submenu.statistiques.description'))
        .setTimestamp();
    
    const submenuRow = new ActionRowBuilder()
        .addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('statistiques_submenu')
                .setPlaceholder(getResponse('menu.submenu.placeholder'))
                .addOptions([
                    {
                        label: 'Voir mes stats',
                        description: 'Consultez vos propres statistiques',
                        value: 'stats_own',
                        emoji: '📈'
                    },
                    {
                        label: 'Voir stats utilisateur',
                        description: 'Voir les stats d\'un autre membre',
                        value: 'stats_other',
                        emoji: '👤'
                    },
                    {
                        label: 'Retour',
                        description: 'Retour au menu principal',
                        value: 'back',
                        emoji: '◀️'
                    }
                ])
        );
    
    // Delete the original dropdown message and send new submenu
    await interaction.deferUpdate();
    try {
        await interaction.message.delete();
    } catch (error) {
        console.error('Failed to delete menu message:', error);
    }
    
    const submenuMessage = await interaction.followUp({
        embeds: [submenuEmbed],
        components: [submenuRow]
    });
    
    attachMenuCollector(submenuMessage, userId, handleStatistiquesInteraction);
}

async function handleStatistiquesInteraction(interaction, userId) {
    const selectedValue = interaction.values[0];
    
    if (selectedValue === 'back') {
        await interaction.deferUpdate();
        try {
            await interaction.message.delete();
        } catch (error) {
            console.error('Failed to delete menu message:', error);
        }
        await showMainMenu(interaction, userId, true);
    } else if (selectedValue === 'stats_own') {
        // Delete the menu message before showing info
        await interaction.deferUpdate();
        try {
            await interaction.message.delete();
        } catch (error) {
            console.error('Failed to delete menu message:', error);
        }
        
        // Get actual stats and show them immediately with command hint
        try {
            const username = interaction.user.username;
            
            // Ensure user exists in database
            let user = await db.getUser(userId);
            if (!user) {
                user = await db.createUser(userId, username);
            }

            // Get game statistics
            const gameStatsResult = await pool.query(
                `SELECT 
                    COUNT(*) as games_played,
                    COUNT(CASE WHEN result = 'win' THEN 1 END) as games_won
                 FROM game_history 
                 WHERE player_id = $1`,
                [userId]
            );
            
            const gameStats = gameStatsResult.rows[0] || { games_played: 0, games_won: 0 };

            // Fetch member data from Discord API to get accurate join date
            let joinDate = 'N/A';
            let joinDateLabel = '📅 **Arrivé**       :';
            
            try {
                // Force refresh member cache to ensure accurate data
                const member = await interaction.guild.members.fetch(userId);
                
                if (member && member.joinedAt) {
                    // Use Discord server join date
                    joinDate = member.joinedAt.toLocaleDateString('fr-FR');
                } else if (interaction.user.createdAt) {
                    // Fallback to account creation date with clear indication
                    joinDate = `${interaction.user.createdAt.toLocaleDateString('fr-FR')} (compte créé)`;
                    joinDateLabel = '📅 **Compte créé**  :';
                }
            } catch (fetchError) {
                console.error(`[Stats Menu] Error fetching member data:`, fetchError);
                
                // Try fallback to user creation date
                if (interaction.user.createdAt) {
                    joinDate = `${interaction.user.createdAt.toLocaleDateString('fr-FR')} (compte créé)`;
                    joinDateLabel = '📅 **Compte créé**  :';
                }
            }

            // Format voice time (convert seconds to hours and minutes)
            const voiceTime = formatVoiceTime(user.voice_time || 0);

            // Format current time
            const now = new Date();
            const updateTime = now.toLocaleString('fr-FR', { 
                hour: '2-digit', 
                minute: '2-digit'
            });
            
            // Create compact stats message
            const statsMessage = 
`🏆 **Profil : @${username}**
╔════════════════════════════════╗
║ 💰 **Balance**      : ${user.balance} LC
║ 🤝 **Invitations**  : ${user.invites}
║ 📩 **Messages**     : ${user.message_count || 0}
║ 🎙️ **Temps vocal**  : ${voiceTime}
║ ${joinDateLabel} ${joinDate}
╠════════════════════════════════╣
║ 🎮 **Jouées**       : ${gameStats.games_played}
║ 🎉 **Gagnées**      : ${gameStats.games_won}
╚════════════════════════════════╝
📋 Mise à jour : Aujourd'hui à ${updateTime}

(Astuce : tapez \`!stats\` pour consulter vos statistiques plus rapidement la prochaine fois.)`;

            await interaction.followUp({ content: statsMessage, ephemeral: true });
        } catch (error) {
            console.error('Error fetching user stats:', error);
            const errorMessage = `❌ Une erreur est survenue lors de la récupération de vos statistiques.
(Astuce : tapez \`!stats\` pour consulter vos statistiques.)`;
            await interaction.followUp({ content: errorMessage, ephemeral: true });
        }
    } else if (selectedValue === 'stats_other') {
        // Delete the menu message before showing info
        await interaction.deferUpdate();
        try {
            await interaction.message.delete();
        } catch (error) {
            console.error('Failed to delete menu message:', error);
        }
        
        const response = getResponse('menu.submenu.statistiques.other.info');
        await interaction.followUp({ content: response, ephemeral: true });
    }
}

// Helper function to format voice time
function formatVoiceTime(seconds) {
    if (seconds === 0) {
        return '0m';
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}
