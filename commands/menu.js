const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const { getResponse } = require('../utils/responseHelper');
const config = require('../config.json');

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
            if (components && components.length > 0) {
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
        case 'statistiques':
            await handleStatistiques(interaction);
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

async function handleStatistiques(interaction) {
    const infoEmbed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle(getResponse('menu.submenu.statistiques.title'))
        .setDescription(getResponse('menu.submenu.statistiques.info'))
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
