const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../database/db');
const config = require('../config.json');
const { getResponse } = require('../utils/responseHelper');

// Active games storage
const activeDuels = new Map();
const activeRoulettes = new Map();

module.exports = {
    name: 'jeu',
    description: 'Play games like duel and roulette',
    
    async execute(message, args) {
        const gameType = args[0]?.toLowerCase();
        
        if (!gameType) {
            const embed = new EmbedBuilder()
                .setColor(config.colors.primary)
                .setTitle(getResponse('games.list.title'))
                .setDescription(getResponse('games.list.description'))
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        if (gameType === 'duel') {
            return handleDuel(message, args.slice(1));
        } else if (gameType === 'roulette') {
            return handleRoulette(message, args.slice(1));
        } else {
            return message.reply(getResponse('games.unknownGame'));
        }
    }
};

async function handleDuel(message, args) {
    const challenger = message.author;
    const challengerId = challenger.id;
    
    // Get opponent
    const opponentMention = message.mentions.users.first();
    if (!opponentMention) {
        return message.reply(getResponse('games.duel.noOpponent'));
    }
    
    if (opponentMention.id === challengerId) {
        return message.reply(getResponse('games.duel.selfChallenge'));
    }
    
    if (opponentMention.bot) {
        return message.reply(getResponse('games.duel.botChallenge'));
    }
    
    const opponentId = opponentMention.id;
    
    // Get bet amount
    const betAmount = parseInt(args[1]);
    if (!betAmount || betAmount < config.games.duel.minBet || betAmount > config.games.duel.maxBet) {
        return message.reply(getResponse('games.duel.invalidBet', {
            minBet: config.games.duel.minBet,
            maxBet: config.games.duel.maxBet
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
        return message.reply(getResponse('games.duel.insufficientBalanceChallenger', {
            balance: challengerUser.balance
        }));
    }
    
    if (opponentUser.balance < betAmount) {
        return message.reply(getResponse('games.duel.insufficientBalanceOpponent', {
            opponent: opponentMention.username
        }));
    }
    
    // Check if already in a duel
    if (activeDuels.has(challengerId) || activeDuels.has(opponentId)) {
        return message.reply(getResponse('games.duel.alreadyInDuel'));
    }
    
    // Create duel request
    const duelId = `${challengerId}-${opponentId}-${Date.now()}`;
    activeDuels.set(challengerId, duelId);
    activeDuels.set(opponentId, duelId);
    
    const embed = new EmbedBuilder()
        .setColor(config.colors.warning)
        .setTitle(getResponse('games.duel.challenge.title'))
        .setDescription(getResponse('games.duel.challenge.description', {
            challenger: challenger,
            opponent: opponentMention,
            bet: betAmount
        }))
        .setTimestamp();
    
    // Create buttons for acceptance
    const acceptButton = new ButtonBuilder()
        .setCustomId('duel_accept')
        .setLabel('Accepter')
        .setEmoji('✅')
        .setStyle(ButtonStyle.Success);
    
    const refuseButton = new ButtonBuilder()
        .setCustomId('duel_refuse')
        .setLabel('Refuser')
        .setEmoji('❌')
        .setStyle(ButtonStyle.Danger);
    
    const row = new ActionRowBuilder()
        .addComponents(acceptButton, refuseButton);
    
    const challengeMsg = await message.reply({ embeds: [embed], components: [row] });
    
    // Wait for button interaction
    const filter = i => {
        return i.user.id === opponentId && (i.customId === 'duel_accept' || i.customId === 'duel_refuse');
    };
    
    try {
        const interaction = await challengeMsg.awaitMessageComponent({ filter, time: 30000 });
        
        // Disable buttons after interaction
        acceptButton.setDisabled(true);
        refuseButton.setDisabled(true);
        await challengeMsg.edit({ components: [row] });
        
        // Check if refused
        if (interaction.customId === 'duel_refuse') {
            await interaction.update({
                embeds: [
                    new EmbedBuilder()
                        .setColor(config.colors.error)
                        .setTitle(getResponse('games.duel.refused.title'))
                        .setDescription(getResponse('games.duel.refused.description', {
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
                    .setTitle(getResponse('games.duel.accepted.title'))
                    .setDescription(getResponse('games.duel.accepted.description', {
                        opponent: opponentMention
                    }))
                    .setTimestamp()
            ],
            components: []
        });
        
        // Execute duel
        const winner = Math.random() < 0.5 ? challengerId : opponentId;
        const loser = winner === challengerId ? opponentId : challengerId;
        const winnerUser = winner === challengerId ? challenger : opponentMention;
        const loserUser = winner === challengerId ? opponentMention : challenger;
        
        // Transfer LC
        await db.updateBalance(winner, betAmount);
        await db.updateBalance(loser, -betAmount);
        
        // Record game
        await db.recordGame('duel', challengerId, opponentId, betAmount, winner === challengerId ? 'win' : 'loss', winner === challengerId ? betAmount : 0);
        await db.recordGame('duel', opponentId, challengerId, betAmount, winner === opponentId ? 'win' : 'loss', winner === opponentId ? betAmount : 0);
        
        const resultEmbed = new EmbedBuilder()
            .setColor(config.colors.success)
            .setTitle(getResponse('games.duel.result.title'))
            .setDescription(getResponse('games.duel.result.description', {
                winner: winnerUser,
                totalWinnings: betAmount * 2,
                loser: loserUser,
                bet: betAmount
            }))
            .setTimestamp();
        
        await message.channel.send({ embeds: [resultEmbed] });
        
    } catch (error) {
        const timeoutEmbed = new EmbedBuilder()
            .setColor(config.colors.error)
            .setTitle(getResponse('games.duel.timeout.title'))
            .setDescription(getResponse('games.duel.timeout.description', {
                opponent: opponentMention
            }))
            .setTimestamp();
        
        await message.channel.send({ embeds: [timeoutEmbed] });
    } finally {
        activeDuels.delete(challengerId);
        activeDuels.delete(opponentId);
    }
}

async function handleRoulette(message, args) {
    const player = message.author;
    const playerId = player.id;
    const guildId = message.guild.id;
    
    // Get bet amount
    const betAmount = parseInt(args[0]);
    if (!betAmount || betAmount < config.games.roulette.minBet || betAmount > config.games.roulette.maxBet) {
        return message.reply(getResponse('games.roulette.invalidBet', {
            minBet: config.games.roulette.minBet,
            maxBet: config.games.roulette.maxBet
        }));
    }
    
    // Ensure user exists
    let user = await db.getUser(playerId);
    if (!user) {
        user = await db.createUser(playerId, player.username);
    }
    
    // Check balance
    if (user.balance < betAmount) {
        return message.reply(getResponse('games.roulette.insufficientBalance', {
            balance: user.balance
        }));
    }
    
    // Check if roulette is active for this guild
    if (!activeRoulettes.has(guildId)) {
        // Start new roulette
        activeRoulettes.set(guildId, {
            players: new Map(),
            timer: null,
            channel: message.channel
        });
    }
    
    const roulette = activeRoulettes.get(guildId);
    
    // Add player
    if (roulette.players.has(playerId)) {
        return message.reply(getResponse('games.roulette.alreadyJoined'));
    }
    
    roulette.players.set(playerId, { user: player, bet: betAmount });
    
    // Deduct bet
    await db.updateBalance(playerId, -betAmount);
    
    const totalPot = Array.from(roulette.players.values()).reduce((sum, p) => sum + p.bet, 0);
    
    const embed = new EmbedBuilder()
        .setColor(config.colors.warning)
        .setTitle(getResponse('games.roulette.joined.title'))
        .setDescription(getResponse('games.roulette.joined.description', {
            player: player,
            bet: betAmount,
            playerCount: roulette.players.size,
            totalPot: totalPot
        }))
        .setTimestamp();
    
    await message.reply({ embeds: [embed] });
    
    // Clear existing timer
    if (roulette.timer) {
        clearTimeout(roulette.timer);
    }
    
    // Set new timer
    roulette.timer = setTimeout(async () => {
        await executeRoulette(guildId);
    }, config.games.roulette.waitTime);
}

async function executeRoulette(guildId) {
    const roulette = activeRoulettes.get(guildId);
    if (!roulette || roulette.players.size === 0) {
        activeRoulettes.delete(guildId);
        return;
    }
    
    // Pick winner
    const playersArray = Array.from(roulette.players.values());
    const winner = playersArray[Math.floor(Math.random() * playersArray.length)];
    
    const totalPot = playersArray.reduce((sum, p) => sum + p.bet, 0);
    const winnings = Math.floor(totalPot * config.games.roulette.winMultiplier);
    
    // Award winnings
    await db.updateBalance(winner.user.id, winnings);
    
    // Record game for all players
    for (const [playerId, playerData] of roulette.players) {
        const isWinner = playerId === winner.user.id;
        await db.recordGame(
            'roulette',
            playerId,
            null,
            playerData.bet,
            isWinner ? 'win' : 'loss',
            isWinner ? winnings : 0
        );
    }
    
    const resultEmbed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle(getResponse('games.roulette.result.title'))
        .setDescription(getResponse('games.roulette.result.description', {
            winner: winner.user,
            winnings: winnings,
            totalPot: totalPot,
            playerCount: playersArray.length
        }))
        .setTimestamp();
    
    await roulette.channel.send({ embeds: [resultEmbed] });
    
    // Clean up
    activeRoulettes.delete(guildId);
}
