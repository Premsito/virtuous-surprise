# Rankings System Implementation: PostgreSQL Triggers & Enhanced Monitoring

## Overview

This implementation adds **PostgreSQL database triggers** and **comprehensive monitoring** to the existing dynamic rankings system, providing real-time change detection at the database level and detailed performance metrics.

## Features Implemented

### 1. PostgreSQL Triggers for Real-Time Change Detection

#### Database Migration 013

**File**: `database/migrations/013_add_rankings_optimizations.sql`

The migration adds:

1. **Composite Index for Niveau Rankings**
   - Index: `idx_users_level_xp_composite` on `(level DESC, xp DESC)`
   - Optimizes the `ORDER BY level DESC, xp DESC` query
   - Significant performance improvement for level rankings

2. **LC Change Trigger**
   - Function: `notify_lc_change()`
   - Trigger: `trigger_lc_change`
   - Fires on: `INSERT OR UPDATE OF balance` on `users` table
   - Channel: `lc_change`
   - Payload: JSON with `userId`, `oldBalance`, `newBalance`, `change`, `timestamp`

3. **Niveau Change Trigger**
   - Function: `notify_niveau_change()`
   - Trigger: `trigger_niveau_change`
   - Fires on: `INSERT OR UPDATE OF level` on `users` table
   - Channel: `niveau_change`
   - Payload: JSON with `userId`, `oldLevel`, `newLevel`, `change`, `timestamp`

#### How It Works

```
User Balance/Level Changes
         ↓
PostgreSQL Trigger Fires
         ↓
NOTIFY sent to channel (lc_change or niveau_change)
         ↓
Bot LISTEN client receives notification
         ↓
Rankings Manager updates rankings
         ↓
Channel message updated
```

#### Benefits

- **Database-level consistency**: Changes detected even if made via SQL tools
- **No race conditions**: Triggers fire atomically with the UPDATE
- **Backup system**: Complements in-app event emitters
- **Audit trail**: All changes logged with timestamps

### 2. Enhanced Database Query Performance

#### Query Optimization

**File**: `database/db.js`

Both `getTopLC` and `getTopLevels` now include:

1. **Performance Monitoring**
   - Measures query execution time
   - Logs slow queries (>100ms)
   - Helps identify performance issues

2. **Error Handling**
   - Detailed error logging with query and parameters
   - Helps debug database issues
   - Non-breaking error reporting

```javascript
// Example: getTopLC with monitoring
async getTopLC(limit = 10) {
    try {
        const startTime = Date.now();
        const result = await pool.query(
            'SELECT user_id, username, balance FROM users ORDER BY balance DESC LIMIT $1',
            [limit]
        );
        const duration = Date.now() - startTime;
        
        if (duration > 100) {
            console.warn(`⚠️ Slow query: getTopLC took ${duration}ms`);
        }
        
        return result.rows;
    } catch (error) {
        console.error('❌ Error fetching top LC rankings:', error.message);
        console.error('   Query: SELECT user_id, username, balance...');
        console.error('   Params:', { limit });
        throw error;
    }
}
```

### 3. PostgreSQL LISTEN/NOTIFY Integration

#### Database Notifications Setup

**File**: `database/db.js` - `setupDatabaseNotifications()`

New function that:
- Creates dedicated LISTEN client
- Subscribes to `lc_change` and `niveau_change` channels
- Parses JSON payloads from triggers
- Forwards to application event handlers
- Provides cleanup function for graceful shutdown

#### Bot Integration

**File**: `bot.js`

During bot startup:
```javascript
const dbNotificationCleanup = await db.setupDatabaseNotifications(
    // LC change handler
    (data) => {
        rankingsManager.handleLCChange({
            userId: data.userId,
            oldBalance: data.oldBalance,
            newBalance: data.newBalance,
            reason: 'db_trigger',
            timestamp: data.timestamp
        });
    },
    // Niveau change handler
    (data) => {
        rankingsManager.handleNiveauChange({
            userId: data.userId,
            oldLevel: data.oldLevel,
            newLevel: data.newLevel,
            reason: 'db_trigger',
            timestamp: data.timestamp
        });
    }
);
```

### 4. Rankings Metrics & Monitoring

#### Metrics Module

**File**: `utils/rankingsMetrics.js`

Tracks:
- Total updates
- Successful updates
- Failed updates
- Success rate (%)
- Average update duration
- Last update timestamp
- Last success timestamp
- Last failure timestamp & reason

#### Usage

```javascript
// Record success
rankingsMetrics.recordSuccess(150); // 150ms duration

// Record failure
rankingsMetrics.recordFailure('Channel not found');

// Get success rate
const rate = rankingsMetrics.getSuccessRate(); // 95.5

// Get summary
const summary = rankingsMetrics.getSummary();
// {
//   totalUpdates: 100,
//   successfulUpdates: 97,
//   failedUpdates: 3,
//   successRate: "97.00%",
//   averageDuration: "145.23ms",
//   ...
// }

// Print summary to console
rankingsMetrics.printSummary();
```

#### Automatic Logging

The bot automatically:
- Records metrics for every update attempt
- Logs success rate with each update
- Prints comprehensive summary every hour
- Includes metrics in retry logging

### 5. Enhanced Error Handling

#### Discord API Error Context

**File**: `commands/rankings.js`

Added helpful error contexts for common Discord API errors:

```javascript
const errorContexts = {
    10003: 'Unknown Channel - The channel may have been deleted',
    10008: 'Unknown Message - The message may have been deleted',
    50001: 'Missing Access - Bot lacks permission to view the channel',
    50013: 'Missing Permissions - Bot lacks permission to send messages',
    50035: 'Invalid Form Body - Message content or embeds are malformed',
    // ... more error codes
};
```

When an error occurs, logs include:
- Error code with context
- HTTP status
- HTTP method
- API path
- Full stack trace
- Timestamp
- Channel/guild information

## Testing

### Metrics Test

**File**: `test-rankings-metrics.js`

Tests the metrics tracking module:
```bash
node test-rankings-metrics.js
```

✅ Verifies:
- Initial state
- Success recording
- Failure recording
- Summary generation
- Reset functionality

### Triggers Test

**File**: `test-rankings-triggers.js`

Tests database triggers and optimizations:
```bash
node test-rankings-triggers.js
```

✅ Verifies:
- Migration applied successfully
- Composite index exists
- Triggers created
- Trigger functions exist
- NOTIFY mechanism works
- Query performance acceptable
- Query plans use indexes

⚠️ **Note**: Requires a valid `DATABASE_URL` environment variable.

## Architecture

### Dual Change Detection System

The system now has **two layers** of change detection:

1. **Application Layer** (Existing)
   - In-app event emitters in `db.js`
   - Emit events when balance/level updated
   - Fast, no network overhead
   - Only detects app-initiated changes

2. **Database Layer** (New)
   - PostgreSQL triggers
   - Emit NOTIFY when data changes
   - Detects ALL changes (even via SQL tools)
   - Provides backup/redundancy

Both layers forward to `rankingsManager`, which:
- Deduplicates events
- Batches multiple changes
- Schedules single update
- Updates rankings channel

### Update Flow

```
┌─────────────────────────────────────────────────────────┐
│                  Change Initiated                        │
│  (Game win, transfer, level up, admin command, etc.)   │
└─────────────────────────────────────────────────────────┘
                        ↓
         ┌──────────────┴──────────────┐
         ↓                              ↓
┌────────────────┐            ┌────────────────┐
│  In-App Event  │            │ DB Trigger     │
│  Emitter       │            │ NOTIFY         │
└────────────────┘            └────────────────┘
         ↓                              ↓
         └──────────────┬──────────────┘
                        ↓
         ┌──────────────────────────┐
         │   Rankings Manager       │
         │   (Deduplicates)         │
         └──────────────────────────┘
                        ↓
         ┌──────────────────────────┐
         │   Debounce (30s-2min)    │
         └──────────────────────────┘
                        ↓
         ┌──────────────────────────┐
         │   Update Rankings        │
         │   (Delete old + Post new)│
         └──────────────────────────┘
                        ↓
         ┌──────────────────────────┐
         │   Record Metrics         │
         └──────────────────────────┘
```

### Periodic Updates

In addition to event-driven updates, the system maintains:
- **5-minute interval**: Scheduled updates
- **Retry logic**: Up to 3 retries with 30s delay
- **Metrics tracking**: Every update tracked
- **Hourly summary**: Metrics logged every hour

## Configuration

### Channel ID

Rankings channel configured in `config.json`:
```json
{
  "channels": {
    "rankings": "1460012957458235618"
  }
}
```

### Update Intervals

Configured in `bot.js`:
```javascript
const RANKINGS_UPDATE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const RANKINGS_RETRY_DELAY_MS = 30 * 1000; // 30 seconds
const RANKINGS_MAX_RETRIES = 3;
```

## Performance Considerations

### Database Indexes

The system uses these indexes for optimal performance:

1. `idx_users_balance` - For LC rankings (ORDER BY balance DESC)
2. `idx_users_level_xp_composite` - For Niveau rankings (ORDER BY level DESC, xp DESC)

### Query Performance

Expected performance:
- **Small tables** (<1000 users): <10ms
- **Medium tables** (1000-10000 users): 10-50ms
- **Large tables** (>10000 users): 50-100ms

Queries >100ms are logged as slow queries.

### Trigger Overhead

PostgreSQL triggers add minimal overhead:
- ~0.1-1ms per INSERT/UPDATE
- Only fires when balance/level actually changes
- Asynchronous NOTIFY (non-blocking)

## Monitoring & Maintenance

### Metrics Dashboard

Check metrics in logs:
```
📊 Rankings Update Metrics Summary
=====================================
   Total Updates: 288
   Successful Updates: 286
   Failed Updates: 2
   Success Rate: 99.31%
   Average Duration: 145.23ms
   Last Update Time: 2026-01-14T08:15:30.123Z
   Last Success Time: 2026-01-14T08:15:30.123Z
   Last Failure Time: 2026-01-13T14:20:15.456Z
   Last Failure Reason: Channel not found
=====================================
```

### Health Indicators

🟢 **Healthy**:
- Success rate >95%
- Average duration <200ms
- No recent failures

🟡 **Warning**:
- Success rate 80-95%
- Average duration 200-500ms
- Occasional failures (<5%)

🔴 **Critical**:
- Success rate <80%
- Average duration >500ms
- Frequent failures (>5%)

## Troubleshooting

### Triggers Not Firing

1. Check triggers exist:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname LIKE 'trigger_%_change';
   ```

2. Check trigger functions:
   ```sql
   SELECT proname FROM pg_proc WHERE proname LIKE 'notify_%_change';
   ```

3. Re-run migration:
   ```bash
   # Migration is idempotent
   psql $DATABASE_URL < database/migrations/013_add_rankings_optimizations.sql
   ```

### NOTIFY Not Received

1. Check LISTEN client is connected:
   - Look for "Setting up PostgreSQL NOTIFY listeners" in logs
   - Verify "Listening for LC/Niveau change notifications" appears

2. Check for connection issues:
   - LISTEN requires persistent connection
   - Connection may drop during network issues
   - Bot restart re-establishes connection

3. Test manually:
   ```sql
   -- In one session
   LISTEN lc_change;
   
   -- In another session
   UPDATE users SET balance = balance + 1 WHERE user_id = 'some_user';
   
   -- First session should receive notification
   ```

### Slow Queries

1. Check if indexes exist:
   ```sql
   SELECT indexname FROM pg_indexes WHERE tablename = 'users';
   ```

2. Analyze query plans:
   ```sql
   EXPLAIN ANALYZE 
   SELECT user_id, username, balance 
   FROM users 
   ORDER BY balance DESC 
   LIMIT 10;
   ```

3. Update table statistics:
   ```sql
   ANALYZE users;
   ```

## Future Enhancements

Potential improvements:

1. **WebSocket Dashboard**: Real-time metrics visualization
2. **Alert System**: Notifications when success rate drops
3. **Historical Metrics**: Store metrics in database for trends
4. **A/B Testing**: Compare trigger vs event-driven performance
5. **Caching Layer**: Redis cache for rankings to reduce DB load

## Summary

This implementation provides:
- ✅ PostgreSQL triggers for database-level change detection
- ✅ LISTEN/NOTIFY integration for real-time updates
- ✅ Comprehensive performance monitoring
- ✅ Enhanced error handling with contextual information
- ✅ Metrics tracking for system health monitoring
- ✅ Query optimization with composite indexes
- ✅ Dual-layer change detection (app + database)
- ✅ Automatic hourly metrics reporting

The system is now more robust, performant, and easier to monitor and debug.
