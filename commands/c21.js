const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../database/db');
const config = require('../config.json');
const { getResponse } = require('../utils/responseHelper');
const { grantGameXP } = require('../utils/gameXPHelper');

// Active games storage
const active21Games = new Map();

module.exports = {
    name: 'c21',
    description: 'Challenge de 21 - reach 21 and lose!',
    
    async execute(message, args) {
        const challenger = message.author;
        const challengerId = challenger.id;
        
        // Get opponent
        const opponentMention = message.mentions.users.first();
        if (!opponentMention) {
            return message.reply(getResponse('c21.noOpponent'));
        }
        
        if (opponentMention.id === challengerId) {
            return message.reply(getResponse('c21.selfChallenge'));
        }
        
        if (opponentMention.bot) {
            return message.reply(getResponse('c21.botChallenge'));
        }
        
        const opponentId = opponentMention.id;
        
        // Get bet amount
        const betAmount = parseInt(args[1]);
        if (!betAmount || betAmount < config.games.c21.minBet || betAmount > config.games.c21.maxBet) {
            return message.reply(getResponse('c21.invalidBet', {
                minBet: config.games.c21.minBet,
                maxBet: config.games.c21.maxBet
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
            return message.reply(getResponse('c21.insufficientBalanceChallenger', {
                balance: challengerUser.balance
            }));
        }
        
        if (opponentUser.balance < betAmount) {
            return message.reply(getResponse('c21.insufficientBalanceOpponent', {
                opponent: opponentMention.username
            }));
        }
        
        // Check if already in a game
        if (active21Games.has(challengerId) || active21Games.has(opponentId)) {
            return message.reply(getResponse('c21.alreadyInGame'));
        }
        
        // Create game request
        const gameId = `${challengerId}-${opponentId}-${Date.now()}`;
        active21Games.set(challengerId, gameId);
        active21Games.set(opponentId, gameId);
        
        const challengeEmbed = new EmbedBuilder()
            .setColor(config.colors.warning)
            .setTitle(getResponse('c21.challenge.title'))
            .setDescription(getResponse('c21.challenge.description', {
                challenger: challenger,
                opponent: opponentMention,
                bet: betAmount
            }))
            .setTimestamp();
        
        // Create buttons for acceptance
        const acceptButton = new ButtonBuilder()
            .setCustomId('c21_accept')
            .setLabel('Accepter')
            .setEmoji('✅')
            .setStyle(ButtonStyle.Success);
        
        const refuseButton = new ButtonBuilder()
            .setCustomId('c21_refuse')
            .setLabel('Refuser')
            .setEmoji('❌')
            .setStyle(ButtonStyle.Danger);
        
        const row = new ActionRowBuilder()
            .addComponents(acceptButton, refuseButton);
        
        const challengeMsg = await message.reply({ embeds: [challengeEmbed], components: [row] });
        
        // Wait for button interaction
        const filter = i => {
            return i.user.id === opponentId && (i.customId === 'c21_accept' || i.customId === 'c21_refuse');
        };
        
        try {
            const interaction = await challengeMsg.awaitMessageComponent({ filter, time: 30000 });
            
            // Disable buttons after interaction
            acceptButton.setDisabled(true);
            refuseButton.setDisabled(true);
            await challengeMsg.edit({ components: [row] });
            
            // Check if refused
            if (interaction.customId === 'c21_refuse') {
                await interaction.update({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(config.colors.error)
                            .setTitle(getResponse('c21.refused.title'))
                            .setDescription(getResponse('c21.refused.description', {
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
                        .setTitle(getResponse('c21.accepted.title'))
                        .setDescription(getResponse('c21.accepted.description', {
                            opponent: opponentMention
                        }))
                        .setTimestamp()
                ],
                components: []
            });
            
            // Start game
            let currentTotal = 0;
            let currentPlayerId = challengerId; // Challenger goes first
            let currentPlayer = challenger;
            let turnNumber = 1;
            
            while (currentTotal < 21) {
                const gameEmbed = new EmbedBuilder()
                    .setColor(config.colors.primary)
                    .setTitle(getResponse('c21.turn.title', { turn: turnNumber }))
                    .setDescription(getResponse('c21.turn.description', {
                        currentTotal: currentTotal,
                        currentPlayer: currentPlayer
                    }))
                    .setTimestamp();
                
                // Create choice buttons
                const add1Button = new ButtonBuilder()
                    .setCustomId('c21_add1')
                    .setLabel('+1')
                    .setEmoji('➕')
                    .setStyle(ButtonStyle.Primary);
                
                const add2Button = new ButtonBuilder()
                    .setCustomId('c21_add2')
                    .setLabel('+2')
                    .setEmoji('➕')
                    .setStyle(ButtonStyle.Primary);
                
                const add3Button = new ButtonBuilder()
                    .setCustomId('c21_add3')
                    .setLabel('+3')
                    .setEmoji('➕')
                    .setStyle(ButtonStyle.Primary);
                
                const turnRow = new ActionRowBuilder()
                    .addComponents(add1Button, add2Button, add3Button);
                
                const turnMsg = await message.channel.send({ embeds: [gameEmbed], components: [turnRow] });
                
                // Wait for current player to make a choice
                const turnFilter = i => {
                    return i.user.id === currentPlayerId && i.customId.startsWith('c21_add');
                };
                
                try {
                    const turnInteraction = await turnMsg.awaitMessageComponent({ filter: turnFilter, time: 30000 });
                    
                    // Get the chosen addition
                    const addition = parseInt(turnInteraction.customId.replace('c21_add', ''));
                    currentTotal += addition;
                    
                    // Disable all buttons
                    add1Button.setDisabled(true);
                    add2Button.setDisabled(true);
                    add3Button.setDisabled(true);
                    await turnMsg.edit({ components: [turnRow] });
                    
                    // Update with the choice
                    await turnInteraction.reply({
                        content: getResponse('c21.turn.chosen', {
                            player: currentPlayer,
                            addition: addition,
                            newTotal: currentTotal
                        })
                    });
                    
                    // Check if game is over
                    if (currentTotal >= 21) {
                        // Current player loses (reached or exceeded 21)
                        const loser = currentPlayerId;
                        const winner = currentPlayerId === challengerId ? opponentId : challengerId;
                        const loserUser = currentPlayerId === challengerId ? challenger : opponentMention;
                        const winnerUser = currentPlayerId === challengerId ? opponentMention : challenger;
                        
                        // Transfer LC
                        await db.updateBalance(winner, betAmount, 'game_c21_win');
                        await db.updateBalance(loser, -betAmount, 'game_c21_loss');
                        
                        // Record game
                        await db.recordGame('c21', challengerId, opponentId, betAmount, winner === challengerId ? 'win' : 'loss', winner === challengerId ? betAmount : 0);
                        await db.recordGame('c21', opponentId, challengerId, betAmount, winner === opponentId ? 'win' : 'loss', winner === opponentId ? betAmount : 0);
                        
                        // Grant XP for game participation
                        await grantGameXP(challengerId, challenger.username, winner === challengerId ? 'win' : 'loss', message);
                        await grantGameXP(opponentId, opponentMention.username, winner === opponentId ? 'win' : 'loss', message);
                        
                        const resultEmbed = new EmbedBuilder()
                            .setColor(config.colors.success)
                            .setTitle(`🏆 Challenge 21 - **Victoire de ${winnerUser.username} !**`)
                            .setDescription(getResponse('c21.result.description', {
                                finalTotal: currentTotal,
                                loser: loserUser,
                                winner: winnerUser,
                                winnings: betAmount * 2
                            }))
                            .setTimestamp();
                        
                        await message.channel.send({ embeds: [resultEmbed] });
                        break;
                    }
                    
                    // Switch to other player
                    currentPlayerId = currentPlayerId === challengerId ? opponentId : challengerId;
                    currentPlayer = currentPlayerId === challengerId ? challenger : opponentMention;
                    turnNumber++;
                    
                    // Small delay before next turn
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                } catch (turnError) {
                    // Player didn't respond in time
                    const loser = currentPlayerId;
                    const winner = currentPlayerId === challengerId ? opponentId : challengerId;
                    const loserUser = currentPlayerId === challengerId ? challenger : opponentMention;
                    const winnerUser = currentPlayerId === challengerId ? opponentMention : challenger;
                    
                    // Disable all buttons
                    add1Button.setDisabled(true);
                    add2Button.setDisabled(true);
                    add3Button.setDisabled(true);
                    await turnMsg.edit({ components: [turnRow] });
                    
                    // Transfer LC (winner gets the bet)
                    await db.updateBalance(winner, betAmount, 'game_c21_win');
                    await db.updateBalance(loser, -betAmount, 'game_c21_loss');
                    
                    // Record game
                    await db.recordGame('c21', challengerId, opponentId, betAmount, winner === challengerId ? 'win' : 'loss', winner === challengerId ? betAmount : 0);
                    await db.recordGame('c21', opponentId, challengerId, betAmount, winner === opponentId ? 'win' : 'loss', winner === opponentId ? betAmount : 0);
                    
                    // Grant XP for game participation
                    await grantGameXP(challengerId, challenger.username, winner === challengerId ? 'win' : 'loss', message);
                    await grantGameXP(opponentId, opponentMention.username, winner === opponentId ? 'win' : 'loss', message);
                    
                    const timeoutEmbed = new EmbedBuilder()
                        .setColor(config.colors.error)
                        .setTitle(getResponse('c21.timeout.title'))
                        .setDescription(getResponse('c21.timeout.description', {
                            loser: loserUser,
                            winner: winnerUser
                        }))
                        .setTimestamp();
                    
                    await message.channel.send({ embeds: [timeoutEmbed] });
                    break;
                }
            }
            
        } catch (error) {
            // Acceptance timeout
            const timeoutEmbed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setTitle(getResponse('c21.refused.title'))
                .setDescription(getResponse('c21.refused.description', {
                    opponent: opponentMention
                }))
                .setTimestamp();
            
            await challengeMsg.edit({ embeds: [timeoutEmbed], components: [] });
        } finally {
            active21Games.delete(challengerId);
            active21Games.delete(opponentId);
        }
    }
};
