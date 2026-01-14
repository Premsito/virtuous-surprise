const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const lcEventEmitter = require('../utils/lcEventEmitter');
const niveauEventEmitter = require('../utils/niveauEventEmitter');

// Database configuration constants
const DB_INIT_MAX_RETRIES = 3;
const DB_INIT_RETRY_BASE_DELAY_MS = 1000;
const DB_INIT_RETRY_MAX_DELAY_MS = 5000;

// PostgreSQL error codes
const UNIQUE_VIOLATION_ERROR = '23505';

// Create PostgreSQL connection pool with improved configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : {
        rejectUnauthorized: false
    },
    // Connection pool configuration for better stability
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 300000, // Close idle clients after 5 minutes (reduced log spam)
    connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection cannot be established
    allowExitOnIdle: false // Keep the pool alive even when all clients are idle
});

// Test database connection
pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
    // Don't exit on database errors - let the pool handle reconnection
});

// Only log client removal in development/debug mode
if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
    pool.on('remove', () => {
        console.log('⚠️ Database client removed from pool');
    });
}

// Database helper functions
const db = {
    // User operations
    async getUser(userId) {
        const result = await pool.query(
            'SELECT * FROM users WHERE user_id = $1',
            [userId]
        );
        return result.rows[0];
    },

    async createUser(userId, username, invitedBy = null) {
        const result = await pool.query(
            'INSERT INTO users (user_id, username, invited_by) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET username = $2 RETURNING *',
            [userId, username, invitedBy]
        );
        return result.rows[0];
    },

    async updateBalance(userId, amount, reason = 'unknown') {
        // Use a CTE to capture old balance in a single query
        const result = await pool.query(
            `WITH old_balance AS (
                SELECT balance FROM users WHERE user_id = $2
            )
            UPDATE users 
            SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP 
            WHERE user_id = $2 
            RETURNING *, (SELECT COALESCE(balance, 0) FROM old_balance) as old_balance`,
            [amount, userId]
        );
        const updatedUser = result.rows[0];
        
        // Emit LC change event
        if (updatedUser) {
            const oldBalance = updatedUser.old_balance || 0;
            lcEventEmitter.emitLCChange(userId, oldBalance, updatedUser.balance, reason);
            // Remove the old_balance field from returned object
            delete updatedUser.old_balance;
        }
        
        return updatedUser;
    },

    async setBalance(userId, amount, reason = 'admin_set') {
        // Use a CTE to capture old balance in a single query
        const result = await pool.query(
            `WITH old_balance AS (
                SELECT balance FROM users WHERE user_id = $2
            )
            UPDATE users 
            SET balance = $1, updated_at = CURRENT_TIMESTAMP 
            WHERE user_id = $2 
            RETURNING *, (SELECT COALESCE(balance, 0) FROM old_balance) as old_balance`,
            [amount, userId]
        );
        const updatedUser = result.rows[0];
        
        // Emit LC change event
        if (updatedUser) {
            const oldBalance = updatedUser.old_balance || 0;
            lcEventEmitter.emitLCChange(userId, oldBalance, updatedUser.balance, reason);
            // Remove the old_balance field from returned object
            delete updatedUser.old_balance;
        }
        
        return updatedUser;
    },

    async transferLC(fromUserId, toUserId, amount, description = 'Transfer') {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Get old balances
            const fromUserOld = await this.getUser(fromUserId);
            const toUserOld = await this.getUser(toUserId);
            const fromOldBalance = fromUserOld ? fromUserOld.balance : 0;
            const toOldBalance = toUserOld ? toUserOld.balance : 0;
            
            // Deduct from sender
            const fromResult = await client.query(
                'UPDATE users SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING balance',
                [amount, fromUserId]
            );
            
            // Add to receiver
            const toResult = await client.query(
                'UPDATE users SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING balance',
                [amount, toUserId]
            );
            
            // Record transaction
            await client.query(
                'INSERT INTO transactions (from_user_id, to_user_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4, $5)',
                [fromUserId, toUserId, amount, 'transfer', description]
            );
            
            await client.query('COMMIT');
            
            // Emit LC change events for both users
            if (fromResult.rows[0]) {
                lcEventEmitter.emitLCChange(fromUserId, fromOldBalance, fromResult.rows[0].balance, 'transfer_sent');
            }
            if (toResult.rows[0]) {
                lcEventEmitter.emitLCChange(toUserId, toOldBalance, toResult.rows[0].balance, 'transfer_received');
            }
            
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    // Invite operations
    async incrementInvites(userId) {
        const result = await pool.query(
            'UPDATE users SET invites = invites + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 RETURNING *',
            [userId]
        );
        return result.rows[0];
    },

    async setInvites(userId, count) {
        const result = await pool.query(
            'UPDATE users SET invites = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING *',
            [count, userId]
        );
        return result.rows[0];
    },

    async recordInvite(inviterId, invitedId) {
        await pool.query(
            'INSERT INTO invite_tracking (inviter_id, invited_id) VALUES ($1, $2)',
            [inviterId, invitedId]
        );
    },

    // Anti-cheat: Check if an invite already exists in history
    async checkInviteHistory(inviterId, invitedId) {
        const result = await pool.query(
            'SELECT EXISTS(SELECT 1 FROM invite_history WHERE inviter_id = $1 AND invited_id = $2)',
            [inviterId, invitedId]
        );
        const exists = result.rows[0].exists;
        console.log(`[DB] checkInviteHistory(${inviterId}, ${invitedId}) = ${exists}`);
        return exists;
    },

    // Anti-cheat: Add invite to history (returns false if already exists)
    async addInviteHistory(inviterId, invitedId) {
        try {
            await pool.query(
                'INSERT INTO invite_history (inviter_id, invited_id) VALUES ($1, $2)',
                [inviterId, invitedId]
            );
            console.log(`[DB] Successfully added invite history: ${inviterId} -> ${invitedId}`);
            return true;
        } catch (error) {
            // If primary key violation, invite already exists
            if (error.code === UNIQUE_VIOLATION_ERROR) {
                console.log(`[DB] Duplicate key violation: invite already exists ${inviterId} -> ${invitedId}`);
                return false;
            }
            console.error(`[DB] Error adding invite history:`, error);
            throw error;
        }
    },

    async getTopInvites(limit = 10) {
        const result = await pool.query(
            'SELECT user_id, username, invites FROM users ORDER BY invites DESC LIMIT $1',
            [limit]
        );
        return result.rows;
    },

    async getTopLC(limit = 10) {
        try {
            const startTime = Date.now();
            const result = await pool.query(
                'SELECT user_id, username, balance FROM users ORDER BY balance DESC LIMIT $1',
                [limit]
            );
            const duration = Date.now() - startTime;
            
            // Log query performance for monitoring
            if (duration > 100) {
                console.warn(`⚠️ Slow query: getTopLC took ${duration}ms`);
            }
            
            return result.rows;
        } catch (error) {
            console.error('❌ Error fetching top LC rankings:', error.message);
            console.error('   Query: SELECT user_id, username, balance FROM users ORDER BY balance DESC LIMIT $1');
            console.error('   Params:', { limit });
            throw error;
        }
    },

    // Message and voice tracking
    async incrementMessageCount(userId, count = 1) {
        const result = await pool.query(
            'UPDATE users SET message_count = message_count + $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING *',
            [count, userId]
        );
        return result.rows[0];
    },

    async updateVoiceTime(userId, seconds) {
        const result = await pool.query(
            'UPDATE users SET voice_time = voice_time + $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING *',
            [seconds, userId]
        );
        return result.rows[0];
    },

    // Game operations
    async recordGame(gameType, playerId, opponentId, betAmount, result, winnings) {
        await pool.query(
            'INSERT INTO game_history (game_type, player_id, opponent_id, bet_amount, result, winnings) VALUES ($1, $2, $3, $4, $5, $6)',
            [gameType, playerId, opponentId, betAmount, result, winnings]
        );
    },

    // Transaction operations
    async recordTransaction(fromUserId, toUserId, amount, type, description) {
        await pool.query(
            'INSERT INTO transactions (from_user_id, to_user_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4, $5)',
            [fromUserId, toUserId, amount, type, description]
        );
    },

    // Gift operations
    async updateGiftTime(userId, timestamp) {
        const result = await pool.query(
            'UPDATE users SET last_gift_time = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING *',
            [timestamp, userId]
        );
        return result.rows[0];
    },

    // Lottery operations
    async getLotteryState() {
        const result = await pool.query('SELECT * FROM lottery_state WHERE id = 1');
        return result.rows[0];
    },

    async updateLotteryJackpot(amount) {
        const result = await pool.query(
            'UPDATE lottery_state SET jackpot = jackpot + $1, updated_at = CURRENT_TIMESTAMP WHERE id = 1 RETURNING *',
            [amount]
        );
        return result.rows[0];
    },

    async setLotteryJackpot(amount) {
        const result = await pool.query(
            'UPDATE lottery_state SET jackpot = $1, updated_at = CURRENT_TIMESTAMP WHERE id = 1 RETURNING *',
            [amount]
        );
        return result.rows[0];
    },

    async incrementTicketsSold(count = 1) {
        const result = await pool.query(
            'UPDATE lottery_state SET total_tickets_sold = total_tickets_sold + $1, updated_at = CURRENT_TIMESTAMP WHERE id = 1 RETURNING *',
            [count]
        );
        return result.rows[0];
    },

    async purchaseLotteryTickets(userId, count, drawTime) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Lock the lottery_state row and get current total tickets to assign numbers
            // SELECT FOR UPDATE ensures only one transaction can read/update at a time
            const stateResult = await client.query(
                'SELECT total_tickets_sold FROM lottery_state WHERE id = 1 FOR UPDATE'
            );
            const currentTotal = stateResult.rows[0].total_tickets_sold;

            // Insert tickets with sequential numbers
            const tickets = [];
            for (let i = 0; i < count; i++) {
                const ticketNumber = currentTotal + i + 1;
                await client.query(
                    'INSERT INTO lottery_tickets (user_id, ticket_number, draw_time) VALUES ($1, $2, $3)',
                    [userId, ticketNumber, drawTime]
                );
                tickets.push(ticketNumber);
            }
            
            // Update total tickets sold within the same transaction
            await client.query(
                'UPDATE lottery_state SET total_tickets_sold = total_tickets_sold + $1, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
                [count]
            );
            
            // Update jackpot within the same transaction
            await client.query(
                'UPDATE lottery_state SET jackpot = jackpot + $1, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
                [count * 20] // ticketIncrement
            );

            await client.query('COMMIT');
            return tickets;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    async getUserLotteryTickets(userId, drawTime) {
        const result = await pool.query(
            'SELECT ticket_number FROM lottery_tickets WHERE user_id = $1 AND draw_time = $2 ORDER BY ticket_number',
            [userId, drawTime]
        );
        return result.rows.map(row => row.ticket_number);
    },

    async getAllLotteryTicketsForDraw(drawTime) {
        const result = await pool.query(
            'SELECT user_id, ticket_number FROM lottery_tickets WHERE draw_time = $1 ORDER BY ticket_number',
            [drawTime]
        );
        return result.rows;
    },

    async resetLottery(nextDrawTime, baseJackpot) {
        const result = await pool.query(
            'UPDATE lottery_state SET jackpot = $1, next_draw_time = $2, total_tickets_sold = 0, updated_at = CURRENT_TIMESTAMP WHERE id = 1 RETURNING *',
            [baseJackpot, nextDrawTime]
        );
        return result.rows[0];
    },

    async recordLotteryDraw(drawTime, winningTicket, winnerId, jackpot, totalTickets) {
        const result = await pool.query(
            'INSERT INTO lottery_draws (draw_time, winning_ticket, winner_id, jackpot_amount, total_tickets) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [drawTime, winningTicket, winnerId, jackpot, totalTickets]
        );
        return result.rows[0];
    },

    async getWinnerByTicket(ticketNumber, drawTime) {
        const result = await pool.query(
            'SELECT user_id FROM lottery_tickets WHERE ticket_number = $1 AND draw_time = $2',
            [ticketNumber, drawTime]
        );
        return result.rows[0];
    },

    // Bot state operations (for persistent bot configuration)
    async getBotState(key) {
        const result = await pool.query(
            'SELECT value FROM bot_state WHERE key = $1',
            [key]
        );
        return result.rows[0]?.value;
    },

    async setBotState(key, value) {
        const result = await pool.query(
            'INSERT INTO bot_state (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP RETURNING *',
            [key, value]
        );
        return result.rows[0];
    },

    // Inventory operations
    async getInventory(userId) {
        const result = await pool.query(
            'SELECT item_type, quantity FROM user_inventory WHERE user_id = $1 AND quantity > 0 ORDER BY item_type',
            [userId]
        );
        return result.rows;
    },

    async getInventoryItem(userId, itemType) {
        const result = await pool.query(
            'SELECT * FROM user_inventory WHERE user_id = $1 AND item_type = $2',
            [userId, itemType]
        );
        return result.rows[0];
    },

    async addInventoryItem(userId, itemType, quantity = 1) {
        const result = await pool.query(
            'INSERT INTO user_inventory (user_id, item_type, quantity) VALUES ($1, $2, $3) ON CONFLICT (user_id, item_type) DO UPDATE SET quantity = user_inventory.quantity + $3, updated_at = CURRENT_TIMESTAMP RETURNING *',
            [userId, itemType, quantity]
        );
        return result.rows[0];
    },

    async removeInventoryItem(userId, itemType, quantity = 1) {
        const result = await pool.query(
            'UPDATE user_inventory SET quantity = GREATEST(quantity - $1, 0), updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND item_type = $3 RETURNING *',
            [quantity, userId, itemType]
        );
        return result.rows[0];
    },

    // Active multiplier operations
    async getActiveMultiplier(userId) {
        const result = await pool.query(
            'SELECT * FROM active_multipliers WHERE user_id = $1 AND games_remaining > 0 ORDER BY activated_at DESC LIMIT 1',
            [userId]
        );
        return result.rows[0];
    },

    async activateMultiplier(userId, multiplierType, multiplierValue) {
        const result = await pool.query(
            'INSERT INTO active_multipliers (user_id, multiplier_type, multiplier_value, games_remaining) VALUES ($1, $2, $3, 2) RETURNING *',
            [userId, multiplierType, multiplierValue]
        );
        return result.rows[0];
    },

    async decrementMultiplierGames(userId) {
        const result = await pool.query(
            'UPDATE active_multipliers SET games_remaining = games_remaining - 1 WHERE user_id = $1 AND games_remaining > 0 RETURNING *',
            [userId]
        );
        return result.rows[0];
    },

    async deleteExpiredMultipliers(userId) {
        await pool.query(
            'DELETE FROM active_multipliers WHERE user_id = $1 AND games_remaining <= 0',
            [userId]
        );
    },

    // XP and Level operations
    async addXP(userId, xpAmount) {
        const result = await pool.query(
            'UPDATE users SET xp = xp + $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING *',
            [xpAmount, userId]
        );
        return result.rows[0];
    },

    async updateLevel(userId, level, reason = 'level_up') {
        // Use a CTE to capture old level in a single query
        const result = await pool.query(
            `WITH old_level AS (
                SELECT level FROM users WHERE user_id = $2
            )
            UPDATE users 
            SET level = $1, updated_at = CURRENT_TIMESTAMP 
            WHERE user_id = $2 
            RETURNING *, (SELECT COALESCE(level, 0) FROM old_level) as old_level`,
            [level, userId]
        );
        const updatedUser = result.rows[0];
        
        // Emit Niveau change event
        if (updatedUser) {
            const oldLevel = updatedUser.old_level || 0;
            niveauEventEmitter.emitNiveauChange(userId, oldLevel, updatedUser.level, reason);
            // Remove the old_level field from returned object
            delete updatedUser.old_level;
        }
        
        return updatedUser;
    },

    async updateLastMessageXPTime(userId, timestamp) {
        const result = await pool.query(
            'UPDATE users SET last_message_xp_time = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING *',
            [timestamp, userId]
        );
        return result.rows[0];
    },

    async getTopLevels(limit = 10) {
        try {
            const startTime = Date.now();
            const result = await pool.query(
                'SELECT user_id, username, level, xp FROM users ORDER BY level DESC, xp DESC LIMIT $1',
                [limit]
            );
            const duration = Date.now() - startTime;
            
            // Log query performance for monitoring
            if (duration > 100) {
                console.warn(`⚠️ Slow query: getTopLevels took ${duration}ms`);
            }
            
            return result.rows;
        } catch (error) {
            console.error('❌ Error fetching top level rankings:', error.message);
            console.error('   Query: SELECT user_id, username, level, xp FROM users ORDER BY level DESC, xp DESC LIMIT $1');
            console.error('   Params:', { limit });
            throw error;
        }
    },

    // Voice XP tracking
    async createVoiceXPSession(userId, sessionStart) {
        const result = await pool.query(
            'INSERT INTO voice_xp_tracking (user_id, session_start, last_xp_grant, total_minutes) VALUES ($1, $2, $2, 0) RETURNING *',
            [userId, sessionStart]
        );
        return result.rows[0];
    },

    async getActiveVoiceXPSession(userId) {
        const result = await pool.query(
            'SELECT * FROM voice_xp_tracking WHERE user_id = $1 ORDER BY session_start DESC LIMIT 1',
            [userId]
        );
        return result.rows[0];
    },

    async updateVoiceXPSession(sessionId, lastXPGrant, totalMinutes) {
        const result = await pool.query(
            'UPDATE voice_xp_tracking SET last_xp_grant = $1, total_minutes = $2 WHERE id = $3 RETURNING *',
            [lastXPGrant, totalMinutes, sessionId]
        );
        return result.rows[0];
    },

    async deleteVoiceXPSession(sessionId) {
        await pool.query(
            'DELETE FROM voice_xp_tracking WHERE id = $1',
            [sessionId]
        );
    },

    // Message reaction XP tracking
    async getMessageReactionXP(messageId) {
        const result = await pool.query(
            'SELECT * FROM message_reaction_xp WHERE message_id = $1',
            [messageId]
        );
        return result.rows[0];
    },

    async createMessageReactionXP(messageId, userId, xpEarned) {
        const result = await pool.query(
            'INSERT INTO message_reaction_xp (message_id, user_id, xp_earned) VALUES ($1, $2, $3) ON CONFLICT (message_id) DO UPDATE SET xp_earned = message_reaction_xp.xp_earned + $3 RETURNING *',
            [messageId, userId, xpEarned]
        );
        return result.rows[0];
    },

    async updateMessageReactionXP(messageId, xpEarned) {
        const result = await pool.query(
            'UPDATE message_reaction_xp SET xp_earned = xp_earned + $1 WHERE message_id = $2 RETURNING *',
            [xpEarned, messageId]
        );
        return result.rows[0];
    },

    // Time-based boost operations
    async activateBoost(userId, boostType, multiplier, durationSeconds) {
        const expiresAt = new Date(Date.now() + durationSeconds * 1000);
        const result = await pool.query(
            'INSERT INTO active_boosts (user_id, boost_type, multiplier, expires_at) VALUES ($1, $2, $3, $4) RETURNING *',
            [userId, boostType, multiplier, expiresAt]
        );
        return result.rows[0];
    },

    async getActiveBoost(userId, boostType) {
        const result = await pool.query(
            'SELECT * FROM active_boosts WHERE user_id = $1 AND boost_type = $2 AND expires_at > NOW() ORDER BY expires_at DESC LIMIT 1',
            [userId, boostType]
        );
        return result.rows[0];
    },

    async deleteExpiredBoosts() {
        await pool.query(
            'DELETE FROM active_boosts WHERE expires_at <= NOW()'
        );
    },

    // Giveaway operations
    async createGiveaway(title, reward, duration, winnersCount, quantity, channelId, createdBy) {
        const MS_PER_MINUTE = 60000;
        const endTime = new Date(Date.now() + duration * MS_PER_MINUTE);
        const result = await pool.query(
            'INSERT INTO giveaways (title, reward, duration, winners_count, quantity, channel_id, end_time, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [title, reward, duration, winnersCount, quantity, channelId, endTime, createdBy]
        );
        return result.rows[0];
    },

    async updateGiveawayMessage(giveawayId, messageId) {
        const result = await pool.query(
            'UPDATE giveaways SET message_id = $1 WHERE id = $2 RETURNING *',
            [messageId, giveawayId]
        );
        return result.rows[0];
    },

    async getGiveaway(giveawayId) {
        const result = await pool.query(
            'SELECT * FROM giveaways WHERE id = $1',
            [giveawayId]
        );
        return result.rows[0];
    },

    async getGiveawayByTitle(title, createdBy) {
        const result = await pool.query(
            'SELECT * FROM giveaways WHERE title = $1 AND created_by = $2 AND status = $3 ORDER BY created_at DESC LIMIT 1',
            [title, createdBy, 'active']
        );
        return result.rows[0];
    },

    async getActiveGiveaways() {
        const result = await pool.query(
            'SELECT * FROM giveaways WHERE status = $1 AND end_time > NOW()',
            ['active']
        );
        return result.rows;
    },

    async endGiveaway(giveawayId) {
        const result = await pool.query(
            'UPDATE giveaways SET status = $1 WHERE id = $2 RETURNING *',
            ['ended', giveawayId]
        );
        return result.rows[0];
    },

    async joinGiveaway(giveawayId, userId) {
        try {
            const result = await pool.query(
                'INSERT INTO giveaway_participants (giveaway_id, user_id) VALUES ($1, $2) RETURNING *',
                [giveawayId, userId]
            );
            return result.rows[0];
        } catch (error) {
            // If unique constraint violation, user already joined
            if (error.code === UNIQUE_VIOLATION_ERROR) {
                return null;
            }
            throw error;
        }
    },

    async getGiveawayParticipants(giveawayId) {
        const result = await pool.query(
            'SELECT user_id FROM giveaway_participants WHERE giveaway_id = $1',
            [giveawayId]
        );
        return result.rows;
    },

    async getGiveawayParticipantCount(giveawayId) {
        const result = await pool.query(
            'SELECT COUNT(*) as count FROM giveaway_participants WHERE giveaway_id = $1',
            [giveawayId]
        );
        return parseInt(result.rows[0].count);
    },

    async hasJoinedGiveaway(giveawayId, userId) {
        const result = await pool.query(
            'SELECT EXISTS(SELECT 1 FROM giveaway_participants WHERE giveaway_id = $1 AND user_id = $2)',
            [giveawayId, userId]
        );
        return result.rows[0].exists;
    },

    async setManualWinner(giveawayId, userId) {
        const result = await pool.query(
            'UPDATE giveaways SET manual_winner_id = $1 WHERE id = $2 RETURNING *',
            [userId, giveawayId]
        );
        return result.rows[0];
    },

    // Initialize database
    async initialize() {
        let retryCount = 0;
        
        while (retryCount < DB_INIT_MAX_RETRIES) {
            try {
                // Test the connection first
                await pool.query('SELECT 1');
                console.log('✅ Database connection verified');
                
                // Read and execute initialization SQL
                const initSQL = fs.readFileSync(
                    path.join(__dirname, 'init.sql'),
                    'utf-8'
                );
                await pool.query(initSQL);
                console.log('✅ Database tables initialized');
                
                // Run migrations
                // Note: All migrations are designed to be idempotent (safe to run multiple times)
                // using conditional checks (e.g., IF NOT EXISTS) to prevent duplicate operations
                const migrationsDir = path.join(__dirname, 'migrations');
                if (fs.existsSync(migrationsDir)) {
                    const migrationFiles = fs.readdirSync(migrationsDir)
                        .filter(file => file.endsWith('.sql'))
                        .sort(); // Ensure migrations run in order
                    
                    for (const file of migrationFiles) {
                        try {
                            const migrationSQL = fs.readFileSync(
                                path.join(migrationsDir, file),
                                'utf-8'
                            );
                            await pool.query(migrationSQL);
                            console.log(`✅ Migration applied: ${file}`);
                        } catch (migrationError) {
                            console.error(`❌ Failed to apply migration ${file}:`, migrationError.message);
                            // Re-throw to trigger retry mechanism
                            throw migrationError;
                        }
                    }
                }
                
                return; // Success, exit the function
            } catch (error) {
                retryCount++;
                console.error(`❌ Failed to initialize database (attempt ${retryCount}/${DB_INIT_MAX_RETRIES}):`, error.message);
                
                if (retryCount >= DB_INIT_MAX_RETRIES) {
                    console.error('❌ Max retries reached. Database initialization failed.');
                    throw error;
                }
                
                // Wait before retrying (exponential backoff)
                const waitTime = Math.min(
                    DB_INIT_RETRY_BASE_DELAY_MS * Math.pow(2, retryCount - 1), 
                    DB_INIT_RETRY_MAX_DELAY_MS
                );
                console.log(`⏳ Retrying in ${waitTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    },
    
    // Graceful shutdown
    async close() {
        try {
            // pool.end() waits for all active clients to be released and all queries to complete
            // The timeout is just for logging if shutdown takes too long
            const shutdownTimeout = setTimeout(() => {
                console.warn('⚠️ Database shutdown taking longer than expected...');
            }, 5000);
            
            await pool.end();
            clearTimeout(shutdownTimeout);
            console.log('✅ Database connection pool closed gracefully');
        } catch (error) {
            console.error('❌ Error closing database pool:', error);
            throw error;
        }
    },
    
    /**
     * Set up PostgreSQL LISTEN for real-time change notifications
     * This complements the in-app event emitters with database-level triggers
     * @param {Function} onLCChange - Callback for LC changes (receives parsed JSON data)
     * @param {Function} onNiveauChange - Callback for Niveau changes (receives parsed JSON data)
     * @returns {Object} Object with unlisten function
     */
    async setupDatabaseNotifications(onLCChange, onNiveauChange) {
        try {
            console.log('🔔 Setting up PostgreSQL NOTIFY listeners for rankings...');
            
            // First, verify that the trigger functions exist
            const triggerCheck = await pool.query(`
                SELECT proname 
                FROM pg_proc 
                WHERE proname IN ('notify_lc_change', 'notify_niveau_change')
            `);
            
            const foundFunctions = triggerCheck.rows.map(r => r.proname);
            console.log(`   📋 Found trigger functions: ${foundFunctions.join(', ') || 'none'}`);
            
            if (foundFunctions.length < 2) {
                console.warn('   ⚠️  Warning: Some trigger functions are missing');
                console.warn('   Database notifications may not work properly');
                console.warn('   Run migration 013_add_rankings_optimizations.sql to install triggers');
            }
            
            // Create a dedicated client for LISTEN (it must stay connected)
            const listenClient = await pool.connect();
            console.log('   ✅ Dedicated LISTEN client connected');
            
            // Track notification counts for monitoring
            let lcNotificationCount = 0;
            let niveauNotificationCount = 0;
            
            // Set up LC change listener
            if (onLCChange) {
                listenClient.on('notification', (msg) => {
                    if (msg.channel === 'lc_change') {
                        try {
                            const data = JSON.parse(msg.payload);
                            lcNotificationCount++;
                            const change = data.change !== undefined ? data.change : (data.newBalance - data.oldBalance);
                            console.log(`📊 [DB NOTIFY #${lcNotificationCount}] LC Change: User ${data.userId}, ${data.oldBalance} -> ${data.newBalance} (change: ${change >= 0 ? '+' : ''}${change})`);
                            onLCChange(data);
                        } catch (error) {
                            console.error('❌ Error parsing LC change notification:', error.message);
                            console.error('   Payload:', msg.payload);
                        }
                    }
                });
                
                await listenClient.query('LISTEN lc_change');
                console.log('   ✅ Listening for LC change notifications on channel: lc_change');
            }
            
            // Set up Niveau change listener
            if (onNiveauChange) {
                listenClient.on('notification', (msg) => {
                    if (msg.channel === 'niveau_change') {
                        try {
                            const data = JSON.parse(msg.payload);
                            niveauNotificationCount++;
                            const change = data.change !== undefined ? data.change : (data.newLevel - data.oldLevel);
                            console.log(`📊 [DB NOTIFY #${niveauNotificationCount}] Niveau Change: User ${data.userId}, Level ${data.oldLevel} -> ${data.newLevel} (change: ${change >= 0 ? '+' : ''}${change})`);
                            onNiveauChange(data);
                        } catch (error) {
                            console.error('❌ Error parsing Niveau change notification:', error.message);
                            console.error('   Payload:', msg.payload);
                        }
                    }
                });
                
                await listenClient.query('LISTEN niveau_change');
                console.log('   ✅ Listening for Niveau change notifications on channel: niveau_change');
            }
            
            console.log('✅ Database notification system active and ready');
            console.log('   💡 Notifications will be logged when LC or Niveau values change in the database');
            
            // Return cleanup function with notification counts
            return {
                unlisten: async () => {
                    try {
                        console.log('🔕 Unsubscribing from database notifications...');
                        console.log(`   📊 Statistics: ${lcNotificationCount} LC notifications, ${niveauNotificationCount} Niveau notifications received`);
                        if (onLCChange) {
                            await listenClient.query('UNLISTEN lc_change');
                        }
                        if (onNiveauChange) {
                            await listenClient.query('UNLISTEN niveau_change');
                        }
                        listenClient.release();
                        console.log('✅ Database notifications unsubscribed');
                    } catch (error) {
                        console.error('❌ Error unsubscribing from notifications:', error.message);
                    }
                },
                client: listenClient,
                getStats: () => ({
                    lcNotifications: lcNotificationCount,
                    niveauNotifications: niveauNotificationCount
                })
            };
        } catch (error) {
            console.error('❌ Error setting up database notifications:', error.message);
            console.error('   Stack:', error.stack);
            console.error('   Falling back to in-app event emitters only');
            return { 
                unlisten: async () => {},
                getStats: () => ({ lcNotifications: 0, niveauNotifications: 0 })
            };
        }
    }
};

module.exports = { pool, db };
