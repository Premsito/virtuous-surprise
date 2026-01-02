-- Migration: Add invite_history table for anti-cheat mechanism
-- This migration adds the invite_history table to track unique invites
-- Safe to run multiple times (idempotent)
-- 
-- Purpose: Prevent users from receiving multiple invitation points for inviting
-- the same person. The composite primary key ensures that each inviter can
-- only have one record for each invited user.

DO $$ 
BEGIN
    -- Create invite_history table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'invite_history'
    ) THEN
        CREATE TABLE invite_history (
            inviter_id VARCHAR(255) NOT NULL,
            invited_id VARCHAR(255) NOT NULL,
            invite_date TIMESTAMP DEFAULT NOW(),
            PRIMARY KEY (inviter_id, invited_id)
        );
        
        -- Create index for better query performance
        CREATE INDEX idx_invite_history_inviter ON invite_history(inviter_id);
        CREATE INDEX idx_invite_history_invited ON invite_history(invited_id);
        
        RAISE NOTICE 'Created invite_history table with composite primary key';
    ELSE
        RAISE NOTICE 'invite_history table already exists';
    END IF;
END $$;
