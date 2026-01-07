const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../database/db');
const config = require('../config.json');
const { getResponse } = require('../utils/responseHelper');

// Active games storage
const activeRapideGames = new Map();

// Word list for the typing challenge
const wordList = [
    'champion', 'victoire', 'rapidité', 'clavier', 'discord', 'galaxie', 'musique', 
    'aventure', 'diamant', 'étoile', 'cascade', 'tempête', 'mystère', 'horizon',
    'dragon', 'phénix', 'éclair', 'thunder', 'cosmos', 'crystal', 'velocity',
    'phoenix', 'quantum', 'enigma', 'nebula', 'asteroid', 'comet', 'stellar',
    'supernova', 'vortex', 'infinity', 'paradox', 'eclipse', 'aurora', 'meteor'
];

module.exports = {
    name: 'rapide',
    description: 'Fast typing game between two players',
    
    async execute(message, args) {
        const challenger = message.author;
        const challengerId = challenger.id;
        
        // Get opponent
        const opponentMention = message.mentions.users.first();
        if (!opponentMention) {
            return message.reply(getResponse('rapide.noOpponent'));
        }
        
        if (opponentMention.id === challengerId) {
            return message.reply(getResponse('rapide.selfChallenge'));
        }
        
        if (opponentMention.bot) {
            return message.reply(getResponse('rapide.botChallenge'));
        }
        
        const opponentId = opponentMention.id;
        
        // Get bet amount
        const betAmount = parseInt(args[1]);
        if (!betAmount || betAmount < config.games.rapide.minBet || betAmount > config.games.rapide.maxBet) {
            return message.reply(getResponse('rapide.invalidBet', {
                minBet: config.games.rapide.minBet,
                maxBet: config.games.rapide.maxBet
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
            return message.reply(getResponse('rapide.insufficientBalanceChallenger', {
                balance: challengerUser.balance
            }));
        }
        
        if (opponentUser.balance < betAmount) {
            return message.reply(getResponse('rapide.insufficientBalanceOpponent', {
                opponent: opponentMention.username
            }));
        }
        
        // Check if already in a game
        if (activeRapideGames.has(challengerId) || activeRapideGames.has(opponentId)) {
            return message.reply(getResponse('rapide.alreadyInGame'));
        }
        
        // Create game request
        const gameId = `${challengerId}-${opponentId}-${Date.now()}`;
        activeRapideGames.set(challengerId, gameId);
        activeRapideGames.set(opponentId, gameId);
        
        const challengeEmbed = new EmbedBuilder()
            .setColor(config.colors.warning)
            .setTitle(getResponse('rapide.challenge.title'))
            .setDescription(getResponse('rapide.challenge.description', {
                challenger: challenger,
                opponent: opponentMention,
                bet: betAmount
            }))
            .setTimestamp();
        
        // Create buttons for acceptance
        const acceptButton = new ButtonBuilder()
            .setCustomId('rapide_accept')
            .setLabel('Accepter')
            .setEmoji('✅')
            .setStyle(ButtonStyle.Success);
        
        const refuseButton = new ButtonBuilder()
            .setCustomId('rapide_refuse')
            .setLabel('Refuser')
            .setEmoji('❌')
            .setStyle(ButtonStyle.Danger);
        
        const row = new ActionRowBuilder()
            .addComponents(acceptButton, refuseButton);
        
        const challengeMsg = await message.reply({ embeds: [challengeEmbed], components: [row] });
        
        // Wait for button interaction
        const filter = i => {
            return i.user.id === opponentId && (i.customId === 'rapide_accept' || i.customId === 'rapide_refuse');
        };
        
        try {
            const interaction = await challengeMsg.awaitMessageComponent({ filter, time: 60000 });
            
            // Disable buttons after interaction
            acceptButton.setDisabled(true);
            refuseButton.setDisabled(true);
            await challengeMsg.edit({ components: [row] });
            
            // Check if refused
            if (interaction.customId === 'rapide_refuse') {
                await interaction.update({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(config.colors.error)
                            .setTitle(getResponse('rapide.refused.title'))
                            .setDescription(getResponse('rapide.refused.description', {
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
                        .setTitle(getResponse('rapide.accepted.title'))
                        .setDescription(getResponse('rapide.accepted.description', {
                            opponent: opponentMention
                        }))
                        .setTimestamp()
                ],
                components: []
            });
            
            // Show rules and ready button
            const rulesEmbed = new EmbedBuilder()
                .setColor(config.colors.primary)
                .setTitle(getResponse('rapide.rules.title'))
                .setDescription(getResponse('rapide.rules.description'))
                .setTimestamp();
            
            const readyButton = new ButtonBuilder()
                .setCustomId('rapide_ready')
                .setLabel('Prêt')
                .setEmoji('👍')
                .setStyle(ButtonStyle.Primary);
            
            const readyRow = new ActionRowBuilder()
                .addComponents(readyButton);
            
            const rulesMsg = await message.channel.send({ embeds: [rulesEmbed], components: [readyRow] });
            
            // Wait for both players to be ready
            const readyPlayers = new Set();
            const readyFilter = i => {
                return (i.user.id === challengerId || i.user.id === opponentId) && i.customId === 'rapide_ready';
            };
            
            const readyCollector = rulesMsg.createMessageComponentCollector({ filter: readyFilter, time: 30000 });
            
            readyCollector.on('collect', async i => {
                readyPlayers.add(i.user.id);
                await i.reply({ content: `${i.user} est prêt! (${readyPlayers.size}/2)`, ephemeral: false });
                
                if (readyPlayers.size === 2) {
                    readyCollector.stop('both_ready');
                }
            });
            
            await new Promise((resolve, reject) => {
                readyCollector.on('end', (collected, reason) => {
                    if (reason === 'both_ready') {
                        resolve();
                    } else {
                        reject(new Error('timeout'));
                    }
                });
            });
            
            // Disable ready button
            readyButton.setDisabled(true);
            await rulesMsg.edit({ components: [readyRow] });
            
            // Extended delay before countdown
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Countdown
            const countdownEmbed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setTitle(getResponse('rapide.countdown.title'))
                .setDescription(getResponse('rapide.countdown.description', { seconds: 5 }))
                .setTimestamp();
            
            const countdownMsg = await message.channel.send({ embeds: [countdownEmbed] });
            
            // Count down from 5
            for (let i = 5; i > 0; i--) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const updateEmbed = new EmbedBuilder()
                    .setColor(config.colors.warning)
                    .setTitle(getResponse('rapide.countdown.title'))
                    .setDescription(getResponse('rapide.countdown.count', { count: i }))
                    .setTimestamp();
                
                await countdownMsg.edit({ embeds: [updateEmbed] });
            }
            
            // Select random word
            const targetWord = wordList[Math.floor(Math.random() * wordList.length)];
            
            // Show word
            const wordEmbed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle(getResponse('rapide.game.title'))
                .setDescription(getResponse('rapide.game.description', { word: targetWord }))
                .setTimestamp();
            
            await countdownMsg.edit({ embeds: [wordEmbed] });
            
            // Wait for first correct answer
            const gameFilter = m => 
                (m.author.id === challengerId || m.author.id === opponentId) && 
                m.content.toLowerCase() === targetWord.toLowerCase();
            
            try {
                const collected = await message.channel.awaitMessages({ 
                    filter: gameFilter, 
                    max: 1, 
                    time: 30000, 
                    errors: ['time'] 
                });
                
                const winner = collected.first().author;
                const winnerId = winner.id;
                const loser = winnerId === challengerId ? opponentMention : challenger;
                const loserId = winnerId === challengerId ? opponentId : challengerId;
                
                // Transfer LC
                await db.updateBalance(winnerId, betAmount);
                await db.updateBalance(loserId, -betAmount);
                
                // Record game
                await db.recordGame('rapide', challengerId, opponentId, betAmount, winnerId === challengerId ? 'win' : 'loss', winnerId === challengerId ? betAmount : 0);
                await db.recordGame('rapide', opponentId, challengerId, betAmount, winnerId === opponentId ? 'win' : 'loss', winnerId === opponentId ? betAmount : 0);
                
                const resultEmbed = new EmbedBuilder()
                    .setColor(config.colors.success)
                    .setTitle(getResponse('rapide.result.title'))
                    .setDescription(getResponse('rapide.result.description', {
                        winner: winner,
                        winnings: betAmount * 2,
                        loser: loser,
                        bet: betAmount
                    }))
                    .setTimestamp();
                
                await message.channel.send({ embeds: [resultEmbed] });
                
            } catch (timeoutError) {
                // Nobody typed the word in time
                const timeoutEmbed = new EmbedBuilder()
                    .setColor(config.colors.error)
                    .setTitle(getResponse('rapide.timeout.title'))
                    .setDescription(getResponse('rapide.timeout.description'))
                    .setTimestamp();
                
                await message.channel.send({ embeds: [timeoutEmbed] });
            }
            
        } catch (error) {
            // Opponent didn't accept
            const refusedEmbed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setTitle(getResponse('rapide.refused.title'))
                .setDescription(getResponse('rapide.refused.description', {
                    opponent: opponentMention
                }))
                .setTimestamp();
            
            await message.channel.send({ embeds: [refusedEmbed] });
        } finally {
            activeRapideGames.delete(challengerId);
            activeRapideGames.delete(opponentId);
        }
    }
};
