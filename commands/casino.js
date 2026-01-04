const { EmbedBuilder } = require('discord.js');
const { db } = require('../database/db');
const config = require('../config.json');
const responses = require('../responses.json');
const { getResponse, replacePlaceholders } = require('../utils/responseHelper');

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
    if (result === color) {
        if (color === 'vert') {
            winnings = betAmount * config.games.roue.greenMultiplier;
        } else {
            winnings = betAmount * config.games.roue.colorMultiplier;
        }
        await db.updateBalance(playerId, winnings);
    }
    
    // Record game
    await db.recordGame('roue', playerId, null, betAmount, result === color ? 'win' : 'loss', winnings);
    
    // Step 3: Display the result
    let resultMessage;
    if (result === color) {
        // Win message
        resultMessage = getResponse('casino.roue.result.win', {
            colorEmoji: getColorEmoji(result),
            color: formatColor(result),
            player: player.toString(),
            winnings: winnings
        });
    } else {
        // Loss message
        resultMessage = getResponse('casino.roue.result.loss', {
            colorEmoji: getColorEmoji(result),
            color: formatColor(result),
            player: player.toString()
        });
    }
    
    const resultEmbed = new EmbedBuilder()
        .setColor(result === color ? config.colors.success : config.colors.error)
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
            const winnings = Math.floor(betAmount * config.games.blackjack.blackjackMultiplier);
            await db.updateBalance(playerId, winnings);
            await db.recordGame('blackjack', playerId, null, betAmount, 'win', winnings);
            
            const embed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle(getResponse('casino.blackjack.blackjack.title'))
                .setDescription(getResponse('casino.blackjack.blackjack.description', {
                    winnings: winnings,
                    playerHand: formatHand(playerHand)
                }))
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
    
    await message.reply({ embeds: [embed] });
    
    // Wait for player action
    const filter = m => m.author.id === playerId && ['tirer', 'rester'].includes(m.content.toLowerCase());
    
    try {
        const collected = await message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
        const action = collected.first().content.toLowerCase();
        
        if (action === 'tirer') {
            await handleBlackjackHit(message, playerId);
        } else {
            await handleBlackjackStand(message, playerId);
        }
    } catch (error) {
        // Timeout - forfeit
        activeBlackjacks.delete(playerId);
        await db.recordGame('blackjack', playerId, null, betAmount, 'loss', 0);
        
        const embed = new EmbedBuilder()
            .setColor(config.colors.error)
            .setTitle(getResponse('casino.blackjack.timeout.title'))
            .setDescription(getResponse('casino.blackjack.timeout.description'))
            .setTimestamp();
        
        await message.channel.send({ embeds: [embed] });
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
            .setTitle(getResponse('casino.blackjack.bust.title'))
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
        
        await message.channel.send({ embeds: [embed] });
        
        // Wait for next action
        const filter = m => m.author.id === playerId && ['tirer', 'rester'].includes(m.content.toLowerCase());
        
        try {
            const collected = await message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ['time'] });
            const action = collected.first().content.toLowerCase();
            
            if (action === 'tirer') {
                await handleBlackjackHit(message, playerId);
            } else {
                await handleBlackjackStand(message, playerId);
            }
        } catch (error) {
            // Timeout
            activeBlackjacks.delete(playerId);
            await db.recordGame('blackjack', playerId, null, game.betAmount, 'loss', 0);
            
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
    let result, winnings = 0;
    if (dealerScore > 21) {
        // Dealer bust - player wins
        result = 'win';
        winnings = game.betAmount * config.games.blackjack.winMultiplier;
    } else if (playerScore > dealerScore) {
        // Player wins
        result = 'win';
        winnings = game.betAmount * config.games.blackjack.winMultiplier;
    } else if (playerScore < dealerScore) {
        // Dealer wins
        result = 'loss';
    } else {
        // Push
        result = 'push';
        winnings = game.betAmount;
    }
    
    if (winnings > 0) {
        await db.updateBalance(playerId, winnings);
    }
    
    await db.recordGame('blackjack', playerId, null, game.betAmount, result, winnings);
    activeBlackjacks.delete(playerId);
    
    // Get random variant for win/loss messages
    let description;
    
    if (result === 'win' || result === 'loss') {
        const variants = responses.casino.blackjack.result[result].variants;
        const variantTemplate = getRandomVariant(variants);
        const variant = replacePlaceholders(variantTemplate, {
            winnings: winnings,
            dealerScore: dealerScore
        });
        description = getResponse(`casino.blackjack.result.${result}.description`, {
            playerHand: formatHand(game.playerHand),
            dealerHand: formatHand(game.dealerHand),
            variant: variant
        });
    } else {
        description = getResponse(`casino.blackjack.result.${result}.description`, {
            playerHand: formatHand(game.playerHand),
            dealerHand: formatHand(game.dealerHand),
            bet: game.betAmount
        });
    }
    
    const embed = new EmbedBuilder()
        .setColor(result === 'win' ? config.colors.success : (result === 'push' ? config.colors.warning : config.colors.error))
        .setTitle(getResponse(`casino.blackjack.result.${result}.title`))
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
    
    if (winnings > 0) {
        await db.updateBalance(playerId, winnings);
    }
    
    // Record game
    await db.recordGame('machine', playerId, null, betAmount, winnings > 0 ? 'win' : 'loss', winnings);
    
    const embed = new EmbedBuilder()
        .setColor(winnings > 0 ? config.colors.success : config.colors.error)
        .setTitle(getResponse('casino.machine.result.title'))
        .setDescription(getResponse(`casino.machine.result.${winType}`, {
            reel1: reel1,
            reel2: reel2,
            reel3: reel3,
            bet: betAmount,
            winnings: winnings,
            multiplier: multiplier
        }))
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
