-- Add giveaways table
CREATE TABLE IF NOT EXISTS giveaways (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    reward VARCHAR(255) NOT NULL,
    duration INTEGER NOT NULL, -- duration in minutes
    winners_count INTEGER NOT NULL DEFAULT 1,
    quantity INTEGER NOT NULL DEFAULT 1,
    channel_id VARCHAR(20) NOT NULL,
    message_id VARCHAR(20),
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- active, ended
    created_by VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- Add giveaway_participants table
CREATE TABLE IF NOT EXISTS giveaway_participants (
    id SERIAL PRIMARY KEY,
    giveaway_id INTEGER NOT NULL,
    user_id VARCHAR(20) NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (giveaway_id) REFERENCES giveaways(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    UNIQUE(giveaway_id, user_id) -- Prevent duplicate participations
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_giveaways_status ON giveaways(status);
CREATE INDEX IF NOT EXISTS idx_giveaways_end_time ON giveaways(end_time);
CREATE INDEX IF NOT EXISTS idx_giveaway_participants_giveaway ON giveaway_participants(giveaway_id);
CREATE INDEX IF NOT EXISTS idx_giveaway_participants_user ON giveaway_participants(user_id);
