const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { db } = require('../database/db');
const config = require('../config.json');
const responses = require('../responses.json');
const { getResponse, replacePlaceholders } = require('../utils/responseHelper');
const multiplierHelper = require('../utils/multiplierHelper');

// Active games storage
const activeRoues = new Map();
const activeBlackjacks = new Map();

// Helper functions for roulette colors
const colorEmojis = { rouge: '🟥', noir: '⬛', vert: '🟩' };
const colorNames = { rouge: 'Rouge', noir: 'Noir', vert: 'Vert' };

function getColorEmoji(colorName) {
    return colorEmojis[colorName] || '⚪';
}

function formatColor(colorName) {
    return colorNames[colorName] || colorName;
}

module.exports = {
    name: 'casino',
    description: 'Casino games menu and individual game commands',
    
    async execute(message, args) {
        // Display casino menu
        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setTitle(getResponse('casino.menu.title'))
            .setDescription(getResponse('casino.menu.description'))
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    },

    async handleRoue(message, args) {
        return handleRoue(message, args);
    },

    async handleBlackjack(message, args) {
        return handleBlackjack(message, args);
    },

    async handleMachine(message, args) {
        return handleMachine(message, args);
    }
};

async function handleRoue(message, args) {
    const player = message.author;
    const playerId = player.id;
    
    // Get bet amount and color
    const betAmount = parseInt(args[0]);
    const color = args[1]?.toLowerCase();
    
    if (!betAmount || betAmount < config.games.roue.minBet || betAmount > config.games.roue.maxBet) {
        return message.reply(getResponse('casino.roue.invalidBet', {
            minBet: config.games.roue.minBet,
            maxBet: config.games.roue.maxBet
        }));
    }
    
    if (!color || !['rouge', 'noir', 'vert'].includes(color)) {
        return message.reply(getResponse('casino.roue.invalidColor'));
    }
    
    // Ensure user exists
    let user = await db.getUser(playerId);
    if (!user) {
        user = await db.createUser(playerId, player.username);
    }
    
    // Check balance
    if (user.balance < betAmount) {
        return message.reply(getResponse('casino.roue.insufficientBalance', {
            balance: user.balance
        }));
    }
    
    // Deduct bet
    await db.updateBalance(playerId, -betAmount);
    
    // Step 1 & 2: Send suspenseful message with GIF
    const suspenseEmbed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setDescription(getResponse('casino.roue.suspense'))
        .setImage(config.games.roue.gifUrl)
        .setTimestamp();
    
    const initialMsg = await message.reply({ embeds: [suspenseEmbed] });
    
    // Wait for suspense
    await new Promise(resolve => setTimeout(resolve, config.games.roue.suspenseDelay));
    
    // Spin the wheel - probabilities: Rouge (18/37), Noir (18/37), Vert (1/37)
    const random = Math.random();
    let result;
    let winnings = 0;
    
    if (random < 1/37) {
        result = 'vert';
    } else if (random < 19/37) {
        result = 'rouge';
    } else {
        result = 'noir';
    }
    
    // Calculate winnings
    let baseWinnings = 0;
    if (result === color) {
        if (color === 'vert') {
            baseWinnings = betAmount * config.games.roue.greenMultiplier;
        } else {
            baseWinnings = betAmount * config.games.roue.colorMultiplier;
        }
    }
    
    // Apply multiplier if active and player won
    let finalWinnings = baseWinnings;
    let multiplierUsed = false;
    let multiplierValue = 1;
    
    if (baseWinnings > 0) {
        const multiplierResult = await multiplierHelper.applyMultiplier(playerId, baseWinnings);
        finalWinnings = multiplierResult.finalWinnings;
        multiplierUsed = multiplierResult.multiplierUsed;
        multiplierValue = multiplierResult.multiplierValue;
        
        await db.updateBalance(playerId, finalWinnings);
    }
    
    // Record game
    await db.recordGame('roue', playerId, null, betAmount, result === color ? 'win' : 'loss', finalWinnings);
    
    // Step 3: Display the result
    let resultMessage;
    let resultTitle;
    if (result === color) {
        // Win message
        resultTitle = '🏆 Roulette - **Gagné !**';
        resultMessage = getResponse('casino.roue.result.win', {
            colorEmoji: getColorEmoji(result),
            color: formatColor(result),
            player: player.toString(),
            winnings: finalWinnings
        });
        
        if (multiplierUsed) {
            resultMessage += `\n\n${multiplierHelper.getMultiplierAppliedMessage(baseWinnings, finalWinnings, multiplierValue)}`;
        }
    } else {
        // Loss message
        resultTitle = '❌ Roulette - **Perdu !**';
        resultMessage = getResponse('casino.roue.result.loss', {
            colorEmoji: getColorEmoji(result),
            color: formatColor(result),
            player: player.toString()
        });
    }
    
    const resultEmbed = new EmbedBuilder()
        .setColor(result === color ? config.colors.success : config.colors.error)
        .setTitle(resultTitle)
        .setDescription(resultMessage)
        .setTimestamp();
    
    return initialMsg.edit({ embeds: [resultEmbed] });
}

async function handleBlackjack(message, args) {
    const player = message.author;
    const playerId = player.id;
    
    // Get bet amount
    const betAmount = parseInt(args[0]);
    if (!betAmount || betAmount < config.games.blackjack.minBet || betAmount > config.games.blackjack.maxBet) {
        return message.reply(getResponse('casino.blackjack.invalidBet', {
            minBet: config.games.blackjack.minBet,
            maxBet: config.games.blackjack.maxBet
        }));
    }
    
    // Ensure user exists
    let user = await db.getUser(playerId);
    if (!user) {
        user = await db.createUser(playerId, player.username);
    }
    
    // Check balance
    if (user.balance < betAmount) {
        return message.reply(getResponse('casino.blackjack.insufficientBalance', {
            balance: user.balance
        }));
    }
    
    // Check if already in a blackjack game
    if (activeBlackjacks.has(playerId)) {
        return message.reply(getResponse('casino.blackjack.alreadyPlaying'));
    }
    
    // Deduct bet
    await db.updateBalance(playerId, -betAmount);
    
    // Create deck and deal initial cards
    const deck = createDeck();
    const playerHand = [drawCard(deck), drawCard(deck)];
    const dealerHand = [drawCard(deck), drawCard(deck)];
    
    const playerScore = calculateScore(playerHand);
    const dealerFirstCard = dealerHand[0];
    
    // Check for immediate blackjack
    if (playerScore === 21) {
        const dealerScore = calculateScore(dealerHand);
        if (dealerScore === 21) {
            // Push - return bet
            await db.updateBalance(playerId, betAmount);
            await db.recordGame('blackjack', playerId, null, betAmount, 'push', 0);
            
            const embed = new EmbedBuilder()
                .setColor(config.colors.warning)
                .setTitle(getResponse('casino.blackjack.push.title'))
                .setDescription(getResponse('casino.blackjack.push.description', {
                    playerHand: formatHand(playerHand),
                    dealerHand: formatHand(dealerHand)
                }))
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        } else {
            // Player blackjack - win 2.5x
            const baseWinnings = Math.floor(betAmount * config.games.blackjack.blackjackMultiplier);
            
            // Apply multiplier if active
            const { finalWinnings, multiplierUsed, multiplierValue } = await multiplierHelper.applyMultiplier(playerId, baseWinnings);
            
            await db.updateBalance(playerId, finalWinnings);
            await db.recordGame('blackjack', playerId, null, betAmount, 'win', finalWinnings);
            
            let description = getResponse('casino.blackjack.blackjack.description', {
                winnings: finalWinnings,
                playerHand: formatHand(playerHand)
            });
            
            if (multiplierUsed) {
                description += `\n\n${multiplierHelper.getMultiplierAppliedMessage(baseWinnings, finalWinnings, multiplierValue)}`;
            }
            
            const embed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle('🏆 Blackjack - **BLACKJACK !**')
                .setDescription(description)
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }
    }
    
    // Store game state
    activeBlackjacks.set(playerId, {
        deck,
        playerHand,
        dealerHand,
        betAmount,
        channel: message.channel
    });
    
    const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle(getResponse('casino.blackjack.started.title'))
        .setDescription(getResponse('casino.blackjack.started.description', {
            playerHand: formatHand(playerHand),
            dealerCards: formatDealerCards(dealerHand)
        }))
        .setFooter({ text: getResponse('casino.blackjack.started.footer') })
        .setTimestamp();
    
    // Create action buttons
    const tirerButton = new ButtonBuilder()
        .setCustomId('blackjack_hit')
        .setLabel('Tirer')
        .setEmoji('🃏')
        .setStyle(ButtonStyle.Primary);
    
    const resterButton = new ButtonBuilder()
        .setCustomId('blackjack_stand')
        .setLabel('Rester')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Secondary);
    
    const row = new ActionRowBuilder()
        .addComponents(tirerButton, resterButton);
    
    const gameMessage = await message.reply({ embeds: [embed], components: [row] });
    
    // Wait for player action via button
    const filter = i => i.user.id === playerId && (i.customId === 'blackjack_hit' || i.customId === 'blackjack_stand');
    
    try {
        const interaction = await gameMessage.awaitMessageComponent({ filter, time: 60000 });
        
        // Disable buttons after interaction
        tirerButton.setDisabled(true);
        resterButton.setDisabled(true);
        await gameMessage.edit({ components: [row] });
        
        // Acknowledge the interaction
        await interaction.deferUpdate();
        
        if (interaction.customId === 'blackjack_hit') {
            await handleBlackjackHit(message, playerId);
        } else {
            await handleBlackjackStand(message, playerId);
        }
    } catch (error) {
        // Timeout - forfeit
        activeBlackjacks.delete(playerId);
        await db.recordGame('blackjack', playerId, null, betAmount, 'loss', 0);
        
        // Disable buttons on timeout
        tirerButton.setDisabled(true);
        resterButton.setDisabled(true);
        await gameMessage.edit({ components: [row] });
        
        const timeoutEmbed = new EmbedBuilder()
            .setColor(config.colors.error)
            .setTitle(getResponse('casino.blackjack.timeout.title'))
            .setDescription(getResponse('casino.blackjack.timeout.description'))
            .setTimestamp();
        
        await message.channel.send({ embeds: [timeoutEmbed] });
    }
}

async function handleBlackjackHit(message, playerId) {
    const game = activeBlackjacks.get(playerId);
    if (!game) return;
    
    const player = message.author;
    const newCard = drawCard(game.deck);
    game.playerHand.push(newCard);
    
    const playerScore = calculateScore(game.playerHand);
    
    if (playerScore > 21) {
        // Bust
        activeBlackjacks.delete(playerId);
        await db.recordGame('blackjack', playerId, null, game.betAmount, 'loss', 0);
        
        const embed = new EmbedBuilder()
            .setColor(config.colors.error)
            .setTitle('❌ Blackjack - **Perdu !**')
            .setDescription(getResponse('casino.blackjack.bust.description', {
                playerHand: formatHand(game.playerHand),
                playerScore: playerScore,
                bet: game.betAmount
            }))
            .setTimestamp();
        
        return message.channel.send({ embeds: [embed] });
    } else if (playerScore === 21) {
        // Automatic stand at 21
        return handleBlackjackStand(message, playerId);
    } else {
        // Continue playing
        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setTitle(getResponse('casino.blackjack.hit.title'))
            .setDescription(getResponse('casino.blackjack.hit.description', {
                newCard: formatCard(newCard),
                playerHand: formatHand(game.playerHand),
                dealerCards: formatDealerCards(game.dealerHand)
            }))
            .setFooter({ text: getResponse('casino.blackjack.started.footer') })
            .setTimestamp();
        
        // Create action buttons
        const tirerButton = new ButtonBuilder()
            .setCustomId('blackjack_hit')
            .setLabel('Tirer')
            .setEmoji('🃏')
            .setStyle(ButtonStyle.Primary);
        
        const resterButton = new ButtonBuilder()
            .setCustomId('blackjack_stand')
            .setLabel('Rester')
            .setEmoji('🔒')
            .setStyle(ButtonStyle.Secondary);
        
        const row = new ActionRowBuilder()
            .addComponents(tirerButton, resterButton);
        
        const gameMessage = await message.channel.send({ embeds: [embed], components: [row] });
        
        // Wait for next action
        const filter = i => i.user.id === playerId && (i.customId === 'blackjack_hit' || i.customId === 'blackjack_stand');
        
        try {
            const interaction = await gameMessage.awaitMessageComponent({ filter, time: 60000 });
            
            // Disable buttons after interaction
            tirerButton.setDisabled(true);
            resterButton.setDisabled(true);
            await gameMessage.edit({ components: [row] });
            
            // Acknowledge the interaction
            await interaction.deferUpdate();
            
            if (interaction.customId === 'blackjack_hit') {
                await handleBlackjackHit(message, playerId);
            } else {
                await handleBlackjackStand(message, playerId);
            }
        } catch (error) {
            // Timeout
            activeBlackjacks.delete(playerId);
            await db.recordGame('blackjack', playerId, null, game.betAmount, 'loss', 0);
            
            // Disable buttons on timeout
            tirerButton.setDisabled(true);
            resterButton.setDisabled(true);
            await gameMessage.edit({ components: [row] });
            
            const timeoutEmbed = new EmbedBuilder()
                .setColor(config.colors.error)
                .setTitle(getResponse('casino.blackjack.timeout.title'))
                .setDescription(getResponse('casino.blackjack.timeout.description'))
                .setTimestamp();
            
            await message.channel.send({ embeds: [timeoutEmbed] });
        }
    }
}

async function handleBlackjackStand(message, playerId) {
    const game = activeBlackjacks.get(playerId);
    if (!game) return;
    
    const player = message.author;
    const playerScore = calculateScore(game.playerHand);
    
    // Dealer plays
    let dealerScore = calculateScore(game.dealerHand);
    while (dealerScore < 17) {
        game.dealerHand.push(drawCard(game.deck));
        dealerScore = calculateScore(game.dealerHand);
    }
    
    // Determine winner
    let result;
    let baseWinnings = 0;
    let finalWinnings = 0;
    let multiplierUsed = false;
    let multiplierValue = 1;
    
    if (dealerScore > 21) {
        // Dealer bust - player wins
        result = 'win';
        baseWinnings = game.betAmount * config.games.blackjack.winMultiplier;
    } else if (playerScore > dealerScore) {
        // Player wins
        result = 'win';
        baseWinnings = game.betAmount * config.games.blackjack.winMultiplier;
    } else if (playerScore < dealerScore) {
        // Dealer wins
        result = 'loss';
    } else {
        // Push
        result = 'push';
        baseWinnings = game.betAmount;
    }
    
    // Apply multiplier if player won (but not on push)
    if (result === 'win' && baseWinnings > 0) {
        const multiplierResult = await multiplierHelper.applyMultiplier(playerId, baseWinnings);
        finalWinnings = multiplierResult.finalWinnings;
        multiplierUsed = multiplierResult.multiplierUsed;
        multiplierValue = multiplierResult.multiplierValue;
    } else {
        finalWinnings = baseWinnings;
    }
    
    if (finalWinnings > 0) {
        await db.updateBalance(playerId, finalWinnings);
    }
    
    await db.recordGame('blackjack', playerId, null, game.betAmount, result, finalWinnings);
    activeBlackjacks.delete(playerId);
    
    // Get random variant for win/loss messages
    let description;
    let title;
    
    if (result === 'win' || result === 'loss') {
        const variants = responses.casino.blackjack.result[result].variants;
        const variantTemplate = getRandomVariant(variants);
        const variant = replacePlaceholders(variantTemplate, {
            winnings: finalWinnings,
            dealerScore: dealerScore
        });
        description = getResponse(`casino.blackjack.result.${result}.description`, {
            playerHand: formatHand(game.playerHand),
            dealerHand: formatHand(game.dealerHand),
            variant: variant
        });
        
        // Add multiplier message if used
        if (multiplierUsed && result === 'win') {
            description += `\n\n${multiplierHelper.getMultiplierAppliedMessage(baseWinnings, finalWinnings, multiplierValue)}`;
        }
        
        // Enhanced titles with emojis and bold text
        if (result === 'win') {
            title = '🏆 Blackjack - **Gagné !**';
        } else {
            title = '❌ Blackjack - **Perdu !**';
        }
    } else {
        description = getResponse(`casino.blackjack.result.${result}.description`, {
            playerHand: formatHand(game.playerHand),
            dealerHand: formatHand(game.dealerHand),
            bet: game.betAmount
        });
        title = getResponse(`casino.blackjack.result.${result}.title`);
    }
    
    const embed = new EmbedBuilder()
        .setColor(result === 'win' ? config.colors.success : (result === 'push' ? config.colors.warning : config.colors.error))
        .setTitle(title)
        .setDescription(description)
        .setTimestamp();
    
    return message.channel.send({ embeds: [embed] });
}

async function handleMachine(message, args) {
    const player = message.author;
    const playerId = player.id;
    
    // Get bet amount
    const betAmount = parseInt(args[0]);
    if (!betAmount || betAmount < config.games.machine.minBet || betAmount > config.games.machine.maxBet) {
        return message.reply(getResponse('casino.machine.invalidBet', {
            minBet: config.games.machine.minBet,
            maxBet: config.games.machine.maxBet
        }));
    }
    
    // Ensure user exists
    let user = await db.getUser(playerId);
    if (!user) {
        user = await db.createUser(playerId, player.username);
    }
    
    // Check balance
    if (user.balance < betAmount) {
        return message.reply(getResponse('casino.machine.insufficientBalance', {
            balance: user.balance
        }));
    }
    
    // Deduct bet
    await db.updateBalance(playerId, -betAmount);
    
    // Slot symbols
    const symbols = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '7️⃣'];
    const weights = [30, 25, 20, 15, 5, 3, 2]; // Higher weight = more common
    // Symbol multipliers for three-of-a-kind (corresponds to symbols array)
    const symbolMultipliers = [2, 3, 5, 10, 20, 50, 100];
    
    // Spin the reels
    const reel1 = weightedRandom(symbols, weights);
    const reel2 = weightedRandom(symbols, weights);
    const reel3 = weightedRandom(symbols, weights);
    
    // Calculate winnings
    let multiplier = 0;
    let winType = 'loss';
    
    if (reel1 === reel2 && reel2 === reel3) {
        // Three of a kind
        winType = 'jackpot';
        const symbolIndex = symbols.indexOf(reel1);
        multiplier = symbolMultipliers[symbolIndex];
    } else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
        // Two of a kind
        winType = 'match';
        multiplier = 1.5;
    }
    
    const winnings = multiplier > 0 ? Math.floor(betAmount * multiplier) : 0;
    
    // Apply bonus multiplier if active and player won
    let finalWinnings = winnings;
    let multiplierUsed = false;
    let multiplierValue = 1;
    
    if (winnings > 0) {
        const multiplierResult = await multiplierHelper.applyMultiplier(playerId, winnings);
        finalWinnings = multiplierResult.finalWinnings;
        multiplierUsed = multiplierResult.multiplierUsed;
        multiplierValue = multiplierResult.multiplierValue;
        
        await db.updateBalance(playerId, finalWinnings);
    }
    
    // Record game
    await db.recordGame('machine', playerId, null, betAmount, finalWinnings > 0 ? 'win' : 'loss', finalWinnings);
    
    // Enhanced title based on result
    let machineTitle;
    if (winType === 'jackpot') {
        machineTitle = '🏆 Machine à Sous - **JACKPOT !**';
    } else if (winType === 'match') {
        machineTitle = '🏆 Machine à Sous - **Gagné !**';
    } else {
        machineTitle = '❌ Machine à Sous - **Perdu !**';
    }
    
    let description = getResponse(`casino.machine.result.${winType}`, {
        reel1: reel1,
        reel2: reel2,
        reel3: reel3,
        bet: betAmount,
        winnings: finalWinnings,
        multiplier: multiplier
    });
    
    if (multiplierUsed) {
        description += `\n\n${multiplierHelper.getMultiplierAppliedMessage(winnings, finalWinnings, multiplierValue)}`;
    }
    
    const embed = new EmbedBuilder()
        .setColor(finalWinnings > 0 ? config.colors.success : config.colors.error)
        .setTitle(machineTitle)
        .setDescription(description)
        .setTimestamp();
    
    return message.reply({ embeds: [embed] });
}

// Helper functions for Blackjack
function createDeck() {
    const suits = ['♠', '♥', '♦', '♣'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck = [];
    
    for (const suit of suits) {
        for (const value of values) {
            deck.push({ suit, value });
        }
    }
    
    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    return deck;
}

function drawCard(deck) {
    return deck.pop();
}

function calculateScore(hand) {
    let score = 0;
    let aces = 0;
    
    for (const card of hand) {
        if (card.value === 'A') {
            aces++;
            score += 11;
        } else if (['J', 'Q', 'K'].includes(card.value)) {
            score += 10;
        } else {
            score += parseInt(card.value);
        }
    }
    
    // Adjust for aces
    while (score > 21 && aces > 0) {
        score -= 10;
        aces--;
    }
    
    return score;
}

function formatCard(card) {
    return `${card.suit}${card.value}`;
}

function formatHand(hand, showScore = true) {
    const cards = hand.map(formatCard).join(' ');
    if (showScore) {
        const score = calculateScore(hand);
        return `${cards} (**${score} points**)`;
    }
    return cards;
}

function formatDealerCards(dealerHand, hideSecondCard = true) {
    if (hideSecondCard && dealerHand.length >= 2) {
        return `${formatCard(dealerHand[0])} 🂠`;
    }
    return formatHand(dealerHand, true);
}

function getRandomVariant(variants) {
    if (!variants || !Array.isArray(variants) || variants.length === 0) {
        console.error('getRandomVariant called with invalid variants array');
        return '';
    }
    return variants[Math.floor(Math.random() * variants.length)];
}

// Helper function for slot machine
function weightedRandom(items, weights) {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            return items[i];
        }
    }
    
    return items[items.length - 1];
}
