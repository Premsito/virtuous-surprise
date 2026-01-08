const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../database/db');
const config = require('../config.json');
const { getResponse } = require('../utils/responseHelper');

// Active games storage
const active007Games = new Map();

// Action types
const ACTIONS = {
    RECHARGER: 'recharger',
    TIRER: 'tirer',
    BOUCLIER: 'bouclier'
};

module.exports = {
    name: '007',
    description: 'Jeu 007 - Interactive 1v1 action game',
    
    async execute(message, args) {
        const challenger = message.author;
        const challengerId = challenger.id;
        
        // Get opponent
        const opponentMention = message.mentions.users.first();
        if (!opponentMention) {
            return message.reply(getResponse('007.noOpponent'));
        }
        
        if (opponentMention.id === challengerId) {
            return message.reply(getResponse('007.selfChallenge'));
        }
        
        if (opponentMention.bot) {
            return message.reply(getResponse('007.botChallenge'));
        }
        
        const opponentId = opponentMention.id;
        
        // Get bet amount
        const betAmount = parseInt(args[1]);
        if (!betAmount || betAmount < config.games['007'].minBet || betAmount > config.games['007'].maxBet) {
            return message.reply(getResponse('007.invalidBet', {
                minBet: config.games['007'].minBet,
                maxBet: config.games['007'].maxBet
            }));
        }
        
        // Ensure both users exist
        let challengerUser = await db.getUser(challengerId);
        if (!challengerUser) {
            challengerUser = await db.createUser(challengerId, challenger.username);
        }
        
        let opponentUser = await db.getUser(opponentId);
        if (!opponentUser) {
            opponentUser = await db.createUser(opponentId, opponentMention.username);
        }
        
        // Check balances
        if (challengerUser.balance < betAmount) {
            return message.reply(getResponse('007.insufficientBalanceChallenger', {
                balance: challengerUser.balance
            }));
        }
        
        if (opponentUser.balance < betAmount) {
            return message.reply(getResponse('007.insufficientBalanceOpponent', {
                opponent: opponentMention.username
            }));
        }
        
        // Check if already in a game
        if (active007Games.has(challengerId) || active007Games.has(opponentId)) {
            return message.reply(getResponse('007.alreadyInGame'));
        }
        
        // Create game request
        const gameId = `${challengerId}-${opponentId}-${Date.now()}`;
        active007Games.set(challengerId, gameId);
        active007Games.set(opponentId, gameId);
        
        const challengeEmbed = new EmbedBuilder()
            .setColor(config.colors.warning)
            .setTitle(getResponse('007.challenge.title'))
            .setDescription(getResponse('007.challenge.description', {
                challenger: challenger,
                opponent: opponentMention,
                bet: betAmount
            }))
            .setTimestamp();
        
        // Create buttons for acceptance
        const acceptButton = new ButtonBuilder()
            .setCustomId('007_accept')
            .setLabel('Accepter')
            .setEmoji('✅')
            .setStyle(ButtonStyle.Success);
        
        const refuseButton = new ButtonBuilder()
            .setCustomId('007_refuse')
            .setLabel('Refuser')
            .setEmoji('❌')
            .setStyle(ButtonStyle.Danger);
        
        const row = new ActionRowBuilder()
            .addComponents(acceptButton, refuseButton);
        
        const challengeMsg = await message.reply({ embeds: [challengeEmbed], components: [row] });
        
        // Wait for button interaction
        const filter = i => {
            return i.user.id === opponentId && (i.customId === '007_accept' || i.customId === '007_refuse');
        };
        
        try {
            const interaction = await challengeMsg.awaitMessageComponent({ filter, time: 30000 });
            
            // Disable buttons after interaction
            acceptButton.setDisabled(true);
            refuseButton.setDisabled(true);
            await challengeMsg.edit({ components: [row] });
            
            // Check if refused
            if (interaction.customId === '007_refuse') {
                await interaction.update({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(config.colors.error)
                            .setTitle(getResponse('007.refused.title'))
                            .setDescription(getResponse('007.refused.description', {
                                opponent: opponentMention
                            }))
                            .setTimestamp()
                    ],
                    components: []
                });
                return;
            }
            
            // Accepted - acknowledge the interaction
            await interaction.update({
                embeds: [
                    new EmbedBuilder()
                        .setColor(config.colors.success)
                        .setTitle(getResponse('007.accepted.title'))
                        .setDescription(getResponse('007.accepted.description', {
                            opponent: opponentMention
                        }))
                        .setTimestamp()
                ],
                components: []
            });
            
            // Initialize game state
            const gameState = {
                players: {
                    [challengerId]: {
                        bullets: 1,
                        shield: false,
                        action: null,
                        user: challenger
                    },
                    [opponentId]: {
                        bullets: 1,
                        shield: false,
                        action: null,
                        user: opponentMention
                    }
                },
                roundNumber: 1
            };
            
            // Start game rounds
            await playRound(message, gameState, challengerId, opponentId, betAmount);
            
        } catch (error) {
            // Timeout or error
            const timeoutEmbed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setTitle(getResponse('007.refused.title'))
                .setDescription(getResponse('007.refused.description', {
                    opponent: opponentMention
                }))
                .setTimestamp();
            
            await challengeMsg.edit({ embeds: [timeoutEmbed], components: [] });
        } finally {
            active007Games.delete(challengerId);
            active007Games.delete(opponentId);
        }
    }
};

/**
 * Play a single round of the 007 game
 */
async function playRound(message, gameState, challengerId, opponentId, betAmount) {
    const challengerData = gameState.players[challengerId];
    const opponentData = gameState.players[opponentId];
    
    // Reset actions and shield for new round
    challengerData.action = null;
    opponentData.action = null;
    challengerData.shield = false;
    opponentData.shield = false;
    
    // Create round embed
    const roundEmbed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle(getResponse('007.round.title', { round: gameState.roundNumber }))
        .setDescription(getResponse('007.round.description', {
            challenger: challengerData.user,
            challengerBullets: challengerData.bullets,
            opponent: opponentData.user,
            opponentBullets: opponentData.bullets
        }))
        .setTimestamp();
    
    const roundMsg = await message.channel.send({ embeds: [roundEmbed] });
    
    // Create action buttons for both players
    const actionChoices = new Map();
    
    // Send buttons to each player
    await sendActionButtons(message, challengerId, challengerData, actionChoices);
    await sendActionButtons(message, opponentId, opponentData, actionChoices);
    
    // Wait for both players to make their choices (10 second timeout)
    try {
        await waitForActions(message.channel, actionChoices, challengerId, opponentId, challengerData, opponentData);
        
        // Process round results
        const result = processRoundActions(gameState, challengerId, opponentId);
        
        // Show result
        const resultEmbed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setTitle(getResponse('007.round.resultTitle'))
            .setDescription(getResponse('007.round.resultDescription', {
                challenger: challengerData.user,
                challengerAction: getActionEmoji(challengerData.action),
                challengerActionName: getActionName(challengerData.action),
                opponent: opponentData.user,
                opponentAction: getActionEmoji(opponentData.action),
                opponentActionName: getActionName(opponentData.action)
            }))
            .setTimestamp();
        
        if (result.message) {
            resultEmbed.addFields({ name: '📢 Résultat', value: result.message });
        }
        
        await message.channel.send({ embeds: [resultEmbed] });
        
        // Check for winner
        if (result.winner) {
            await endGame(message, result.winner, challengerId, opponentId, challengerData.user, opponentData.user, betAmount);
            return;
        }
        
        // Continue to next round
        gameState.roundNumber++;
        
        // Add a small delay before next round
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        await playRound(message, gameState, challengerId, opponentId, betAmount);
        
    } catch (error) {
        // Timeout - determine who didn't respond
        let timeoutMessage;
        if (!actionChoices.has(challengerId) && !actionChoices.has(opponentId)) {
            timeoutMessage = getResponse('007.timeout.both');
        } else if (!actionChoices.has(challengerId)) {
            timeoutMessage = getResponse('007.timeout.player', { player: challengerData.user });
            await endGame(message, opponentId, challengerId, opponentId, challengerData.user, opponentData.user, betAmount);
            return;
        } else if (!actionChoices.has(opponentId)) {
            timeoutMessage = getResponse('007.timeout.player', { player: opponentData.user });
            await endGame(message, challengerId, challengerId, opponentId, challengerData.user, opponentData.user, betAmount);
            return;
        }
        
        const timeoutEmbed = new EmbedBuilder()
            .setColor(config.colors.error)
            .setTitle(getResponse('007.timeout.title'))
            .setDescription(timeoutMessage)
            .setTimestamp();
        
        await message.channel.send({ embeds: [timeoutEmbed] });
        
        // Clean up game state
        active007Games.delete(challengerId);
        active007Games.delete(opponentId);
    }
}

/**
 * Send action buttons to a player
 */
async function sendActionButtons(message, playerId, playerData, actionChoices) {
    const hasBullets = playerData.bullets > 0;
    
    // Create action buttons
    const rechargerButton = new ButtonBuilder()
        .setCustomId('007_recharger')
        .setLabel('Recharger')
        .setEmoji('🔄')
        .setStyle(ButtonStyle.Primary);
    
    const tirerButton = new ButtonBuilder()
        .setCustomId('007_tirer')
        .setLabel('Tirer')
        .setEmoji('🔫')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(!hasBullets); // Disabled if no bullets
    
    const bouclierButton = new ButtonBuilder()
        .setCustomId('007_bouclier')
        .setLabel('Bouclier')
        .setEmoji('🛡️')
        .setStyle(ButtonStyle.Success);
    
    const actionRow = new ActionRowBuilder()
        .addComponents(rechargerButton, tirerButton, bouclierButton);
    
    // Send DM or channel message with buttons
    try {
        const user = await message.client.users.fetch(playerId);
        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setTitle(getResponse('007.action.title'))
            .setDescription(getResponse('007.action.description', { bullets: playerData.bullets }))
            .setFooter({ text: getResponse('007.action.footer') });
        
        await user.send({ embeds: [embed], components: [actionRow] });
    } catch (error) {
        // If DM fails, send in channel (ephemeral would be better but requires slash commands)
        console.log(`Could not send DM to ${playerId}, action selection will be visible in channel`);
    }
}

/**
 * Wait for both players to choose their actions
 */
async function waitForActions(channel, actionChoices, challengerId, opponentId, challengerData, opponentData) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            collector.stop('timeout');
        }, 10000); // 10 second timeout
        
        const filter = i => {
            return (i.user.id === challengerId || i.user.id === opponentId) && 
                   i.customId.startsWith('007_') &&
                   (i.customId === '007_recharger' || i.customId === '007_tirer' || i.customId === '007_bouclier');
        };
        
        const collector = channel.client.on('interactionCreate', async (i) => {
            if (!filter(i)) return;
            
            // Ignore if player already chose
            if (actionChoices.has(i.user.id)) {
                await i.reply({ content: getResponse('007.alreadyChosen'), ephemeral: true });
                return;
            }
            
            const action = i.customId.replace('007_', '');
            const playerData = i.user.id === challengerId ? challengerData : opponentData;
            
            // Validate action
            if (action === ACTIONS.TIRER && playerData.bullets <= 0) {
                await i.reply({ content: getResponse('007.noBullets'), ephemeral: true });
                return;
            }
            
            actionChoices.set(i.user.id, action);
            playerData.action = action;
            
            await i.reply({ content: getResponse('007.choiceMade'), ephemeral: true });
            
            // Check if both players have chosen
            if (actionChoices.size === 2) {
                clearTimeout(timeout);
                channel.client.removeListener('interactionCreate', collector);
                resolve();
            }
        });
        
        // Handle timeout
        setTimeout(() => {
            if (actionChoices.size < 2) {
                channel.client.removeListener('interactionCreate', collector);
                reject(new Error('timeout'));
            }
        }, 10000);
    });
}

/**
 * Process the actions of both players and determine the outcome
 */
function processRoundActions(gameState, challengerId, opponentId) {
    const p1 = gameState.players[challengerId];
    const p2 = gameState.players[opponentId];
    
    let message = '';
    let winner = null;
    
    // Process actions
    if (p1.action === ACTIONS.RECHARGER) {
        p1.bullets++;
    }
    if (p2.action === ACTIONS.RECHARGER) {
        p2.bullets++;
    }
    
    if (p1.action === ACTIONS.BOUCLIER) {
        p1.shield = true;
    }
    if (p2.action === ACTIONS.BOUCLIER) {
        p2.shield = true;
    }
    
    if (p1.action === ACTIONS.TIRER) {
        p1.bullets--;
        if (p2.action === ACTIONS.RECHARGER && !p2.shield) {
            // P1 shoots P2 who is reloading - P1 wins
            winner = challengerId;
            message = getResponse('007.result.shot', { winner: p1.user, loser: p2.user });
        } else if (p2.action === ACTIONS.BOUCLIER) {
            // P2 blocked the shot
            message = getResponse('007.result.blocked', { shooter: p1.user, blocker: p2.user });
        }
    }
    
    if (p2.action === ACTIONS.TIRER && !winner) {
        p2.bullets--;
        if (p1.action === ACTIONS.RECHARGER && !p1.shield) {
            // P2 shoots P1 who is reloading - P2 wins
            winner = opponentId;
            message = getResponse('007.result.shot', { winner: p2.user, loser: p1.user });
        } else if (p1.action === ACTIONS.BOUCLIER) {
            // P1 blocked the shot
            message = getResponse('007.result.blocked', { shooter: p2.user, blocker: p1.user });
        }
    }
    
    // If both shot and both were shielding or both shot at shields
    if (p1.action === ACTIONS.TIRER && p2.action === ACTIONS.TIRER && !winner) {
        message = getResponse('007.result.bothShot');
    }
    
    return { winner, message };
}

/**
 * End the game and award winner
 */
async function endGame(message, winnerId, challengerId, opponentId, challengerUser, opponentUser, betAmount) {
    const loserUser = winnerId === challengerId ? opponentUser : challengerUser;
    const winnerUser = winnerId === challengerId ? challengerUser : opponentUser;
    const loserId = winnerId === challengerId ? opponentId : challengerId;
    
    // Transfer LC
    await db.updateBalance(winnerId, betAmount);
    await db.updateBalance(loserId, -betAmount);
    
    // Record game
    await db.recordGame('007', challengerId, opponentId, betAmount, winnerId === challengerId ? 'win' : 'loss', winnerId === challengerId ? betAmount : 0);
    await db.recordGame('007', opponentId, challengerId, betAmount, winnerId === opponentId ? 'win' : 'loss', winnerId === opponentId ? betAmount : 0);
    
    // Victory announcement
    const victoryEmbed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle(getResponse('007.victory.title'))
        .setDescription(getResponse('007.victory.description', {
            winner: winnerUser,
            loser: loserUser,
            winnings: betAmount
        }))
        .setTimestamp();
    
    await message.channel.send({ embeds: [victoryEmbed] });
    
    // Clean up game state
    active007Games.delete(challengerId);
    active007Games.delete(opponentId);
}

/**
 * Get emoji for action
 */
function getActionEmoji(action) {
    switch (action) {
        case ACTIONS.RECHARGER: return '🔄';
        case ACTIONS.TIRER: return '🔫';
        case ACTIONS.BOUCLIER: return '🛡️';
        default: return '❓';
    }
}

/**
 * Get name for action
 */
function getActionName(action) {
    switch (action) {
        case ACTIONS.RECHARGER: return 'Recharger';
        case ACTIONS.TIRER: return 'Tirer';
        case ACTIONS.BOUCLIER: return 'Bouclier';
        default: return 'Inconnu';
    }
}
