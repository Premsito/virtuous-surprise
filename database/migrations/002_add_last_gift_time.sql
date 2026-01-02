-- Migration: Add last_gift_time column to users table
-- This migration adds the last_gift_time column if it doesn't exist
-- Safe to run multiple times (idempotent)
-- 
-- Purpose: This migration adds a timestamp column to track when users last 
-- received their daily gift via the !cadeau command. Used to enforce the 
-- 24-hour cooldown period.

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'last_gift_time'
    ) THEN
        ALTER TABLE users ADD COLUMN last_gift_time TIMESTAMP DEFAULT NULL;
        RAISE NOTICE 'Added last_gift_time column to users table';
    ELSE
        RAISE NOTICE 'last_gift_time column already exists in users table';
    END IF;
END $$;
