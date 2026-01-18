-- Add manual_winner_id column to giveaways table
ALTER TABLE giveaways
ADD COLUMN IF NOT EXISTS manual_winner_id VARCHAR(20);

-- Add foreign key constraint (only if it doesn't exist)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_manual_winner') THEN
        ALTER TABLE giveaways
        ADD CONSTRAINT fk_manual_winner
        FOREIGN KEY (manual_winner_id) REFERENCES users(user_id)
        ON DELETE SET NULL;
    END IF;
END $$;
