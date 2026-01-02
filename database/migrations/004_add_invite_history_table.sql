-- Migration: Add invite_history table for anti-cheat measures
-- This migration creates a new table to track unique invitations
-- Safe to run multiple times (idempotent)
-- 
-- Purpose: This migration adds strict anti-cheat measures to prevent duplicate
-- invitations from being counted. The invite_history table uses a composite
-- PRIMARY KEY on (inviter_id, invited_id) to ensure each user can only be
-- invited once by any specific inviter.

DO $$ 
BEGIN
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
        
        -- Create indexes for better query performance
        CREATE INDEX idx_invite_history_inviter ON invite_history(inviter_id);
        CREATE INDEX idx_invite_history_invited ON invite_history(invited_id);
        
        RAISE NOTICE 'Created invite_history table with composite primary key';
    ELSE
        RAISE NOTICE 'invite_history table already exists';
    END IF;
END $$;
