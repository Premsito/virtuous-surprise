const { EmbedBuilder } = require('discord.js');
const { db } = require('../database/db');
const config = require('../config.json');

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
                .setTitle('🎮 Jeux disponibles')
                .setDescription(
                    `**Duel**: \`${config.prefix}jeu duel @utilisateur [montant]\`\n` +
                    `**Roulette**: \`${config.prefix}jeu roulette [montant]\``
                )
                .setTimestamp();
            
            return message.reply({ embeds: [embed] });
        }

        if (gameType === 'duel') {
            return handleDuel(message, args.slice(1));
        } else if (gameType === 'roulette') {
            return handleRoulette(message, args.slice(1));
        } else {
            return message.reply('❌ Jeu inconnu. Utilisez `duel` ou `roulette`.');
        }
    }
};

async function handleDuel(message, args) {
    const challenger = message.author;
    const challengerId = challenger.id;
    
    // Get opponent
    const opponentMention = message.mentions.users.first();
    if (!opponentMention) {
        return message.reply('❌ Vous devez mentionner un adversaire! Exemple: `!jeu duel @user 50`');
    }
    
    if (opponentMention.id === challengerId) {
        return message.reply('❌ Vous ne pouvez pas vous défier vous-même!');
    }
    
    if (opponentMention.bot) {
        return message.reply('❌ Vous ne pouvez pas défier un bot!');
    }
    
    const opponentId = opponentMention.id;
    
    // Get bet amount
    const betAmount = parseInt(args[1]);
    if (!betAmount || betAmount < config.games.duel.minBet || betAmount > config.games.duel.maxBet) {
        return message.reply(`❌ Le montant doit être entre ${config.games.duel.minBet} et ${config.games.duel.maxBet} LC.`);
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
        return message.reply(`❌ Vous n'avez pas assez de LC! Votre solde: ${challengerUser.balance} LC`);
    }
    
    if (opponentUser.balance < betAmount) {
        return message.reply(`❌ ${opponentMention.username} n'a pas assez de LC!`);
    }
    
    // Check if already in a duel
    if (activeDuels.has(challengerId) || activeDuels.has(opponentId)) {
        return message.reply('❌ Un des joueurs est déjà dans un duel!');
    }
    
    // Create duel request
    const duelId = `${challengerId}-${opponentId}-${Date.now()}`;
    activeDuels.set(challengerId, duelId);
    activeDuels.set(opponentId, duelId);
    
    const embed = new EmbedBuilder()
        .setColor(config.colors.warning)
        .setTitle('⚔️ Duel!')
        .setDescription(
            `${challenger} défie ${opponentMention} pour **${betAmount} LC**!\n\n` +
            `${opponentMention}, tapez \`accepter\` pour accepter le duel dans les 30 secondes.`
        )
        .setTimestamp();
    
    const challengeMsg = await message.reply({ embeds: [embed] });
    
    // Wait for acceptance
    const filter = m => m.author.id === opponentId && m.content.toLowerCase() === 'accepter';
    
    try {
        await message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
        
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
            .setTitle('⚔️ Résultat du duel')
            .setDescription(
                `${winnerUser} a gagné le duel et remporte **${betAmount * 2} LC**!\n` +
                `${loserUser} a perdu **${betAmount} LC**.`
            )
            .setTimestamp();
        
        await message.channel.send({ embeds: [resultEmbed] });
        
    } catch (error) {
        const timeoutEmbed = new EmbedBuilder()
            .setColor(config.colors.error)
            .setTitle('⚔️ Duel annulé')
            .setDescription(`${opponentMention} n'a pas accepté le duel à temps.`)
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
        return message.reply(`❌ Le montant doit être entre ${config.games.roulette.minBet} et ${config.games.roulette.maxBet} LC.`);
    }
    
    // Ensure user exists
    let user = await db.getUser(playerId);
    if (!user) {
        user = await db.createUser(playerId, player.username);
    }
    
    // Check balance
    if (user.balance < betAmount) {
        return message.reply(`❌ Vous n'avez pas assez de LC! Votre solde: ${user.balance} LC`);
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
        return message.reply('❌ Vous participez déjà à cette roulette!');
    }
    
    roulette.players.set(playerId, { user: player, bet: betAmount });
    
    // Deduct bet
    await db.updateBalance(playerId, -betAmount);
    
    const embed = new EmbedBuilder()
        .setColor(config.colors.warning)
        .setTitle('🎰 Roulette')
        .setDescription(
            `${player} a rejoint la roulette avec **${betAmount} LC**!\n\n` +
            `Joueurs actuels: **${roulette.players.size}**\n` +
            `Pot total: **${Array.from(roulette.players.values()).reduce((sum, p) => sum + p.bet, 0)} LC**\n\n` +
            `La roulette démarre dans 30 secondes...`
        )
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
        .setTitle('🎰 Résultat de la roulette')
        .setDescription(
            `${winner.user} a gagné la roulette et remporte **${winnings} LC**!\n\n` +
            `Pot total: **${totalPot} LC**\n` +
            `Participants: **${playersArray.length}**`
        )
        .setTimestamp();
    
    await roulette.channel.send({ embeds: [resultEmbed] });
    
    // Clean up
    activeRoulettes.delete(guildId);
}
