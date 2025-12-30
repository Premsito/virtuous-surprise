const { Pool } = require('pg');

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
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
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

pool.on('remove', () => {
    console.log('⚠️ Database client removed from pool');
});

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

    // Initialize database
    async initialize() {
        const fs = require('fs');
        const path = require('path');
        
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
            await pool.end();
            console.log('✅ Database connection pool closed');
        } catch (error) {
            console.error('❌ Error closing database pool:', error);
        }
    }
};

module.exports = { pool, db };
