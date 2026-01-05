const { EmbedBuilder } = require('discord.js');
const { db } = require('../database/db');
const config = require('../config.json');
const { getResponse, replacePlaceholders } = require('../utils/responseHelper');

module.exports = {
    name: 'loto',
    description: 'Lottery system - buy tickets and win jackpots',
    
    async execute(message, args) {
        const subcommand = args[0]?.toLowerCase();
        
        if (!subcommand) {
            return message.reply(getResponse('loto.invalidCommand'));
        }
        
        switch (subcommand) {
            case 'acheter':
            case 'buy':
                return handlePurchase(message, args.slice(1));
            case 'voir':
            case 'view':
            case 'tickets':
                return handleView(message);
            case 'jackpot':
            case 'info':
                return handleJackpot(message);
            case 'setjackpot':
                return handleSetJackpot(message, args.slice(1));
            default:
                return message.reply(getResponse('loto.invalidCommand'));
        }
    }
};

async function handlePurchase(message, args) {
    const player = message.author;
    const playerId = player.id;
    const count = parseInt(args[0]);
    
    // Validate count
    if (!count || count < 1 || count > 100) {
        return message.reply(getResponse('loto.purchase.invalidAmount'));
    }
    
    // Calculate total cost
    const totalCost = count * config.games.loto.ticketPrice;
    
    // Ensure user exists
    let user = await db.getUser(playerId);
    if (!user) {
        user = await db.createUser(playerId, player.username);
    }
    
    // Check balance
    if (user.balance < totalCost) {
        return message.reply(getResponse('loto.purchase.insufficientBalance', {
            totalCost,
            balance: user.balance
        }));
    }
    
    try {
        // Get lottery state
        const lotteryState = await db.getLotteryState();
        if (!lotteryState) {
            return message.reply(getResponse('loto.error'));
        }
        
        const drawTime = lotteryState.next_draw_time;
        
        // Deduct balance
        await db.updateBalance(playerId, -totalCost);
        
        // Purchase tickets (this now also updates jackpot and ticket count in a single transaction)
        const tickets = await db.purchaseLotteryTickets(playerId, count, drawTime);
        
        // Record transaction
        await db.recordTransaction(playerId, null, totalCost, 'lottery_purchase', `Achat de ${count} ticket(s) de loterie`);
        
        // Send confirmation
        const response = getResponse('loto.purchase.success', {
            player: player.toString(),
            count,
            cost: totalCost
        });
        
        return message.reply(response);
    } catch (error) {
        console.error('Error purchasing lottery tickets:', error);
        return message.reply(getResponse('loto.error'));
    }
}

async function handleView(message) {
    const player = message.author;
    const playerId = player.id;
    
    try {
        // Get lottery state
        const lotteryState = await db.getLotteryState();
        if (!lotteryState) {
            return message.reply(getResponse('loto.error'));
        }
        
        // Get user tickets
        const tickets = await db.getUserLotteryTickets(playerId, lotteryState.next_draw_time);
        
        if (tickets.length === 0) {
            return message.reply(getResponse('loto.view.noTickets'));
        }
        
        // Format draw time
        const drawDate = new Date(lotteryState.next_draw_time);
        const drawTimeStr = `<t:${Math.floor(drawDate.getTime() / 1000)}:F>`;
        
        // Format ticket numbers
        const numbersStr = tickets.length > 10
            ? `${tickets.slice(0, 10).join(', ')} ... (${tickets.length} total)`
            : tickets.join(', ');
        
        const embed = new EmbedBuilder()
            .setColor(config.colors.primary)
            .setTitle(getResponse('loto.view.title'))
            .setDescription(getResponse('loto.view.description', {
                count: tickets.length,
                numbers: numbersStr,
                drawTime: drawTimeStr
            }))
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error viewing lottery tickets:', error);
        return message.reply(getResponse('loto.error'));
    }
}

async function handleJackpot(message) {
    try {
        // Get lottery state
        const lotteryState = await db.getLotteryState();
        if (!lotteryState) {
            return message.reply(getResponse('loto.error'));
        }
        
        // Format draw time
        const drawDate = new Date(lotteryState.next_draw_time);
        const drawTimeStr = `<t:${Math.floor(drawDate.getTime() / 1000)}:F>`;
        
        const embed = new EmbedBuilder()
            .setColor(config.colors.warning)
            .setTitle(getResponse('loto.jackpot.title'))
            .setDescription(getResponse('loto.jackpot.description', {
                jackpot: lotteryState.jackpot,
                drawTime: drawTimeStr
            }))
            .setTimestamp();
        
        return message.reply({ embeds: [embed] });
    } catch (error) {
        console.error('Error getting lottery jackpot:', error);
        return message.reply(getResponse('loto.error'));
    }
}

async function handleSetJackpot(message, args) {
    // Check if user has administrator permission
    if (!message.member.permissions.has('Administrator')) {
        return message.reply(getResponse('loto.setjackpot.noPermission'));
    }
    
    const amount = parseInt(args[0]);
    
    // Validate amount
    if (!amount || amount < 0 || isNaN(amount)) {
        return message.reply(getResponse('loto.setjackpot.invalidAmount'));
    }
    
    try {
        // Update the jackpot amount
        await db.setLotteryJackpot(amount);
        
        // Send confirmation message
        return message.reply(getResponse('loto.setjackpot.success', { amount }));
    } catch (error) {
        console.error('Error setting lottery jackpot:', error);
        return message.reply(getResponse('loto.error'));
    }
}

// Function to perform the lottery draw (called by scheduler)
async function performDraw(client) {
    try {
        console.log('🎰 Starting lottery draw...');
        
        // Get lottery state
        const lotteryState = await db.getLotteryState();
        if (!lotteryState) {
            console.error('Failed to get lottery state');
            return;
        }
        
        const currentDrawTime = lotteryState.next_draw_time;
        const totalTickets = lotteryState.total_tickets_sold;
        const jackpot = lotteryState.jackpot;
        
        // Check if any tickets were sold
        if (totalTickets === 0) {
            console.log('No tickets sold for this draw, skipping...');
            
            // Schedule next draw
            const nextDrawTime = getNextDrawTime();
            await db.resetLottery(nextDrawTime, config.games.loto.baseJackpot);
            
            return;
        }
        
        // Pick a random winning ticket
        const winningTicket = Math.floor(Math.random() * totalTickets) + 1;
        console.log(`Winning ticket number: ${winningTicket}`);
        
        // Get winner
        const winnerData = await db.getWinnerByTicket(winningTicket, currentDrawTime);
        
        if (!winnerData) {
            console.error('Failed to find winner for ticket:', winningTicket);
            return;
        }
        
        const winnerId = winnerData.user_id;
        
        // Award jackpot to winner
        await db.updateBalance(winnerId, jackpot);
        await db.recordTransaction(null, winnerId, jackpot, 'lottery_win', `Gain de la loterie - Ticket #${winningTicket}`);
        
        // Record draw in history
        await db.recordLotteryDraw(currentDrawTime, winningTicket, winnerId, jackpot, totalTickets);
        
        // Get winner user object for mention
        let winnerMention = `<@${winnerId}>`;
        try {
            const winnerUser = await client.users.fetch(winnerId);
            if (winnerUser) {
                winnerMention = winnerUser.toString();
            }
        } catch (e) {
            console.error('Failed to fetch winner user:', e);
        }
        
        // Send suspense message
        const suspenseMessages = getResponse('loto.draw.suspense');
        const randomSuspense = suspenseMessages[Math.floor(Math.random() * suspenseMessages.length)];
        
        // Get configured announcement channel
        const announcementChannelId = config.channels.lotteryAnnouncement;
        if (!announcementChannelId) {
            console.error('No lottery announcement channel configured');
            return;
        }
        
        try {
            const channel = await client.channels.fetch(announcementChannelId);
            if (!channel) {
                console.error('Failed to find lottery announcement channel');
                return;
            }
            
            const suspenseEmbed = new EmbedBuilder()
                .setColor(config.colors.primary)
                .setDescription(randomSuspense)
                .setImage(config.games.loto.gifUrl)
                .setTimestamp();
            
            await channel.send({ embeds: [suspenseEmbed] });
            
            // Wait for suspense
            await new Promise(resolve => setTimeout(resolve, config.games.loto.suspenseDelay));
            
            // Announce winner
            const nextDrawTime = getNextDrawTime();
            const nextDrawTimeStr = `<t:${Math.floor(nextDrawTime.getTime() / 1000)}:F>`;
            
            const resultEmbed = new EmbedBuilder()
                .setColor(config.colors.success)
                .setTitle(getResponse('loto.draw.result.title'))
                .setDescription(getResponse('loto.draw.result.winner', {
                    jackpot,
                    winningNumber: winningTicket,
                    winner: winnerMention
                }) + getResponse('loto.draw.result.resetInfo', {
                    baseJackpot: config.games.loto.baseJackpot,
                    nextDrawTime: nextDrawTimeStr
                }))
                .setTimestamp();
            
            await channel.send({ embeds: [resultEmbed] });
        } catch (error) {
            console.error('Error sending lottery announcement:', error);
        }
        
        // Reset lottery for next week
        const nextDrawTime = getNextDrawTime();
        await db.resetLottery(nextDrawTime, config.games.loto.baseJackpot);
        
        console.log('✅ Lottery draw completed successfully');
    } catch (error) {
        console.error('Error performing lottery draw:', error);
    }
}

// Helper function to get next draw time (next Sunday at configured time)
function getNextDrawTime() {
    const now = new Date();
    const nextDraw = new Date();
    
    // Set to configured time (20:00 on Sundays)
    nextDraw.setHours(config.games.loto.drawHour, config.games.loto.drawMinute, 0, 0);
    
    // Calculate days until next Sunday (0 = Sunday)
    // Note: drawDay is hardcoded to 0 (Sunday) in requirements
    const daysUntilSunday = (7 - now.getDay()) % 7;
    
    // If today is Sunday and the time hasn't passed, use today; otherwise next Sunday
    if (daysUntilSunday === 0 && now < nextDraw) {
        // Draw is today but hasn't happened yet
        return nextDraw;
    } else {
        // Add days to get to next Sunday
        const daysToAdd = daysUntilSunday === 0 ? 7 : daysUntilSunday;
        nextDraw.setDate(nextDraw.getDate() + daysToAdd);
        return nextDraw;
    }
}

// Function to check if it's time for a draw
async function checkDrawTime(client) {
    try {
        const lotteryState = await db.getLotteryState();
        if (!lotteryState) {
            return;
        }
        
        const now = new Date();
        const drawTime = new Date(lotteryState.next_draw_time);
        
        // Check if it's time for the draw (within 1 minute)
        if (now >= drawTime) {
            await performDraw(client);
        }
    } catch (error) {
        console.error('Error checking draw time:', error);
    }
}

module.exports.performDraw = performDraw;
module.exports.checkDrawTime = checkDrawTime;
module.exports.getNextDrawTime = getNextDrawTime;
