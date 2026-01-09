const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../database/db');
const config = require('../config.json');
const { getResponse } = require('../utils/responseHelper');
const { ITEMS } = require('../utils/inventoryItems');

module.exports = {
    name: 'sac',
    description: 'Display and manage your bonus items inventory',

    async execute(message, args) {
        const userId = message.author.id;
        const username = message.author.username;

        // Ensure user exists
        let user = await db.getUser(userId);
        if (!user) {
            user = await db.createUser(userId, username);
        }

        // Get inventory
        const inventory = await db.getInventory(userId);

        // Check for active multiplier
        const activeMultiplier = await db.getActiveMultiplier(userId);

        // Build embed
        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setTitle(`🎒 Sac de ${username}`)
            .setTimestamp();

        // Display active multiplier if any
        if (activeMultiplier) {
            embed.addFields({
                name: '⚡ Bonus Actif',
                value: `🎫 **Multiplieur x${activeMultiplier.multiplier_value}** - ${activeMultiplier.games_remaining} partie(s) restante(s)`,
                inline: false
            });
        }

        // Build inventory display
        if (inventory.length === 0) {
            embed.setDescription('Votre sac est vide. Jouez et gagnez des items bonus !');
            return message.reply({ embeds: [embed] });
        }

        // Create buttons for items with quantity > 0
        const buttons = [];
        let description = '**📦 Vos items disponibles:**\n\n';

        for (const item of inventory) {
            const itemDef = ITEMS[item.item_type];
            if (!itemDef) continue;

            description += `${itemDef.emoji} **${itemDef.name}** x${item.quantity}\n`;
            description += `└ *${itemDef.description}*\n\n`;

            // Add button for this item
            const button = new ButtonBuilder()
                .setCustomId(itemDef.buttonId)
                .setLabel(`${itemDef.buttonLabel} (${item.quantity})`)
                .setStyle(ButtonStyle.Primary);

            buttons.push(button);
        }

        embed.setDescription(description);

        // Create action rows (max 5 buttons per row)
        const actionRows = [];
        for (let i = 0; i < buttons.length; i += 5) {
            const row = new ActionRowBuilder()
                .addComponents(buttons.slice(i, i + 5));
            actionRows.push(row);
        }

        await message.reply({ 
            embeds: [embed],
            components: actionRows
        });
    },

    async handleButtonInteraction(interaction) {
        const userId = interaction.user.id;
        const username = interaction.user.username;

        // Ensure user exists
        let user = await db.getUser(userId);
        if (!user) {
            user = await db.createUser(userId, username);
        }

        const buttonId = interaction.customId;

        try {
            if (buttonId === 'use_tresor') {
                await handleTresorOpen(interaction, userId, username);
            } else if (buttonId === 'use_multiplier_x2') {
                await handleMultiplierActivation(interaction, userId, username, 'multiplier_x2', 2);
            } else if (buttonId === 'use_multiplier_x3') {
                await handleMultiplierActivation(interaction, userId, username, 'multiplier_x3', 3);
            }
        } catch (error) {
            console.error('Error handling button interaction:', error);
            await interaction.reply({
                content: getResponse('errors.commandExecutionError'),
                ephemeral: true
            }).catch(console.error);
        }
    }
};

async function handleTresorOpen(interaction, userId, username) {
    // Check if user has tresor item
    const tresorItem = await db.getInventoryItem(userId, 'tresor');
    
    if (!tresorItem || tresorItem.quantity <= 0) {
        return interaction.reply({
            content: '❌ Vous n\'avez pas de Trésor dans votre sac !',
            ephemeral: true
        });
    }

    // Remove one tresor from inventory
    await db.removeInventoryItem(userId, 'tresor', 1);

    // Show first animation: lock picking
    const lockPickingEmbed = new EmbedBuilder()
        .setColor(config.colors.warning)
        .setTitle('🗝️ Crochetage de la serrure...')
        .setDescription('✨ Le trésor s\'ouvre lentement...')
        .setTimestamp();

    await interaction.reply({ embeds: [lockPickingEmbed] });

    // Wait for animation effect
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Determine random LC reward (25, 50, or 100)
    const rewards = [25, 50, 100];
    const weights = [50, 35, 15]; // Probabilities: 50%, 35%, 15%
    const reward = weightedRandom(rewards, weights);
    
    // Log the tresor result for debugging
    console.log(`[Trésor] User ${username} (${userId}) opened a Trésor and won ${reward} LC`);

    // Add LC to user balance
    await db.updateBalance(userId, reward);
    await db.recordTransaction(null, userId, reward, 'tresor_reward', 'Trésor ouvert');

    // Show second animation: treasure opened
    const openedEmbed = new EmbedBuilder()
        .setColor(config.colors.gold)
        .setTitle('💎 Coffre ouvert !')
        .setDescription(`🎉 Félicitations ${username} !\n\n✨ Vous avez gagné **${reward} LC** 💰`)
        .setTimestamp();

    await interaction.editReply({ embeds: [openedEmbed] });

    // Update the original message to reflect the new inventory
    await updateInventoryDisplay(interaction, userId, username);
}

async function handleMultiplierActivation(interaction, userId, username, multiplierType, multiplierValue) {
    // Check if user already has an active multiplier
    const activeMultiplier = await db.getActiveMultiplier(userId);
    
    if (activeMultiplier) {
        return interaction.reply({
            content: `❌ Vous avez déjà un multiplieur x${activeMultiplier.multiplier_value} actif avec ${activeMultiplier.games_remaining} partie(s) restante(s) !`,
            ephemeral: true
        });
    }

    // Check if user has the multiplier item
    const multiplierItem = await db.getInventoryItem(userId, multiplierType);
    
    if (!multiplierItem || multiplierItem.quantity <= 0) {
        return interaction.reply({
            content: `❌ Vous n'avez pas de Multiplieur x${multiplierValue} dans votre sac !`,
            ephemeral: true
        });
    }

    // Remove one multiplier from inventory
    await db.removeInventoryItem(userId, multiplierType, 1);

    // Activate multiplier
    await db.activateMultiplier(userId, multiplierType, multiplierValue);

    // Send result
    const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle('🎫 Multiplieur Activé !')
        .setDescription(`✨ Multiplieur x${multiplierValue} activé !\n\nVos **2 prochaines parties** donneront **x${multiplierValue} LC** 🎮`)
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // Update the original message to reflect the new inventory
    await updateInventoryDisplay(interaction, userId, username);
}

async function updateInventoryDisplay(interaction, userId, username) {
    try {
        // Get updated inventory
        const inventory = await db.getInventory(userId);
        const activeMultiplier = await db.getActiveMultiplier(userId);

        // Build updated embed
        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setTitle(`🎒 Sac de ${username}`)
            .setTimestamp();

        // Display active multiplier if any
        if (activeMultiplier) {
            embed.addFields({
                name: '⚡ Bonus Actif',
                value: `🎫 **Multiplieur x${activeMultiplier.multiplier_value}** - ${activeMultiplier.games_remaining} partie(s) restante(s)`,
                inline: false
            });
        }

        // Build inventory display
        if (inventory.length === 0) {
            embed.setDescription('Votre sac est vide. Jouez et gagnez des items bonus !');
            
            // Update original message
            await interaction.message.edit({ 
                embeds: [embed],
                components: []
            });
            return;
        }

        // Create buttons for items with quantity > 0
        const buttons = [];
        let description = '**📦 Vos items disponibles:**\n\n';

        for (const item of inventory) {
            const itemDef = ITEMS[item.item_type];
            if (!itemDef) continue;

            description += `${itemDef.emoji} **${itemDef.name}** x${item.quantity}\n`;
            description += `└ *${itemDef.description}*\n\n`;

            // Add button for this item
            const button = new ButtonBuilder()
                .setCustomId(itemDef.buttonId)
                .setLabel(`${itemDef.buttonLabel} (${item.quantity})`)
                .setStyle(ButtonStyle.Primary);

            buttons.push(button);
        }

        embed.setDescription(description);

        // Create action rows (max 5 buttons per row)
        const actionRows = [];
        for (let i = 0; i < buttons.length; i += 5) {
            const row = new ActionRowBuilder()
                .addComponents(buttons.slice(i, i + 5));
            actionRows.push(row);
        }

        // Update original message
        await interaction.message.edit({ 
            embeds: [embed],
            components: actionRows
        });
    } catch (error) {
        console.error('Error updating inventory display:', error);
    }
}

// Weighted random selection helper
function weightedRandom(items, weights) {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            return items[i];
        }
    }
    
    return items[items.length - 1];
}
