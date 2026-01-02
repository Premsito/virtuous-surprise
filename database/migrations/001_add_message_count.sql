-- Migration: Add message_count column to users table
-- This migration adds the message_count column if it doesn't exist
-- Safe to run multiple times (idempotent)
-- 
-- Purpose: This migration is for existing production databases that were created 
-- before the message_count column was added to init.sql. New deployments will 
-- already have this column from init.sql, so this migration will detect it 
-- already exists and skip the ALTER TABLE operation.

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'message_count'
    ) THEN
        ALTER TABLE users ADD COLUMN message_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added message_count column to users table';
    ELSE
        RAISE NOTICE 'message_count column already exists in users table';
    END IF;
END $$;
