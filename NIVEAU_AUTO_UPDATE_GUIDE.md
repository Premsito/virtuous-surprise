# Niveau Ranking Automatic Updates - Implementation Guide

## Overview

This document describes the implementation of automatic Niveau (level) ranking updates and configurable periodic refresh in the virtuous-surprise Discord bot.

## Key Features Implemented

### 1. Automatic Level Calculation from XP (Database Trigger)

**Problem**: Previously, level updates required manual calls to `db.updateLevel()` in the application code after XP changes. This created risks of:
- Forgetting to update the level
- Inconsistent data if direct SQL updates bypassed application logic
- Code complexity managing level updates in multiple places

**Solution**: Database trigger that automatically calculates and updates the `level` column whenever `xp` changes.

**Implementation**: `database/migrations/014_add_auto_level_update_trigger.sql`

#### Key Components:

1. **`calculate_level_from_xp(total_xp INTEGER)` Function**
   - Implements the same XP-to-level formula as `utils/xpHelper.js`
   - Formula: `level * 100` XP required per level
   - Example: Level 1→2 requires 100 XP, Level 2→3 requires 200 XP, etc.
   - Returns the correct level for any given XP amount

2. **`auto_update_level()` Trigger Function**
   - Automatically called whenever a user's XP changes
   - Calculates the new level using `calculate_level_from_xp()`
   - Updates the `level` column before the row is saved
   - Logs level changes for debugging

3. **`trigger_auto_update_level` Trigger**
   - Fires `BEFORE INSERT OR UPDATE OF xp ON users`
   - Ensures level is always synchronized with XP
   - Works for both application code and direct SQL updates

#### Benefits:

✅ **Data Consistency**: Level is always accurate based on XP
✅ **Simplified Code**: No manual `db.updateLevel()` calls needed
✅ **Database-Level Enforcement**: Works even with direct SQL updates
✅ **Real-time Updates**: Level changes immediately when XP changes

#### Testing:

Run the test suite to verify:
```bash
node test-auto-level-trigger.js      # Logic validation
node test-niveau-integration.js      # Full integration test (requires database)
node test-niveau-ranking-validation.js  # Ranking validation
```

### 2. Configurable Auto-Refresh Interval

**Problem**: The rankings update interval was hardcoded in `bot.js`, making it difficult to adjust without modifying code.

**Solution**: Moved all rankings configuration to `config.json` for easy customization.

**Implementation**: 

#### Configuration (config.json):

```json
{
  "rankings": {
    "updateIntervalMinutes": 5,      // How often to refresh rankings
    "retryDelaySeconds": 30,          // Delay before retry on error
    "maxRetries": 3,                  // Max retry attempts per cycle
    "initialDelaySeconds": 5          // Delay before first update after bot start
  }
}
```

#### Usage:

The bot reads these values on startup and uses them to configure the auto-refresh:

- **Update Interval**: Rankings refresh every `updateIntervalMinutes` minutes (default: 5)
- **Retry Logic**: If an update fails, retry up to `maxRetries` times with `retryDelaySeconds` delay
- **Initial Delay**: Wait `initialDelaySeconds` after bot starts before first update

#### Changing the Interval:

To change the update frequency, simply edit `config.json`:

```json
{
  "rankings": {
    "updateIntervalMinutes": 10,  // Change to 10 minutes
    ...
  }
}
```

Restart the bot for changes to take effect.

### 3. Enhanced Debug Logging

**Status**: ✅ Already comprehensive in existing code

The `commands/rankings.js` file already includes extensive debug logging for all stages:

#### Data Retrieval Stage:
```
🔍 [DATA] Fetching rankings from database...
✅ [DATA] Fetched rankings in XXms
📊 [DATA] Fetched LC Rankings (N users):
   1. Username (ID: xxx) - N LC
📊 [DATA] Fetched Niveau Rankings (N users):
   1. Username (ID: xxx) - Level N, XP: N
```

#### Data Validation Stage:
```
⚠️ [DATA] Warning: Some users have invalid level data!
✅ [DATA] Niveau rankings sorting verified (Level DESC, XP DESC)
```

#### Display Stage:
```
🎨 [EMBEDS] Creating ranking embeds with display names...
✅ Embeds created successfully
📤 [SEND] Sending ranking embeds to channel...
✅ [SUCCESS] Ranking embeds sent successfully (Message ID: xxx)
```

#### Cleanup Stage:
```
🧹 [DELETE] Deleting previous rankings message (ID: xxx)...
✅ Previous rankings message deleted successfully
```

#### Enable Extended Debug Mode:

Set environment variable `DEBUG=true` to enable additional validation:
```bash
DEBUG=true node bot.js
```

This enables:
- Full sorting order verification on every update
- Detailed position-by-position validation
- Performance monitoring with warnings for slow queries

### 4. Automatic Embed Cleanup

**Status**: ✅ Already implemented

The rankings system automatically:

1. **Tracks Last Message**: Stores message ID in memory and database
2. **Deletes Old Message**: Before posting new rankings, deletes the previous message
3. **Persistence**: Message ID saved to database for recovery after bot restarts
4. **Cleanup on Startup**: Loads last message from database when bot starts

This ensures:
- Only one rankings message exists at a time
- Clean channel without duplicate rankings
- Proper cleanup even after bot restarts

## Testing Procedures

### 1. Test Automatic Level Updates

```bash
# Test the trigger logic (no database required)
node test-auto-level-trigger.js

# Test with real database
node test-niveau-integration.js
```

**What it tests:**
- XP additions automatically update level
- Level calculation matches JavaScript logic
- Direct SQL updates trigger level recalculation
- Rankings query returns correct sorted data

### 2. Test Periodic Refresh

**Manual Test:**
1. Start the bot
2. Observe initial rankings display after 5 seconds (or configured delay)
3. Wait for next update (default: 5 minutes)
4. Verify:
   - Old message is deleted
   - New message is posted
   - Message ID is tracked
   - Logs show update cycle

**Expected Console Output:**
```
⏰ Rankings auto-update interval configured: 5 minutes (300000ms)
   - Retry delay on error: 30 seconds
   - Max retries per cycle: 3
   - Update frequency: 12 updates per hour

🔄 [2024-01-14T12:00:00.000Z] Starting scheduled rankings update...
   Update #1 | Interval: Every 5 minutes
...
✅ [2024-01-14T12:00:02.123Z] Scheduled rankings update completed
   Duration: 2123ms
   Success rate: 100.00%
   Total updates: 1
   Next update: 2024-01-14T12:05:00.000Z
```

### 3. Test XP Modification and Ranking Update

**Manual Test:**
1. Use admin command to add XP to a user:
   ```
   !xp add @user 500
   ```
2. Verify:
   - User's level updates automatically
   - Level change appears in database immediately
   - Rankings refresh at next interval shows updated position

**Database Test:**
```sql
-- Add XP directly via SQL
UPDATE users SET xp = 1000 WHERE user_id = 'USER_ID';

-- Verify level was auto-updated
SELECT user_id, xp, level FROM users WHERE user_id = 'USER_ID';
```

### 4. Test Ranking Accuracy

```bash
# Run comprehensive validation
node test-niveau-ranking-validation.js
```

**What it checks:**
- Database schema (level and xp columns exist)
- Triggers are installed and enabled
- Sample data shows correct levels
- `getTopLevels()` returns properly sorted results
- Sorting order is Level DESC, XP DESC
- Indexes exist for performance

### 5. Test Database Triggers

```bash
# Run trigger-specific tests
node test-rankings-triggers.js
```

**What it tests:**
- Migration 013 (rankings optimizations) applied
- Migration 014 (auto-level trigger) applied
- Composite index exists
- PostgreSQL NOTIFY triggers work
- Query performance is acceptable
- Indexes are being used by query planner

## Architecture

### Data Flow

```
User Action (Message/Game/Voice)
        ↓
    Add XP (db.addXP)
        ↓
Database Trigger (auto_update_level)
        ↓
  Calculate Level from XP
        ↓
  Update Level Column
        ↓
Emit Niveau Change Event
        ↓
Rankings Manager (debounced)
        ↓
Schedule Rankings Update (setInterval)
        ↓
Fetch Top 10 Rankings (getTopLevels)
        ↓
  Create Discord Embeds
        ↓
Delete Old Message + Post New Message
```

### Database Triggers

1. **`trigger_auto_update_level`** (Migration 014)
   - Fires on: `INSERT OR UPDATE OF xp ON users`
   - Action: Calculates and updates level from XP
   - Timing: `BEFORE` row is written

2. **`trigger_niveau_change`** (Migration 013)
   - Fires on: `INSERT OR UPDATE OF level ON users`
   - Action: Sends PostgreSQL NOTIFY message
   - Timing: `AFTER` row is written
   - Channel: `niveau_change`

3. **`trigger_lc_change`** (Migration 013)
   - Fires on: `INSERT OR UPDATE OF balance ON users`
   - Action: Sends PostgreSQL NOTIFY message
   - Timing: `AFTER` row is written
   - Channel: `lc_change`

### Rankings Update Cycle

1. **Event Trigger**: XP change detected
2. **Debouncing**: Waits for multiple changes (30s-2min window)
3. **Scheduled Update**: Every 5 minutes (configurable)
4. **Data Fetch**: Query top 10 users by Level/XP
5. **Validation**: Verify sorting and data integrity
6. **Display**: Create embeds and post to channel
7. **Cleanup**: Delete previous message
8. **Persistence**: Save message ID to database

## Configuration Reference

### config.json

```json
{
  "rankings": {
    "updateIntervalMinutes": 5,    // Ranking refresh interval (minutes)
    "retryDelaySeconds": 30,        // Retry delay on error (seconds)
    "maxRetries": 3,                // Max retries per update cycle
    "initialDelaySeconds": 5        // Initial delay after bot start (seconds)
  },
  "channels": {
    "rankings": "CHANNEL_ID"        // Channel for auto-posted rankings
  }
}
```

### Environment Variables

- `DATABASE_URL`: PostgreSQL connection string (required)
- `DEBUG`: Set to `true` for extended debug logging (optional)
- `NODE_ENV`: Set to `development` for dev-specific features (optional)

## Monitoring

### Success Metrics

The bot tracks and logs:
- Total update count
- Success rate (%)
- Average update duration
- Time since last successful update
- Retry attempts and failures

### Console Monitoring

Watch for these indicators:

✅ **Healthy:**
```
✅ [SUCCESS] Rankings successfully updated
   Duration: 1234ms
   Success rate: 100.00%
```

⚠️ **Warning:**
```
⚠️ Slow query: getTopLevels took 150ms
```

❌ **Error:**
```
❌ [ERROR] Error updating rankings: <error message>
⏰ [RETRY] Scheduling retry 1/3 in 30 seconds...
```

## Troubleshooting

### Rankings Not Updating

1. Check rankings channel ID in config.json
2. Verify bot has permissions (SendMessages, EmbedLinks, ManageMessages)
3. Check console for error messages
4. Verify database triggers exist: `node test-niveau-ranking-validation.js`

### Level Not Auto-Updating

1. Check trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'trigger_auto_update_level';`
2. Run integration test: `node test-niveau-integration.js`
3. Check migration 014 was applied
4. Verify XP is actually changing in database

### Incorrect Ranking Order

1. Run validation: `node test-niveau-ranking-validation.js`
2. Check index exists: `SELECT * FROM pg_indexes WHERE indexname = 'idx_users_level_xp_composite';`
3. Enable DEBUG mode and check sorting validation logs
4. Verify data integrity (no NULL levels)

## Future Enhancements

Potential improvements:
- Make interval adjustable via Discord command (without restart)
- Add manual refresh command for admins
- Cache rankings data to reduce database load
- Implement incremental updates (only update changed positions)
- Add webhooks for external ranking displays
- Export ranking history for analytics

## Summary

All requirements from the problem statement have been implemented:

✅ **Niveau updates**: Database trigger automatically calculates level from XP
✅ **Database triggers**: Migration 014 adds auto-update trigger
✅ **Debug getTopUsersByLevel**: Comprehensive logging and validation
✅ **Automatic refresh**: Configurable setInterval with retry logic
✅ **Clean updates**: Automatic deletion of old messages
✅ **Debug enhancements**: Extensive logging for all stages
✅ **Testing**: Complete test suite for validation

The system is now production-ready with automatic, accurate, and debuggable Niveau rankings! 🎉
