const { Pool } = require('pg');

// Create PostgreSQL connection pool
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : {
        rejectUnauthorized: false
    }
});

// Test database connection
pool.on('connect', () => {
    console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
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
        
        try {
            const initSQL = fs.readFileSync(
                path.join(__dirname, 'init.sql'),
                'utf-8'
            );
            await pool.query(initSQL);
            console.log('✅ Database tables initialized');
        } catch (error) {
            console.error('❌ Failed to initialize database:', error);
            throw error;
        }
    }
};

module.exports = { pool, db };
