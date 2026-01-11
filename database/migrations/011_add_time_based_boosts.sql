-- Migration: Add time-based boosts table
-- This table tracks active time-based boosts (XP and LC multipliers)

CREATE TABLE IF NOT EXISTS active_boosts (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL,
    boost_type VARCHAR(10) NOT NULL, -- 'xp' or 'lc'
    multiplier INTEGER NOT NULL DEFAULT 2, -- typically 2 for x2
    expires_at TIMESTAMP NOT NULL,
    activated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_active_boosts_user_expires ON active_boosts(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_active_boosts_expires ON active_boosts(expires_at);
