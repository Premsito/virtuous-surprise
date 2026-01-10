-- Add manual_winner_id column to giveaways table
ALTER TABLE giveaways
ADD COLUMN IF NOT EXISTS manual_winner_id VARCHAR(20);

-- Add foreign key constraint
ALTER TABLE giveaways
ADD CONSTRAINT fk_manual_winner
FOREIGN KEY (manual_winner_id) REFERENCES users(user_id)
ON DELETE SET NULL;
