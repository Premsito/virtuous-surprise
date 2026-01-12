-- Add bot_state table for persistent bot configuration
-- This table stores bot-wide state like the current rankings message ID

CREATE TABLE IF NOT EXISTS bot_state (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bot_state_key ON bot_state(key);

-- Insert initial state for rankings message tracking
INSERT INTO bot_state (key, value) 
VALUES ('rankings_message_id', NULL)
ON CONFLICT (key) DO NOTHING;
