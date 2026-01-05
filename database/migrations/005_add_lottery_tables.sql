-- Create lottery_state table to track the current jackpot and next draw
CREATE TABLE IF NOT EXISTS lottery_state (
    id INTEGER PRIMARY KEY DEFAULT 1,
    jackpot INTEGER DEFAULT 10000,
    next_draw_time TIMESTAMP NOT NULL,
    total_tickets_sold INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT single_row CHECK (id = 1)
);

-- Create lottery_tickets table to track ticket purchases
CREATE TABLE IF NOT EXISTS lottery_tickets (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL,
    ticket_number INTEGER NOT NULL,
    draw_time TIMESTAMP NOT NULL,
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Create lottery_draws table to record draw history
CREATE TABLE IF NOT EXISTS lottery_draws (
    id SERIAL PRIMARY KEY,
    draw_time TIMESTAMP NOT NULL,
    winning_ticket INTEGER NOT NULL,
    winner_id VARCHAR(20),
    jackpot_amount INTEGER NOT NULL,
    total_tickets INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (winner_id) REFERENCES users(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_lottery_tickets_user ON lottery_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_lottery_tickets_draw ON lottery_tickets(draw_time);
CREATE INDEX IF NOT EXISTS idx_lottery_draws_time ON lottery_draws(draw_time DESC);

-- Initialize lottery state if it doesn't exist (set next Sunday at 20:00)
INSERT INTO lottery_state (id, jackpot, next_draw_time, total_tickets_sold)
SELECT 1, 10000, 
    CASE 
        WHEN EXTRACT(DOW FROM CURRENT_TIMESTAMP) = 0 THEN 
            -- If today is Sunday, schedule for next Sunday
            (CURRENT_DATE + INTERVAL '7 days' + TIME '20:00:00')::TIMESTAMP
        ELSE 
            -- Schedule for next Sunday
            (CURRENT_DATE + (7 - EXTRACT(DOW FROM CURRENT_TIMESTAMP)::INTEGER) * INTERVAL '1 day' + TIME '20:00:00')::TIMESTAMP
    END,
    0
WHERE NOT EXISTS (SELECT 1 FROM lottery_state WHERE id = 1);
