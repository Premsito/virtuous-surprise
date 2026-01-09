-- Migration: Add XP and Level system
-- This migration adds XP and level tracking columns to users table
-- Safe to run multiple times (idempotent)
-- 
-- Purpose: Implements a leveling system where users gain XP from various activities
-- including game participation, messages, voice chat, and reactions

DO $$ 
BEGIN
    -- Add XP column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'xp'
    ) THEN
        ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0;
        RAISE NOTICE 'Added xp column to users table';
    ELSE
        RAISE NOTICE 'xp column already exists in users table';
    END IF;

    -- Add level column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'level'
    ) THEN
        ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1;
        RAISE NOTICE 'Added level column to users table';
    ELSE
        RAISE NOTICE 'level column already exists in users table';
    END IF;

    -- Add last_message_xp_time column for anti-spam
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'last_message_xp_time'
    ) THEN
        ALTER TABLE users ADD COLUMN last_message_xp_time TIMESTAMP DEFAULT NULL;
        RAISE NOTICE 'Added last_message_xp_time column to users table';
    ELSE
        RAISE NOTICE 'last_message_xp_time column already exists in users table';
    END IF;

    -- Add last_reaction_xp_check column for reaction tracking
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'last_reaction_xp_check'
    ) THEN
        ALTER TABLE users ADD COLUMN last_reaction_xp_check TIMESTAMP DEFAULT NULL;
        RAISE NOTICE 'Added last_reaction_xp_check column to users table';
    ELSE
        RAISE NOTICE 'last_reaction_xp_check column already exists in users table';
    END IF;
END $$;

-- Create voice_xp_tracking table for hourly bonus tracking
CREATE TABLE IF NOT EXISTS voice_xp_tracking (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL,
    session_start TIMESTAMP NOT NULL,
    last_xp_grant TIMESTAMP NOT NULL,
    total_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Create message_reaction_xp table to track XP gained from reactions per message
CREATE TABLE IF NOT EXISTS message_reaction_xp (
    message_id VARCHAR(20) PRIMARY KEY,
    user_id VARCHAR(20) NOT NULL,
    xp_earned INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_level ON users(level DESC);
CREATE INDEX IF NOT EXISTS idx_users_xp ON users(xp DESC);
CREATE INDEX IF NOT EXISTS idx_voice_xp_tracking_user ON voice_xp_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_message_reaction_xp_user ON message_reaction_xp(user_id);
