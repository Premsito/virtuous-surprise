const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../database/db');
const config = require('../config.json');
const { getResponse } = require('../utils/responseHelper');

// Active games storage
const active007Games = new Map();

// Game actions
const ACTIONS = {
    RECHARGE: 'recharge',
    SHOOT: 'shoot',
    SHIELD: 'shield'
};

module.exports = {
    name: '007',
    description: '007 duel game between two players',
    
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
                [challengerId]: {
                    user: challenger,
                    bullets: config.games['007'].initialBullets,
                    hasShield: false,
                    action: null
                },
                [opponentId]: {
                    user: opponentMention,
                    bullets: config.games['007'].initialBullets,
                    hasShield: false,
                    action: null
                }
            };
            
            // Run game turns
            let turnNumber = 1;
            let gameOver = false;
            
            while (!gameOver) {
                // Reset actions and shields for the turn
                gameState[challengerId].action = null;
                gameState[challengerId].hasShield = false;
                gameState[opponentId].action = null;
                gameState[opponentId].hasShield = false;
                
                // Show current status and action buttons
                const player1Status = getResponse('007.turn.playerStatus', {
                    player: gameState[challengerId].user.username,
                    bullets: gameState[challengerId].bullets,
                    shieldStatus: ''
                });
                
                const player2Status = getResponse('007.turn.playerStatus', {
                    player: gameState[opponentId].user.username,
                    bullets: gameState[opponentId].bullets,
                    shieldStatus: ''
                });
                
                const turnEmbed = new EmbedBuilder()
                    .setColor(config.colors.primary)
                    .setTitle(getResponse('007.turn.title'))
                    .setDescription(getResponse('007.turn.description', {
                        turn: turnNumber,
                        player1Status: player1Status,
                        player2Status: player2Status,
                        currentPlayer: 'Les deux joueurs'
                    }))
                    .setTimestamp();
                
                // Create action buttons for both players
                const actionRows = createActionButtons(challengerId, opponentId, gameState);
                
                const turnMsg = await message.channel.send({ embeds: [turnEmbed], components: actionRows });
                
                // Wait for both players to choose their actions
                const actionFilter = i => {
                    return (i.user.id === challengerId || i.user.id === opponentId) && 
                           i.customId.startsWith('007_action_');
                };
                
                const actionCollector = turnMsg.createMessageComponentCollector({ filter: actionFilter, time: 30000 });
                
                actionCollector.on('collect', async i => {
                    const playerId = i.user.id;
                    
                    // Parse custom ID: 007_action_${playerId}_${action}
                    const parts = i.customId.split('_');
                    const buttonPlayerId = parts[2];
                    const action = parts[3];
                    
                    // Validate that the player is clicking their own button
                    if (playerId !== buttonPlayerId) {
                        await i.reply({ content: '❌ Vous ne pouvez pas choisir pour l\'autre joueur!', ephemeral: true });
                        return;
                    }
                    
                    // Only allow one action per player per turn
                    if (gameState[playerId].action) {
                        await i.reply({ content: getResponse('007.alreadyChosen'), ephemeral: true });
                        return;
                    }
                    
                    gameState[playerId].action = action;
                    
                    // Apply action effects (for display purposes)
                    if (action === ACTIONS.SHIELD) {
                        gameState[playerId].hasShield = true;
                    }
                    
                    await i.reply({ content: getResponse('007.actionChosen'), ephemeral: true });
                    
                    // Check if both players have chosen
                    if (gameState[challengerId].action && gameState[opponentId].action) {
                        actionCollector.stop('both_chosen');
                    }
                });
                
                await new Promise((resolve, reject) => {
                    actionCollector.on('end', (collected, reason) => {
                        if (reason === 'both_chosen') {
                            resolve();
                        } else {
                            reject(new Error('timeout'));
                        }
                    });
                });
                
                // Disable all action buttons
                const disabledRows = createActionButtons(challengerId, opponentId, gameState, true);
                await turnMsg.edit({ components: disabledRows });
                
                // Process actions
                const result = processActions(gameState, challengerId, opponentId);
                
                if (result.gameOver) {
                    gameOver = true;
                    
                    // Determine winner and update balances
                    if (result.winner) {
                        const winner = result.winner;
                        const loser = winner === challengerId ? opponentId : challengerId;
                        
                        // Transfer LC
                        await db.updateBalance(winner, betAmount);
                        await db.updateBalance(loser, -betAmount);
                        
                        // Record game
                        await db.recordGame('007', challengerId, opponentId, betAmount, winner === challengerId ? 'win' : 'loss', winner === challengerId ? betAmount : 0);
                        await db.recordGame('007', opponentId, challengerId, betAmount, winner === opponentId ? 'win' : 'loss', winner === opponentId ? betAmount : 0);
                        
                        const winnerUser = gameState[winner].user;
                        
                        // Create result embed
                        const resultEmbed = new EmbedBuilder()
                            .setColor(config.colors.success)
                            .setTitle(getResponse('007.result.title'))
                            .setDescription(result.message.replace('{winnings}', betAmount))
                            .setTimestamp();
                        
                        await message.channel.send({ embeds: [resultEmbed] });
                    } else {
                        // Draw - return bets
                        const drawEmbed = new EmbedBuilder()
                            .setColor(config.colors.warning)
                            .setTitle(getResponse('007.result.title'))
                            .setDescription(getResponse('007.result.draw'))
                            .setTimestamp();
                        
                        await message.channel.send({ embeds: [drawEmbed] });
                    }
                } else {
                    // Show turn result if game continues
                    if (result.message) {
                        await message.channel.send(result.message);
                    }
                }
                
                turnNumber++;
            }
            
        } catch (error) {
            // Timeout or error
            if (error.message === 'timeout') {
                const timeoutEmbed = new EmbedBuilder()
                    .setColor(config.colors.error)
                    .setTitle(getResponse('007.timeout.title'))
                    .setDescription(getResponse('007.timeout.description'))
                    .setTimestamp();
                
                await message.channel.send({ embeds: [timeoutEmbed] });
            } else {
                // Acceptance timeout
                const timeoutEmbed = new EmbedBuilder()
                    .setColor(config.colors.error)
                    .setTitle(getResponse('007.refused.title'))
                    .setDescription(getResponse('007.refused.description', {
                        opponent: opponentMention
                    }))
                    .setTimestamp();
                
                await challengeMsg.edit({ embeds: [timeoutEmbed], components: [] });
            }
        } finally {
            active007Games.delete(challengerId);
            active007Games.delete(opponentId);
        }
    }
};

function createActionButtons(challengerId, opponentId, gameState, disabled = false) {
    const rows = [];
    
    // Create buttons for each player
    for (const playerId of [challengerId, opponentId]) {
        const playerBullets = gameState[playerId].bullets;
        
        const rechargeButton = new ButtonBuilder()
            .setCustomId(`007_action_${playerId}_${ACTIONS.RECHARGE}`)
            .setLabel('Recharger')
            .setEmoji('🔄')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(disabled);
        
        const shootButton = new ButtonBuilder()
            .setCustomId(`007_action_${playerId}_${ACTIONS.SHOOT}`)
            .setLabel(playerBullets > 0 ? 'Tirer' : 'Tir (Pas de balle)')
            .setEmoji('🔫')
            .setStyle(ButtonStyle.Danger)
            .setDisabled(disabled || playerBullets === 0);
        
        const shieldButton = new ButtonBuilder()
            .setCustomId(`007_action_${playerId}_${ACTIONS.SHIELD}`)
            .setLabel('Bouclier')
            .setEmoji('🛡️')
            .setStyle(ButtonStyle.Success)
            .setDisabled(disabled);
        
        const row = new ActionRowBuilder()
            .addComponents(rechargeButton, shootButton, shieldButton);
        
        rows.push(row);
    }
    
    return rows;
}

function processActions(gameState, player1Id, player2Id) {
    const player1Action = gameState[player1Id].action;
    const player2Action = gameState[player2Id].action;
    
    // Apply recharge actions
    if (player1Action === ACTIONS.RECHARGE) {
        gameState[player1Id].bullets++;
    }
    if (player2Action === ACTIONS.RECHARGE) {
        gameState[player2Id].bullets++;
    }
    
    // Apply shield actions
    if (player1Action === ACTIONS.SHIELD) {
        gameState[player1Id].hasShield = true;
    }
    if (player2Action === ACTIONS.SHIELD) {
        gameState[player2Id].hasShield = true;
    }
    
    // Process shooting
    const player1Shoots = player1Action === ACTIONS.SHOOT;
    const player2Shoots = player2Action === ACTIONS.SHOOT;
    
    // Deduct bullets for shooting
    if (player1Shoots) {
        gameState[player1Id].bullets--;
    }
    if (player2Shoots) {
        gameState[player2Id].bullets--;
    }
    
    // Determine outcome
    if (player1Shoots && player2Shoots) {
        // Both shot at each other
        const player1Protected = gameState[player1Id].hasShield;
        const player2Protected = gameState[player2Id].hasShield;
        
        if (!player1Protected && !player2Protected) {
            // Both die - draw
            return {
                gameOver: true,
                winner: null,
                message: getResponse('007.result.bothShot')
            };
        } else if (!player1Protected && player2Protected) {
            // Player 1 dies
            return {
                gameOver: true,
                winner: player2Id,
                message: getResponse('007.result.player2Shot', {
                    player1: gameState[player1Id].user.username,
                    player2: gameState[player2Id].user.username,
                    winnings: '{winnings}'
                })
            };
        } else if (player1Protected && !player2Protected) {
            // Player 2 dies
            return {
                gameOver: true,
                winner: player1Id,
                message: getResponse('007.result.player1Shot', {
                    player1: gameState[player1Id].user.username,
                    player2: gameState[player2Id].user.username,
                    winnings: '{winnings}'
                })
            };
        } else {
            // Both protected - game continues
            return {
                gameOver: false,
                message: 'Les deux joueurs se sont protégés! Le duel continue...'
            };
        }
    } else if (player1Shoots && !gameState[player2Id].hasShield) {
        // Player 1 shoots and hits
        return {
            gameOver: true,
            winner: player1Id,
            message: getResponse('007.result.player1Shot', {
                player1: gameState[player1Id].user.username,
                player2: gameState[player2Id].user.username,
                winnings: '{winnings}'
            })
        };
    } else if (player2Shoots && !gameState[player1Id].hasShield) {
        // Player 2 shoots and hits
        return {
            gameOver: true,
            winner: player2Id,
            message: getResponse('007.result.player2Shot', {
                player1: gameState[player1Id].user.username,
                player2: gameState[player2Id].user.username,
                winnings: '{winnings}'
            })
        };
    } else if (player1Shoots && gameState[player2Id].hasShield) {
        // Player 1 shoots but player 2 has shield
        return {
            gameOver: false,
            message: getResponse('007.result.shieldBlocked', {
                shooter: gameState[player1Id].user.username,
                defender: gameState[player2Id].user.username
            })
        };
    } else if (player2Shoots && gameState[player1Id].hasShield) {
        // Player 2 shoots but player 1 has shield
        return {
            gameOver: false,
            message: getResponse('007.result.shieldBlocked', {
                shooter: gameState[player2Id].user.username,
                defender: gameState[player1Id].user.username
            })
        };
    }
    
    // Game continues
    return {
        gameOver: false,
        message: null
    };
}
