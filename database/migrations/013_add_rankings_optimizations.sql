-- Migration: Add rankings query optimizations and PostgreSQL triggers
-- This migration optimizes database queries for rankings and adds triggers
-- for real-time change notifications
-- Safe to run multiple times (idempotent)
-- 
-- Purpose: 
-- 1. Optimize getTopLevels query with composite index
-- 2. Add PostgreSQL triggers for LC and Niveau changes
-- 3. Enable real-time NOTIFY mechanism for instant updates

-- ============================================================================
-- PART 1: Query Optimization
-- ============================================================================

-- Create composite index for level rankings query (level DESC, xp DESC)
-- This significantly improves performance of ORDER BY level DESC, xp DESC LIMIT N
-- DROP first if exists to recreate with proper configuration
DROP INDEX IF EXISTS idx_users_level_xp_composite;
CREATE INDEX idx_users_level_xp_composite ON users(level DESC, xp DESC);

COMMENT ON INDEX idx_users_level_xp_composite IS 'Composite index for efficient level rankings queries (ORDER BY level DESC, xp DESC)';

-- ============================================================================
-- PART 2: PostgreSQL Triggers and NOTIFY System
-- ============================================================================

-- Create function to notify on LC (balance) changes
-- This function sends a PostgreSQL NOTIFY message when a user's balance changes
CREATE OR REPLACE FUNCTION notify_lc_change()
RETURNS TRIGGER AS $$
DECLARE
    change_data JSON;
BEGIN
    -- Only notify if balance actually changed
    IF (TG_OP = 'UPDATE' AND OLD.balance IS DISTINCT FROM NEW.balance) OR TG_OP = 'INSERT' THEN
        -- Build change data payload
        change_data := json_build_object(
            'userId', NEW.user_id,
            'oldBalance', COALESCE(OLD.balance, 0),
            'newBalance', NEW.balance,
            'change', NEW.balance - COALESCE(OLD.balance, 0),
            'timestamp', EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::BIGINT,
            'operation', TG_OP
        );
        
        -- Send notification on 'lc_change' channel
        PERFORM pg_notify('lc_change', change_data::text);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION notify_lc_change() IS 'Trigger function to notify application of LC (balance) changes via PostgreSQL NOTIFY';

-- Create function to notify on Niveau (level) changes
-- This function sends a PostgreSQL NOTIFY message when a user's level changes
CREATE OR REPLACE FUNCTION notify_niveau_change()
RETURNS TRIGGER AS $$
DECLARE
    change_data JSON;
BEGIN
    -- Only notify if level actually changed
    IF (TG_OP = 'UPDATE' AND OLD.level IS DISTINCT FROM NEW.level) OR TG_OP = 'INSERT' THEN
        -- Build change data payload
        change_data := json_build_object(
            'userId', NEW.user_id,
            'oldLevel', COALESCE(OLD.level, 1),
            'newLevel', NEW.level,
            'change', NEW.level - COALESCE(OLD.level, 1),
            'timestamp', EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::BIGINT,
            'operation', TG_OP
        );
        
        -- Send notification on 'niveau_change' channel
        PERFORM pg_notify('niveau_change', change_data::text);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION notify_niveau_change() IS 'Trigger function to notify application of Niveau (level) changes via PostgreSQL NOTIFY';

-- Drop existing triggers if they exist (for idempotent migration)
DROP TRIGGER IF EXISTS trigger_lc_change ON users;
DROP TRIGGER IF EXISTS trigger_niveau_change ON users;

-- Create trigger for LC changes
-- Fires AFTER UPDATE or INSERT on users table when balance changes
CREATE TRIGGER trigger_lc_change
    AFTER INSERT OR UPDATE OF balance ON users
    FOR EACH ROW
    EXECUTE FUNCTION notify_lc_change();

COMMENT ON TRIGGER trigger_lc_change ON users IS 'Trigger to notify application of LC (balance) changes in real-time';

-- Create trigger for Niveau changes
-- Fires AFTER UPDATE or INSERT on users table when level changes
CREATE TRIGGER trigger_niveau_change
    AFTER INSERT OR UPDATE OF level ON users
    FOR EACH ROW
    EXECUTE FUNCTION notify_niveau_change();

COMMENT ON TRIGGER trigger_niveau_change ON users IS 'Trigger to notify application of Niveau (level) changes in real-time';

-- ============================================================================
-- PART 3: Testing and Validation
-- ============================================================================

-- Verify indexes exist
DO $$
DECLARE
    idx_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO idx_count
    FROM pg_indexes
    WHERE tablename = 'users'
    AND indexname IN ('idx_users_balance', 'idx_users_level_xp_composite');
    
    IF idx_count = 2 THEN
        RAISE NOTICE 'SUCCESS: All ranking indexes verified';
    ELSE
        RAISE WARNING 'WARNING: Expected 2 ranking indexes, found %', idx_count;
    END IF;
END $$;

-- Verify triggers exist
DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger
    WHERE tgname IN ('trigger_lc_change', 'trigger_niveau_change');
    
    IF trigger_count = 2 THEN
        RAISE NOTICE 'SUCCESS: All ranking triggers verified';
    ELSE
        RAISE WARNING 'WARNING: Expected 2 ranking triggers, found %', trigger_count;
    END IF;
END $$;

RAISE NOTICE 'Migration 013 completed: Rankings optimizations and triggers installed';
