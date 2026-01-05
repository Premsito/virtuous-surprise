const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration constants
const DB_INIT_MAX_RETRIES = 3;
const DB_INIT_RETRY_BASE_DELAY_MS = 1000;
const DB_INIT_RETRY_MAX_DELAY_MS = 5000;

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

    async updateBalance(userId, amount) {
        const result = await pool.query(
            'UPDATE users SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING *',
            [amount, userId]
        );
        return result.rows[0];
    },

    async setBalance(userId, amount) {
        const result = await pool.query(
            'UPDATE users SET balance = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING *',
            [amount, userId]
        );
        return result.rows[0];
    },

    async transferLC(fromUserId, toUserId, amount, description = 'Transfer') {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Deduct from sender
            await client.query(
                'UPDATE users SET balance = balance - $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
                [amount, fromUserId]
            );
            
            // Add to receiver
            await client.query(
                'UPDATE users SET balance = balance + $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
                [amount, toUserId]
            );
            
            // Record transaction
            await client.query(
                'INSERT INTO transactions (from_user_id, to_user_id, amount, transaction_type, description) VALUES ($1, $2, $3, $4, $5)',
                [fromUserId, toUserId, amount, 'transfer', description]
            );
            
            await client.query('COMMIT');
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
            if (error.code === '23505') {
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
    }
};

module.exports = { pool, db };
