-- Migration: Add automatic level update trigger
-- This migration adds a database trigger to automatically update the level
-- column whenever XP changes, ensuring real-time data consistency
-- Safe to run multiple times (idempotent)
-- 
-- Purpose: 
-- 1. Calculate level from XP automatically at database level
-- 2. Ensure level is always synchronized with XP
-- 3. Eliminate manual level update calls in application code

-- ============================================================================
-- PART 1: Level Calculation Function
-- ============================================================================

-- Create function to calculate level from XP
-- This implements the same formula as utils/xpHelper.js: level * 100
CREATE OR REPLACE FUNCTION calculate_level_from_xp(total_xp INTEGER)
RETURNS INTEGER AS $$
DECLARE
    current_level INTEGER := 1;
    total_xp_needed INTEGER := 0;
    xp_for_next_level INTEGER;
BEGIN
    -- Handle null or negative XP
    IF total_xp IS NULL OR total_xp < 0 THEN
        RETURN 1;
    END IF;
    
    -- Calculate level using the same formula as JavaScript: level * 100
    -- Keep incrementing level while total XP is sufficient
    LOOP
        xp_for_next_level := current_level * 100;
        
        -- Check if we have enough XP for the next level
        IF total_xp_needed + xp_for_next_level <= total_xp THEN
            total_xp_needed := total_xp_needed + xp_for_next_level;
            current_level := current_level + 1;
        ELSE
            -- Not enough XP for next level, exit loop
            EXIT;
        END IF;
    END LOOP;
    
    RETURN current_level;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_level_from_xp(INTEGER) IS 'Calculate user level from total XP using formula: level * 100 per level';

-- ============================================================================
-- PART 2: Automatic Level Update Trigger Function
-- ============================================================================

-- Create trigger function to auto-update level when XP changes
CREATE OR REPLACE FUNCTION auto_update_level()
RETURNS TRIGGER AS $$
DECLARE
    new_level INTEGER;
    old_level INTEGER;
BEGIN
    -- Calculate the new level from XP
    new_level := calculate_level_from_xp(NEW.xp);
    
    -- Only update level if it changed
    IF TG_OP = 'INSERT' OR NEW.level IS NULL OR NEW.level != new_level THEN
        -- Store old level for notification
        old_level := COALESCE(OLD.level, 1);
        
        -- Update the level
        NEW.level := new_level;
        
        -- Log level change if it actually changed
        IF TG_OP = 'UPDATE' AND old_level != new_level THEN
            RAISE NOTICE 'Auto-updated level for user %: % -> % (XP: %)', 
                NEW.user_id, old_level, new_level, NEW.xp;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION auto_update_level() IS 'Trigger function to automatically update user level when XP changes';

-- ============================================================================
-- PART 3: Create Trigger
-- ============================================================================

-- Drop existing trigger if it exists (for idempotent migration)
DROP TRIGGER IF EXISTS trigger_auto_update_level ON users;

-- Create trigger that fires BEFORE INSERT or UPDATE of XP
-- BEFORE trigger allows us to modify NEW.level before the row is written
CREATE TRIGGER trigger_auto_update_level
    BEFORE INSERT OR UPDATE OF xp ON users
    FOR EACH ROW
    EXECUTE FUNCTION auto_update_level();

COMMENT ON TRIGGER trigger_auto_update_level ON users IS 'Automatically calculates and updates level when XP changes';

-- ============================================================================
-- PART 4: Backfill Existing Data
-- ============================================================================

-- Update all existing users to have correct levels based on their XP
-- This ensures data consistency for any users who may have incorrect levels
DO $$
DECLARE
    update_count INTEGER;
BEGIN
    -- Update all users where calculated level differs from stored level
    WITH level_calculations AS (
        SELECT 
            user_id,
            xp,
            level as old_level,
            calculate_level_from_xp(xp) as calculated_level
        FROM users
        WHERE calculate_level_from_xp(xp) != level
    )
    UPDATE users u
    SET level = lc.calculated_level
    FROM level_calculations lc
    WHERE u.user_id = lc.user_id;
    
    GET DIAGNOSTICS update_count = ROW_COUNT;
    
    IF update_count > 0 THEN
        RAISE NOTICE 'Backfilled % users with corrected levels', update_count;
    ELSE
        RAISE NOTICE 'All user levels are already correct';
    END IF;
END $$;

-- ============================================================================
-- PART 5: Testing and Validation
-- ============================================================================

-- Test the calculate_level_from_xp function with known values
DO $$
DECLARE
    test_passed BOOLEAN := true;
BEGIN
    -- Test cases based on xpHelper.js logic
    -- Level 1 requires 0-99 XP (100 XP needed for level 2)
    -- Level 2 requires 100-299 XP (200 XP needed for level 3)
    -- Level 3 requires 300-599 XP (300 XP needed for level 4)
    
    IF calculate_level_from_xp(0) != 1 THEN
        RAISE WARNING 'Test failed: 0 XP should be level 1, got %', calculate_level_from_xp(0);
        test_passed := false;
    END IF;
    
    IF calculate_level_from_xp(99) != 1 THEN
        RAISE WARNING 'Test failed: 99 XP should be level 1, got %', calculate_level_from_xp(99);
        test_passed := false;
    END IF;
    
    IF calculate_level_from_xp(100) != 2 THEN
        RAISE WARNING 'Test failed: 100 XP should be level 2, got %', calculate_level_from_xp(100);
        test_passed := false;
    END IF;
    
    IF calculate_level_from_xp(299) != 2 THEN
        RAISE WARNING 'Test failed: 299 XP should be level 2, got %', calculate_level_from_xp(299);
        test_passed := false;
    END IF;
    
    IF calculate_level_from_xp(300) != 3 THEN
        RAISE WARNING 'Test failed: 300 XP should be level 3, got %', calculate_level_from_xp(300);
        test_passed := false;
    END IF;
    
    IF calculate_level_from_xp(599) != 3 THEN
        RAISE WARNING 'Test failed: 599 XP should be level 3, got %', calculate_level_from_xp(599);
        test_passed := false;
    END IF;
    
    IF calculate_level_from_xp(600) != 4 THEN
        RAISE WARNING 'Test failed: 600 XP should be level 4, got %', calculate_level_from_xp(600);
        test_passed := false;
    END IF;
    
    IF test_passed THEN
        RAISE NOTICE 'SUCCESS: All level calculation tests passed';
    ELSE
        RAISE WARNING 'FAILURE: Some level calculation tests failed';
    END IF;
END $$;

-- Verify trigger exists
DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger
    WHERE tgname = 'trigger_auto_update_level';
    
    IF trigger_count = 1 THEN
        RAISE NOTICE 'SUCCESS: Auto-level update trigger verified';
    ELSE
        RAISE WARNING 'WARNING: Auto-level update trigger not found';
    END IF;
END $$;

RAISE NOTICE 'Migration 014 completed: Automatic level update trigger installed';
