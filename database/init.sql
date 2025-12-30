-- Create users table for LC and invite tracking
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(20) PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    balance INTEGER DEFAULT 25,
    invites INTEGER DEFAULT 0,
    invited_by VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create invites tracking table
CREATE TABLE IF NOT EXISTS invite_tracking (
    id SERIAL PRIMARY KEY,
    inviter_id VARCHAR(20) NOT NULL,
    invited_id VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inviter_id) REFERENCES users(user_id),
    FOREIGN KEY (invited_id) REFERENCES users(user_id)
);

-- Create transactions table for LC transfers
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    from_user_id VARCHAR(20),
    to_user_id VARCHAR(20),
    amount INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_user_id) REFERENCES users(user_id),
    FOREIGN KEY (to_user_id) REFERENCES users(user_id)
);

-- Create game_history table
CREATE TABLE IF NOT EXISTS game_history (
    id SERIAL PRIMARY KEY,
    game_type VARCHAR(50) NOT NULL,
    player_id VARCHAR(20) NOT NULL,
    opponent_id VARCHAR(20),
    bet_amount INTEGER NOT NULL,
    result VARCHAR(20) NOT NULL,
    winnings INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES users(user_id),
    FOREIGN KEY (opponent_id) REFERENCES users(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_balance ON users(balance DESC);
CREATE INDEX IF NOT EXISTS idx_users_invites ON users(invites DESC);
CREATE INDEX IF NOT EXISTS idx_invite_tracking_inviter ON invite_tracking(inviter_id);
CREATE INDEX IF NOT EXISTS idx_transactions_from_user ON transactions(from_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_user ON transactions(to_user_id);
CREATE INDEX IF NOT EXISTS idx_game_history_player ON game_history(player_id);
