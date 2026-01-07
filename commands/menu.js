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

module.exports = {
    name: 'menu',
    description: 'Display interactive menu with game categories',
    
    async execute(message, args) {
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
        
        const menuMessage = await message.reply({
            embeds: [mainMenuEmbed],
            components: [mainMenuRow]
        });
        
        // Create unified collector for all menu interactions
        const collector = menuMessage.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 120000 // 2 minutes
        });
        
        collector.on('collect', async (interaction) => {
            // Only allow the original user to interact
            if (interaction.user.id !== message.author.id) {
                return interaction.reply({
                    content: getResponse('menu.notYourMenu'),
                    ephemeral: true
                });
            }
            
            const selectedValue = interaction.values[0];
            
            // Handle main menu selections
            if (interaction.customId === 'main_menu') {
                switch (selectedValue) {
                    case 'jeux_solo':
                        await handleJeuxSolo(interaction);
                        break;
                    case 'jeux_1v1':
                        await handleJeux1v1(interaction);
                        break;
                    case 'casino':
                        await handleCasino(interaction);
                        break;
                    case 'statistiques':
                        await handleStatistiques(interaction);
                        break;
                }
            }
            // Handle jeux_solo submenu
            else if (interaction.customId === 'jeux_solo_submenu') {
                if (selectedValue === 'back') {
                    await recreateMainMenu(interaction);
                } else if (selectedValue === 'roulette') {
                    const infoEmbed = new EmbedBuilder()
                        .setColor(config.colors.success)
                        .setTitle('🎲 Roulette Multijoueur')
                        .setDescription('**Commande:** `!jeu roulette [montant]`\n\n**Comment jouer:**\n1️⃣ Rejoignez la roulette avec votre mise\n2️⃣ D\'autres joueurs peuvent rejoindre\n3️⃣ Après 30 secondes, un gagnant est choisi\n4️⃣ Le gagnant remporte le pot total!\n\n💰 Le pot augmente avec chaque joueur!')
                        .setTimestamp();
                    await interaction.reply({ embeds: [infoEmbed], ephemeral: true });
                }
            }
            // Handle submenu selections
            else if (interaction.customId === 'jeux_1v1_submenu') {
                if (selectedValue === 'back') {
                    await recreateMainMenu(interaction);
                } else if (selectedValue === 'rapide') {
                    const infoEmbed = new EmbedBuilder()
                        .setColor(config.colors.success)
                        .setTitle(getResponse('menu.submenu.jeux_1v1.rapide.title'))
                        .setDescription(getResponse('menu.submenu.jeux_1v1.rapide.info'))
                        .setTimestamp();
                    await interaction.reply({ embeds: [infoEmbed], ephemeral: true });
                } else if (selectedValue === 'duel') {
                    const infoEmbed = new EmbedBuilder()
                        .setColor(config.colors.success)
                        .setTitle(getResponse('menu.submenu.jeux_1v1.duel.title'))
                        .setDescription(getResponse('menu.submenu.jeux_1v1.duel.info'))
                        .setTimestamp();
                    await interaction.reply({ embeds: [infoEmbed], ephemeral: true });
                }
            }
            else if (interaction.customId === 'casino_submenu') {
                if (selectedValue === 'back') {
                    await recreateMainMenu(interaction);
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
                    await interaction.reply({ embeds: [infoEmbed], ephemeral: true });
                }
            }
        });
        
        collector.on('end', async () => {
            // Disable the menu after timeout
            mainMenuRow.components[0].setDisabled(true);
            await menuMessage.edit({ components: [mainMenuRow] }).catch(() => {});
        });
    }
};

async function handleJeuxSolo(interaction) {
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
    
    await interaction.update({
        embeds: [submenuEmbed],
        components: [submenuRow]
    });
}

async function handleJeux1v1(interaction) {
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
    
    await interaction.update({
        embeds: [submenuEmbed],
        components: [submenuRow]
    });
}

async function handleCasino(interaction) {
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
    
    await interaction.update({
        embeds: [submenuEmbed],
        components: [submenuRow]
    });
}

async function handleStatistiques(interaction) {
    const infoEmbed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle(getResponse('menu.submenu.statistiques.title'))
        .setDescription(getResponse('menu.submenu.statistiques.info'))
        .setTimestamp();
    
    await interaction.reply({ embeds: [infoEmbed], ephemeral: true });
}

async function recreateMainMenu(interaction) {
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
    
    await interaction.update({
        embeds: [mainMenuEmbed],
        components: [mainMenuRow]
    });
}
