const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../database/db');
const config = require('../config.json');
const { getResponse } = require('../utils/responseHelper');
const { isAdmin } = require('../utils/adminHelper');

// Constants
const MS_PER_MINUTE = 60000; // Milliseconds in one minute
const COLLECTOR_TIMEOUT_MS = 60000; // Message collector timeout (60 seconds)

// Store active giveaway timers
const giveawayTimers = new Map();

module.exports = {
    name: 'giveaway',
    description: 'Giveaway system - create and manage giveaways',
    
    async execute(message, args) {
        const subcommand = args[0]?.toLowerCase();
        
        // If no subcommand, open interactive menu
        if (!subcommand) {
            return handleInteractiveMenu(message);
        }
        
        switch (subcommand) {
            case 'créer':
            case 'creer':
            case 'create':
                return handleCreate(message, args.slice(1));
            case 'terminer':
            case 'end':
                return handleEnd(message, args.slice(1));
            case 'winner':
            case 'gagnant':
                return handleWinner(message, args.slice(1));
            default:
                return message.reply(getResponse('giveaway.invalidCommand'));
        }
    },

    // Handle button interaction for participation
    async handleButtonInteraction(interaction) {
        // Handle participation button
        if (interaction.customId.startsWith('giveaway_join_')) {
            const giveawayId = parseInt(interaction.customId.replace('giveaway_join_', ''));
            
            // Validate giveaway ID
            if (isNaN(giveawayId)) {
                return interaction.reply({ 
                    content: getResponse('giveaway.error'), 
                    ephemeral: true 
                });
            }
            
            // Get giveaway details
            const giveaway = await db.getGiveaway(giveawayId);
            if (!giveaway) {
                return interaction.reply({ 
                    content: getResponse('giveaway.notFound'), 
                    ephemeral: true 
                });
            }

            // Check if giveaway is still active (both status and time check for robustness)
            // Status check handles manual ending, time check handles expired but not yet ended
            if (giveaway.status !== 'active' || new Date() > new Date(giveaway.end_time)) {
                return interaction.reply({ 
                    content: getResponse('giveaway.alreadyEnded'), 
                    ephemeral: true 
                });
            }

            // Try to join
            const joined = await db.joinGiveaway(giveawayId, interaction.user.id);
            if (!joined) {
                return interaction.reply({ 
                    content: getResponse('giveaway.alreadyJoined'), 
                    ephemeral: true 
                });
            }

            // Update participant count in the embed
            await updateGiveawayEmbed(interaction.message, giveaway);

            return interaction.reply({ 
                content: getResponse('giveaway.joined'), 
                ephemeral: true 
            });
        }
    }
};

// Interactive menu handler - now handles single-response format
async function handleInteractiveMenu(message) {
    // Check if user is admin
    if (!isAdmin(message.author.id)) {
        return message.reply(getResponse('giveaway.permissionDenied'));
    }

    // Send prompt for single-response format
    const promptMessage = await message.reply(getResponse('giveaway.singleResponse.prompt'));
    
    // Delete the command message (fire-and-forget, errors expected if message already deleted)
    await message.delete().catch(() => {
        // Ignore deletion errors - message may already be deleted
    });

    // Create message collector to get user input
    const filter = m => m.author.id === message.author.id;
    const collector = message.channel.createMessageCollector({ 
        filter, 
        max: 1, 
        time: COLLECTOR_TIMEOUT_MS 
    });

    collector.on('collect', async (m) => {
        const input = m.content.trim();
        
        // Delete user's input message (fire-and-forget, errors expected if message already deleted)
        await m.delete().catch(() => {
            // Ignore deletion errors - message may already be deleted
        });

        // Delete the prompt message
        await promptMessage.delete().catch(() => {
            // Ignore deletion errors - message may already be deleted
        });

        // Parse the input format: [Titre] | [Récompense] | [Durée] | [Gagnants] | [Quantité]
        const parts = input.split('|').map(p => p.trim());
        
        if (parts.length !== 5) {
            const errorReply = await message.channel.send(getResponse('giveaway.singleResponse.invalidFormat'));
            // Auto-delete error after 5 seconds
            setTimeout(async () => {
                try {
                    await errorReply.delete();
                } catch (error) {
                    // Ignore deletion errors
                }
            }, 5000);
            return;
        }

        const [title, reward, durationStr, winnersStr, quantityStr] = parts;

        // Validate all fields
        if (!title || !reward) {
            const errorReply = await message.channel.send(getResponse('giveaway.singleResponse.invalidFormat'));
            setTimeout(async () => {
                try {
                    await errorReply.delete();
                } catch (error) {
                    // Ignore deletion errors
                }
            }, 5000);
            return;
        }

        const duration = parseInt(durationStr);
        if (isNaN(duration) || duration <= 0) {
            const errorReply = await message.channel.send(getResponse('giveaway.create.invalidDuration'));
            setTimeout(async () => {
                try {
                    await errorReply.delete();
                } catch (error) {
                    // Ignore deletion errors
                }
            }, 5000);
            return;
        }

        const winners = parseInt(winnersStr);
        if (isNaN(winners) || winners <= 0) {
            const errorReply = await message.channel.send(getResponse('giveaway.create.invalidWinners'));
            setTimeout(async () => {
                try {
                    await errorReply.delete();
                } catch (error) {
                    // Ignore deletion errors
                }
            }, 5000);
            return;
        }

        const quantity = parseInt(quantityStr);
        if (isNaN(quantity) || quantity <= 0) {
            const errorReply = await message.channel.send(getResponse('giveaway.create.invalidQuantity'));
            setTimeout(async () => {
                try {
                    await errorReply.delete();
                } catch (error) {
                    // Ignore deletion errors
                }
            }, 5000);
            return;
        }

        // All validations passed, launch the giveaway
        const config = {
            title,
            reward,
            duration,
            winners,
            quantity
        };

        await launchGiveaway(message.channel, config, message.author.id);
    });

    collector.on('end', async (collected, reason) => {
        if (reason === 'time') {
            try {
                // Delete the prompt message if it still exists
                await promptMessage.delete().catch(() => {
                    // Ignore deletion errors
                });
                
                const timeoutReply = await message.channel.send(getResponse('giveaway.singleResponse.timeout'));
                
                // Auto-delete timeout message after 5 seconds
                setTimeout(async () => {
                    try {
                        await timeoutReply.delete();
                    } catch (error) {
                        // Ignore deletion errors
                    }
                }, 5000);
            } catch (error) {
                // Ignore errors if message has expired
            }
        }
    });
}

// Launch the configured giveaway
async function launchGiveaway(channel, config, creatorId) {
    try {
        // Create giveaway in database
        const giveaway = await db.createGiveaway(
            config.title,
            config.reward,
            config.duration,
            config.winners,
            config.quantity,
            channel.id,
            creatorId
        );

        // Create embed
        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🎉 GIVEAWAY 🎁')
            .setDescription(
                `🌟 **Récompense** : ${config.reward} x${config.quantity}\n` +
                `🏆 **Nombre de gagnants** : ${config.winners}\n` +
                `👥 **Participants** : 0\n\n` +
                `⏲️ **Fin dans** : ${config.duration} minute${config.duration > 1 ? 's' : ''}\n` +
                `📢 Cliquez sur Participer pour tenter votre chance !`
            )
            .setTimestamp(new Date(giveaway.end_time))
            .setFooter({ text: `Se termine le` });

        // Create participate button
        const button = new ButtonBuilder()
            .setCustomId(`giveaway_join_${giveaway.id}`)
            .setLabel('🎯 Participer')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder()
            .addComponents(button);

        // Send the giveaway message
        const giveawayMessage = await channel.send({ 
            embeds: [embed], 
            components: [row] 
        });

        // Update the giveaway with the message ID
        await db.updateGiveawayMessage(giveaway.id, giveawayMessage.id);

        // Set up automatic ending timer
        scheduleGiveawayEnd(giveaway.id, config.duration, channel, giveawayMessage);

    } catch (error) {
        console.error('Error launching giveaway:', error);
        await channel.send(getResponse('giveaway.error'));
    }
}

async function handleCreate(message, args) {
    // Check if user is admin
    if (!isAdmin(message.author.id)) {
        return message.reply(getResponse('giveaway.permissionDenied'));
    }

    // Parse arguments: [titre] [objet] [durée] [gagnants] [quantité]
    if (args.length < 5) {
        return message.reply(getResponse('giveaway.create.invalidArgs'));
    }

    const title = args[0];
    // Remove surrounding quotes if present (handles ", ', or `)
    const reward = args[1].replace(/^[\"'`](.+)[\"'`]$/, '$1');
    const duration = parseInt(args[2]);
    const winnersCount = parseInt(args[3]);
    const quantity = parseInt(args[4]);

    // Validate inputs
    if (!title || !reward) {
        return message.reply(getResponse('giveaway.create.invalidArgs'));
    }

    if (isNaN(duration) || duration <= 0) {
        return message.reply(getResponse('giveaway.create.invalidDuration'));
    }

    if (isNaN(winnersCount) || winnersCount <= 0) {
        return message.reply(getResponse('giveaway.create.invalidWinners'));
    }

    if (isNaN(quantity) || quantity <= 0) {
        return message.reply(getResponse('giveaway.create.invalidQuantity'));
    }

    try {
        // Create giveaway in database
        const giveaway = await db.createGiveaway(
            title,
            reward,
            duration,
            winnersCount,
            quantity,
            message.channel.id,
            message.author.id
        );

        // Create embed
        const embed = new EmbedBuilder()
            .setColor(config.colors.gold)
            .setTitle('🎉 GIVEAWAY 🎁')
            .setDescription(
                `🌟 **Récompense** : ${reward} x${quantity}\n` +
                `🏆 **Nombre de gagnants** : ${winnersCount}\n` +
                `👥 **Participants** : 0\n\n` +
                `⏲️ **Fin dans** : ${duration} minute${duration > 1 ? 's' : ''}\n` +
                `📢 Cliquez sur Participer pour tenter votre chance !`
            )
            .setTimestamp(new Date(giveaway.end_time))
            .setFooter({ text: `Se termine le` });

        // Create participate button
        const button = new ButtonBuilder()
            .setCustomId(`giveaway_join_${giveaway.id}`)
            .setLabel('🎯 Participer')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder()
            .addComponents(button);

        // Send the giveaway message
        const giveawayMessage = await message.channel.send({ 
            embeds: [embed], 
            components: [row] 
        });

        // Update the giveaway with the message ID
        await db.updateGiveawayMessage(giveaway.id, giveawayMessage.id);

        // Set up automatic ending timer
        scheduleGiveawayEnd(giveaway.id, duration, message.channel, giveawayMessage);

        // Delete the command message
        await message.delete().catch(() => {});

    } catch (error) {
        console.error('Error creating giveaway:', error);
        return message.reply(getResponse('giveaway.error'));
    }
}

async function handleEnd(message, args) {
    // Check if user is admin
    if (!isAdmin(message.author.id)) {
        return message.reply(getResponse('giveaway.permissionDenied'));
    }

    const title = args[0];
    if (!title) {
        return message.reply(getResponse('giveaway.end.noTitle'));
    }

    try {
        // Get active giveaway by title
        const giveaway = await db.getGiveawayByTitle(title, message.author.id);
        if (!giveaway) {
            return message.reply(getResponse('giveaway.end.notFound', { title }));
        }

        // End the giveaway
        await endGiveaway(giveaway.id, message.channel);

        // Delete the command message
        await message.delete().catch(() => {});

    } catch (error) {
        console.error('Error ending giveaway:', error);
        return message.reply(getResponse('giveaway.error'));
    }
}

async function handleWinner(message, args) {
    // Check if user is admin
    if (!isAdmin(message.author.id)) {
        return message.reply(getResponse('giveaway.permissionDenied'));
    }

    const title = args[0];
    if (!title) {
        return message.reply(getResponse('giveaway.winner.noTitle'));
    }

    // Check if user is mentioned
    const mentionedUser = message.mentions.users.first();
    if (!mentionedUser) {
        return message.reply(getResponse('giveaway.winner.noMention'));
    }

    try {
        // Get active giveaway by title
        const giveaway = await db.getGiveawayByTitle(title, message.author.id);
        if (!giveaway) {
            return message.reply(getResponse('giveaway.winner.notFound', { title }));
        }

        // Set the manual winner
        await db.setManualWinner(giveaway.id, mentionedUser.id);

        // Send ephemeral confirmation (as a direct reply that only admin sees)
        await message.reply({ 
            content: getResponse('giveaway.winner.success', { 
                mention: `<@${mentionedUser.id}>`, 
                title 
            }),
            allowedMentions: { users: [] } // Prevent actual mention
        });

        // Delete the command message
        await message.delete().catch(() => {});

    } catch (error) {
        console.error('Error setting manual winner:', error);
        return message.reply(getResponse('giveaway.error'));
    }
}


function scheduleGiveawayEnd(giveawayId, durationMinutes, channel, giveawayMessage) {
    // Clear existing timer if any
    if (giveawayTimers.has(giveawayId)) {
        clearTimeout(giveawayTimers.get(giveawayId));
    }

    // Schedule the end
    const timer = setTimeout(async () => {
        await endGiveaway(giveawayId, channel, giveawayMessage);
        giveawayTimers.delete(giveawayId);
    }, durationMinutes * MS_PER_MINUTE);

    giveawayTimers.set(giveawayId, timer);
}

async function endGiveaway(giveawayId, channel, giveawayMessage = null) {
    try {
        // Get giveaway details
        const giveaway = await db.getGiveaway(giveawayId);
        if (!giveaway || giveaway.status !== 'active') {
            return;
        }

        // Get all participants
        const participants = await db.getGiveawayParticipants(giveawayId);
        
        // Mark giveaway as ended
        await db.endGiveaway(giveawayId);

        // Select winners
        let winners = [];
        
        // Check if there's a manual winner set
        if (giveaway.manual_winner_id) {
            // Use the manually selected winner
            winners = [{ user_id: giveaway.manual_winner_id }];
        } else if (participants.length > 0) {
            // Select winners using Fisher-Yates shuffle for uniform distribution
            const shuffled = [...participants];
            // Fisher-Yates shuffle algorithm
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            winners = shuffled.slice(0, Math.min(giveaway.winners_count, participants.length));
        }

        // Create results embed
        let winnersText;
        if (winners.length === 0) {
            winnersText = '❌ Aucun participant';
        } else {
            winnersText = winners.map(w => `<@${w.user_id}>`).join(', ');
        }

        const resultsEmbed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle('🎉 GIVEAWAY TERMINÉ 🎉')
            .setDescription(
                `🌟 **Récompense** : ${giveaway.reward} x${giveaway.quantity}\n` +
                `🏆 **Gagnant${winners.length > 1 ? 's' : ''}** : ${winnersText}\n` +
                `👥 **Participants** : ${participants.length}`
            )
            .setTimestamp();

        // Update or send the message
        if (giveawayMessage) {
            // Disable the button
            const button = new ButtonBuilder()
                .setCustomId(`giveaway_join_${giveaway.id}`)
                .setLabel('🎯 Participer')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true);

            const row = new ActionRowBuilder()
                .addComponents(button);

            await giveawayMessage.edit({ 
                embeds: [resultsEmbed], 
                components: [row] 
            });
        } else {
            // Try to fetch the message if we don't have it
            if (giveaway.message_id) {
                try {
                    const msg = await channel.messages.fetch(giveaway.message_id);
                    
                    const button = new ButtonBuilder()
                        .setCustomId(`giveaway_join_${giveaway.id}`)
                        .setLabel('🎯 Participer')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true);

                    const row = new ActionRowBuilder()
                        .addComponents(button);

                    await msg.edit({ 
                        embeds: [resultsEmbed], 
                        components: [row] 
                    });
                } catch (error) {
                    // If we can't fetch the message, just send a new one
                    await channel.send({ embeds: [resultsEmbed] });
                }
            } else {
                await channel.send({ embeds: [resultsEmbed] });
            }
        }

        // Mention winners if any
        if (winners.length > 0) {
            const mentionText = winners.map(w => `<@${w.user_id}>`).join(' ');
            await channel.send(`🎊 Félicitations ${mentionText} ! Vous avez gagné **${giveaway.reward}** !`);
        }

    } catch (error) {
        console.error('Error ending giveaway:', error);
    }
}

async function updateGiveawayEmbed(message, giveaway) {
    try {
        const participantCount = await db.getGiveawayParticipantCount(giveaway.id);
        const timeRemaining = Math.max(0, Math.floor((new Date(giveaway.end_time) - new Date()) / MS_PER_MINUTE));

        const embed = new EmbedBuilder()
            .setColor(config.colors.gold)
            .setTitle('🎉 GIVEAWAY 🎁')
            .setDescription(
                `🌟 **Récompense** : ${giveaway.reward} x${giveaway.quantity}\n` +
                `🏆 **Nombre de gagnants** : ${giveaway.winners_count}\n` +
                `👥 **Participants** : ${participantCount}\n\n` +
                `⏲️ **Fin dans** : ${timeRemaining} minute${timeRemaining > 1 ? 's' : ''}\n` +
                `📢 Cliquez sur Participer pour tenter votre chance !`
            )
            .setTimestamp(new Date(giveaway.end_time))
            .setFooter({ text: `Se termine le` });

        await message.edit({ embeds: [embed] });
    } catch (error) {
        console.error('Error updating giveaway embed:', error);
    }
}
