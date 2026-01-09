-- Create inventory table for bonus items (Jackpots and Multipliers)
CREATE TABLE IF NOT EXISTS user_inventory (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL,
    item_type VARCHAR(50) NOT NULL, -- 'jackpot', 'multiplier_x2', 'multiplier_x3'
    quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    UNIQUE(user_id, item_type)
);

-- Create active multipliers table to track active bonuses
CREATE TABLE IF NOT EXISTS active_multipliers (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL,
    multiplier_type VARCHAR(50) NOT NULL, -- 'multiplier_x2' or 'multiplier_x3'
    multiplier_value INTEGER NOT NULL, -- 2 or 3
    games_remaining INTEGER DEFAULT 2, -- Number of games the multiplier is active for
    activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_inventory_user ON user_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_active_multipliers_user ON active_multipliers(user_id);
