const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../database/db');
const config = require('../config.json');
const { getResponse } = require('../utils/responseHelper');

// Active games storage
const activePFCGames = new Map();

// Game choices
const CHOICES = {
    PIERRE: { emoji: '🪨', name: 'Pierre', beats: 'CISEAUX' },
    FEUILLE: { emoji: '✋', name: 'Feuille', beats: 'PIERRE' },
    CISEAUX: { emoji: '✂️', name: 'Ciseaux', beats: 'FEUILLE' }
};

module.exports = {
    name: 'pfc',
    description: 'Pierre-Feuille-Ciseaux game between two players',
    
    async execute(message, args) {
        const challenger = message.author;
        const challengerId = challenger.id;
        
        // Get opponent
        const opponentMention = message.mentions.users.first();
        if (!opponentMention) {
            return message.reply(getResponse('pfc.noOpponent'));
        }
        
        if (opponentMention.id === challengerId) {
            return message.reply(getResponse('pfc.selfChallenge'));
        }
        
        if (opponentMention.bot) {
            return message.reply(getResponse('pfc.botChallenge'));
        }
        
        const opponentId = opponentMention.id;
        
        // Get bet amount
        const betAmount = parseInt(args[1]);
        if (!betAmount || betAmount < config.games.pfc.minBet || betAmount > config.games.pfc.maxBet) {
            return message.reply(getResponse('pfc.invalidBet', {
                minBet: config.games.pfc.minBet,
                maxBet: config.games.pfc.maxBet
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
            return message.reply(getResponse('pfc.insufficientBalanceChallenger', {
                balance: challengerUser.balance
            }));
        }
        
        if (opponentUser.balance < betAmount) {
            return message.reply(getResponse('pfc.insufficientBalanceOpponent', {
                opponent: opponentMention.username
            }));
        }
        
        // Check if already in a game
        if (activePFCGames.has(challengerId) || activePFCGames.has(opponentId)) {
            return message.reply(getResponse('pfc.alreadyInGame'));
        }
        
        // Create game request
        const gameId = `${challengerId}-${opponentId}-${Date.now()}`;
        activePFCGames.set(challengerId, gameId);
        activePFCGames.set(opponentId, gameId);
        
        const challengeEmbed = new EmbedBuilder()
            .setColor(config.colors.warning)
            .setTitle(getResponse('pfc.challenge.title'))
            .setDescription(getResponse('pfc.challenge.description', {
                challenger: challenger,
                opponent: opponentMention,
                bet: betAmount
            }))
            .setTimestamp();
        
        // Create buttons for acceptance
        const acceptButton = new ButtonBuilder()
            .setCustomId('pfc_accept')
            .setLabel('Accepter')
            .setEmoji('✅')
            .setStyle(ButtonStyle.Success);
        
        const refuseButton = new ButtonBuilder()
            .setCustomId('pfc_refuse')
            .setLabel('Refuser')
            .setEmoji('❌')
            .setStyle(ButtonStyle.Danger);
        
        const row = new ActionRowBuilder()
            .addComponents(acceptButton, refuseButton);
        
        const challengeMsg = await message.reply({ embeds: [challengeEmbed], components: [row] });
        
        // Wait for button interaction
        const filter = i => {
            return i.user.id === opponentId && (i.customId === 'pfc_accept' || i.customId === 'pfc_refuse');
        };
        
        try {
            const interaction = await challengeMsg.awaitMessageComponent({ filter, time: 30000 });
            
            // Disable buttons after interaction
            acceptButton.setDisabled(true);
            refuseButton.setDisabled(true);
            await challengeMsg.edit({ components: [row] });
            
            // Check if refused
            if (interaction.customId === 'pfc_refuse') {
                await interaction.update({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(config.colors.error)
                            .setTitle(getResponse('pfc.refused.title'))
                            .setDescription(getResponse('pfc.refused.description', {
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
                        .setTitle(getResponse('pfc.accepted.title'))
                        .setDescription(getResponse('pfc.accepted.description', {
                            opponent: opponentMention
                        }))
                        .setTimestamp()
                ],
                components: []
            });
            
            // Show game instructions and buttons
            const gameEmbed = new EmbedBuilder()
                .setColor(config.colors.primary)
                .setTitle(getResponse('pfc.game.title'))
                .setDescription(getResponse('pfc.game.description'))
                .setTimestamp();
            
            // Create choice buttons
            const pierreButton = new ButtonBuilder()
                .setCustomId('pfc_pierre')
                .setLabel('Pierre')
                .setEmoji('🪨')
                .setStyle(ButtonStyle.Secondary);
            
            const feuilleButton = new ButtonBuilder()
                .setCustomId('pfc_feuille')
                .setLabel('Feuille')
                .setEmoji('✋')
                .setStyle(ButtonStyle.Secondary);
            
            const ciseauxButton = new ButtonBuilder()
                .setCustomId('pfc_ciseaux')
                .setLabel('Ciseaux')
                .setEmoji('✂️')
                .setStyle(ButtonStyle.Secondary);
            
            const gameRow = new ActionRowBuilder()
                .addComponents(pierreButton, feuilleButton, ciseauxButton);
            
            const gameMsg = await message.channel.send({ embeds: [gameEmbed], components: [gameRow] });
            
            // Wait for both players to make their choices
            const choices = new Map();
            const choiceFilter = i => {
                return (i.user.id === challengerId || i.user.id === opponentId) && 
                       i.customId.startsWith('pfc_') && 
                       i.customId !== 'pfc_accept' && 
                       i.customId !== 'pfc_refuse';
            };
            
            const choiceCollector = gameMsg.createMessageComponentCollector({ filter: choiceFilter, time: 30000 });
            
            choiceCollector.on('collect', async i => {
                // Only allow one choice per player
                if (choices.has(i.user.id)) {
                    await i.reply({ content: getResponse('pfc.alreadyChosen'), ephemeral: true });
                    return;
                }
                
                const choice = i.customId.replace('pfc_', '').toUpperCase();
                choices.set(i.user.id, choice);
                
                await i.reply({ content: getResponse('pfc.choiceMade'), ephemeral: true });
                
                if (choices.size === 2) {
                    choiceCollector.stop('both_chosen');
                }
            });
            
            await new Promise((resolve, reject) => {
                choiceCollector.on('end', (collected, reason) => {
                    if (reason === 'both_chosen') {
                        resolve();
                    } else {
                        reject(new Error('timeout'));
                    }
                });
            });
            
            // Disable all choice buttons
            pierreButton.setDisabled(true);
            feuilleButton.setDisabled(true);
            ciseauxButton.setDisabled(true);
            await gameMsg.edit({ components: [gameRow] });
            
            // Determine winner
            const challengerChoice = choices.get(challengerId);
            const opponentChoice = choices.get(opponentId);
            
            // Safety check - should not happen due to promise reject, but just in case
            if (!challengerChoice || !opponentChoice) {
                throw new Error('timeout');
            }
            
            let winner = null;
            let loser = null;
            let isDraw = false;
            
            if (challengerChoice === opponentChoice) {
                isDraw = true;
            } else if (CHOICES[challengerChoice].beats === opponentChoice) {
                winner = challengerId;
                loser = opponentId;
            } else {
                winner = opponentId;
                loser = challengerId;
            }
            
            // Create result embed
            const resultEmbed = new EmbedBuilder()
                .setTimestamp();
            
            // Get avatars
            const challengerAvatar = challenger.displayAvatarURL({ size: 64 });
            const opponentAvatar = opponentMention.displayAvatarURL({ size: 64 });
            
            // Create visual VS display (used for both draw and victory)
            const vsDisplay = getResponse('pfc.result.vsDisplay', {
                challengerChoice: CHOICES[challengerChoice].emoji,
                challengerChoiceName: CHOICES[challengerChoice].name,
                opponentChoice: CHOICES[opponentChoice].emoji,
                opponentChoiceName: CHOICES[opponentChoice].name
            });
            const playersDisplay = getResponse('pfc.result.playersDisplay', {
                challenger: challenger,
                opponent: opponentMention
            });
            
            if (isDraw) {
                resultEmbed
                    .setColor(config.colors.warning)
                    .setTitle(getResponse('pfc.result.titleDraw'))
                    .setDescription(`${vsDisplay}\n${playersDisplay}\n\n${getResponse('pfc.result.drawMessage')}`)
                    .setThumbnail(challengerAvatar)
                    .setImage(opponentAvatar);
            } else {
                // Transfer LC
                await db.updateBalance(winner, betAmount);
                await db.updateBalance(loser, -betAmount);
                
                // Record game
                await db.recordGame('pfc', challengerId, opponentId, betAmount, winner === challengerId ? 'win' : 'loss', winner === challengerId ? betAmount : 0);
                await db.recordGame('pfc', opponentId, challengerId, betAmount, winner === opponentId ? 'win' : 'loss', winner === opponentId ? betAmount : 0);
                
                const winnerUser = winner === challengerId ? challenger : opponentMention;
                const loserUser = winner === challengerId ? opponentMention : challenger;
                
                // Victory announcement
                const victoryMessage = getResponse('pfc.result.victoryMessage', {
                    winner: winnerUser,
                    winnings: betAmount
                });
                
                resultEmbed
                    .setColor(config.colors.success)
                    .setTitle(getResponse('pfc.result.titleVictory'))
                    .setDescription(`${vsDisplay}\n${playersDisplay}${victoryMessage}`)
                    .setThumbnail(challengerAvatar)
                    .setImage(opponentAvatar);
            }
            
            await message.channel.send({ embeds: [resultEmbed] });
            
        } catch (error) {
            // Timeout or error
            if (error.message === 'timeout') {
                const timeoutEmbed = new EmbedBuilder()
                    .setColor(config.colors.error)
                    .setTitle(getResponse('pfc.timeout.title'))
                    .setDescription(getResponse('pfc.timeout.description'))
                    .setTimestamp();
                
                await message.channel.send({ embeds: [timeoutEmbed] });
            } else {
                // Acceptance timeout
                const timeoutEmbed = new EmbedBuilder()
                    .setColor(config.colors.error)
                    .setTitle(getResponse('pfc.refused.title'))
                    .setDescription(getResponse('pfc.refused.description', {
                        opponent: opponentMention
                    }))
                    .setTimestamp();
                
                await challengeMsg.edit({ embeds: [timeoutEmbed], components: [] });
            }
        } finally {
            activePFCGames.delete(challengerId);
            activePFCGames.delete(opponentId);
        }
    }
};
