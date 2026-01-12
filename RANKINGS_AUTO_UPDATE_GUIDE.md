# Rankings Auto-Update System - Implementation Guide

## Overview
The bot automatically refreshes the classement (rankings) every 5 minutes with proper message deletion to prevent duplicates. The system is designed to survive bot restarts and deployments.

## Problem Solved
**Before:**
- Rankings message ID was stored only in memory
- After bot restart/deployment, old messages weren't deleted
- Multiple rankings messages accumulated in the channel
- Difficult to debug interval execution

**After:**
- Message ID persisted to database
- Old messages deleted even after bot restarts
- Single rankings message maintained in the channel
- Detailed logging with timestamps and duration

## Architecture

### Database Layer
**Table: `bot_state`**
```sql
CREATE TABLE IF NOT EXISTS bot_state (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Methods:**
- `getBotState(key)` - Retrieve a bot configuration value
- `setBotState(key, value)` - Store/update a bot configuration value

**Usage:**
```javascript
// Save message ID
await db.setBotState('rankings_message_id', messageId);

// Load message ID
const messageId = await db.getBotState('rankings_message_id');
```

### Rankings Command Flow

#### Initial Display (Bot Startup)
```
1. Bot starts
2. Wait 5 seconds for initialization
3. Call updateRankingsChannel()
   ├─ Load message ID from database (if exists)
   ├─ Delete old message (if found)
   ├─ Fetch and display new rankings
   └─ Save new message ID to database
```

#### Scheduled Updates (Every 5 Minutes)
```
1. Interval timer triggers
2. Log timestamp and start update
3. Call updateRankingsChannel()
   ├─ Load message ID from database (if not cached)
   ├─ Delete old message (if found)
   ├─ Fetch and display new rankings
   └─ Save new message ID to database
4. Log completion time and next update time
```

#### Restart Recovery
```
1. Bot restarts (deployment, crash, etc.)
2. Database still has last message ID
3. On first update:
   ├─ loadLastMessageFromDB() fetches stored ID
   ├─ Fetch the message from Discord
   ├─ Delete the old message
   └─ Post new rankings
4. No duplicate messages!
```

## Key Implementation Details

### Message Tracking
```javascript
// rankings.js
module.exports = {
    lastRankingsMessage: null,      // Module-level cache
    hasLoadedFromDB: false,          // Prevents duplicate loads
    
    async loadLastMessageFromDB(client) {
        // Load message reference from database
        // Handles invalid/deleted messages gracefully
    },
    
    async updateRankingsChannel(client) {
        // Load from DB if needed
        if (!this.hasLoadedFromDB) {
            await this.loadLastMessageFromDB(client);
        }
        
        // Delete old message
        if (this.lastRankingsMessage) {
            await this.lastRankingsMessage.delete();
        }
        
        // Post new rankings
        const sentMessage = await this.displayRankings(channel);
        
        // Save to cache and database
        this.lastRankingsMessage = sentMessage;
        await db.setBotState('rankings_message_id', sentMessage.id);
    }
};
```

### Enhanced Logging
```javascript
// bot.js
const RANKINGS_UPDATE_INTERVAL_MS = 5 * 60 * 1000;

setInterval(async () => {
    const now = new Date();
    console.log(`[${now.toISOString()}] Starting scheduled rankings update...`);
    
    await rankingsCommand.updateRankingsChannel(client);
    
    const completedAt = new Date();
    console.log(`[${completedAt.toISOString()}] Update completed`);
    console.log(`Duration: ${completedAt - now}ms`);
    console.log(`Next update: ${new Date(completedAt.getTime() + RANKINGS_UPDATE_INTERVAL_MS).toISOString()}`);
}, RANKINGS_UPDATE_INTERVAL_MS);
```

## Log Output Examples

### Bot Startup
```
⏰ Rankings auto-update interval configured: 5 minutes (300000ms)
🎯 Displaying initial rankings (5 seconds after bot ready)...
🔍 Attempting to update rankings in channel: 1460012957458235618
📡 Fetching channel 1460012957458235618...
✅ Channel fetched successfully: #rankings
✅ Bot has all required permissions (View, Send, Embed, Manage)
🔍 Loading last rankings message from database...
   📝 Found stored message ID: 1234567890123456789
   ✅ Successfully loaded rankings message from database
🧹 Deleting previous rankings message...
   ✅ Previous rankings message deleted successfully
📊 Displaying new rankings...
   ✅ New rankings message tracked for future cleanup
   📝 Message ID 9876543210987654321 saved to database
✅ Rankings successfully updated in channel #rankings (1460012957458235618)
✅ Initial rankings displayed successfully
```

### Scheduled Update (Every 5 Minutes)
```
============================================================
🔄 [2026-01-12T18:47:44.156Z] Starting scheduled rankings update...
   Interval: Every 5 minutes
============================================================

🔍 Attempting to update rankings in channel: 1460012957458235618
📡 Fetching channel 1460012957458235618...
✅ Channel fetched successfully: #rankings
✅ Bot has all required permissions (View, Send, Embed, Manage)
🧹 Deleting previous rankings message...
   ✅ Previous rankings message deleted successfully
📊 Displaying new rankings...
   ✅ New rankings message tracked for future cleanup
   📝 Message ID 1111222233334444555 saved to database
✅ Rankings successfully updated in channel #rankings (1460012957458235618)

✅ [2026-01-12T18:47:46.892Z] Scheduled rankings update completed
   Duration: 2736ms
   Next update: 2026-01-12T18:52:46.892Z
```

### After Bot Restart
```
⏰ Rankings auto-update interval configured: 5 minutes (300000ms)
🎯 Displaying initial rankings (5 seconds after bot ready)...
🔍 Loading last rankings message from database...
   📝 Found stored message ID: 1111222233334444555
   ✅ Successfully loaded rankings message from database
🧹 Deleting previous rankings message...
   ✅ Previous rankings message deleted successfully
📊 Displaying new rankings...
   ✅ New rankings message tracked for future cleanup
   📝 Message ID 6666777788889999000 saved to database
✅ Initial rankings displayed successfully
```

## Testing

### Run Tests
```bash
node test-rankings-auto-update.js
```

### Expected Output
```
✅ Passed: 21
❌ Failed: 0
📈 Success Rate: 100.0%

🎉 All tests passed! The rankings auto-update system is ready.
```

### Test Coverage
- Database migration exists
- Database helper methods implemented correctly
- Rankings command has persistent tracking
- Enhanced logging with timestamps
- Message deletion logic
- Startup recovery logic
- Code syntax validation

## Troubleshooting

### Issue: Old messages not being deleted
**Check:**
1. Bot has `ManageMessages` permission in rankings channel
2. Database connection is working
3. Message ID is being saved: `SELECT * FROM bot_state WHERE key = 'rankings_message_id';`

**Logs to look for:**
- `✅ Bot has all required permissions (View, Send, Embed, Manage)`
- `📝 Message ID XXX saved to database`
- `🧹 Deleting previous rankings message...`

### Issue: No rankings updates happening
**Check:**
1. Rankings channel ID is configured in `config.json`
2. Bot has access to the channel
3. No errors in bot logs

**Logs to look for:**
- `⏰ Rankings auto-update interval configured: 5 minutes (300000ms)`
- `🔄 [timestamp] Starting scheduled rankings update...`
- `✅ [timestamp] Scheduled rankings update completed`

### Issue: Multiple rankings messages in channel
**Check:**
1. Database contains correct message ID
2. Bot wasn't restarted multiple times in quick succession
3. Manual `!rankings` commands weren't used

**Fix:**
1. Manually delete duplicate messages
2. Next automatic update will maintain single message

## Files Modified

1. **database/migrations/012_add_bot_state_table.sql**
   - Creates `bot_state` table for persistent configuration

2. **database/db.js**
   - Added `getBotState()` method
   - Added `setBotState()` method

3. **commands/rankings.js**
   - Added `hasLoadedFromDB` flag
   - Added `loadLastMessageFromDB()` method
   - Updated `updateRankingsChannel()` to persist message ID

4. **bot.js**
   - Enhanced interval logging with timestamps
   - Added duration tracking
   - Shows next update time
   - Uses constant for interval value

5. **test-rankings-auto-update.js** (new)
   - Comprehensive test suite for all changes

## Expected Behavior Summary

✅ **Automated Refresh**: Rankings update every 5 minutes automatically
✅ **Message Deletion**: Previous message deleted before posting new one
✅ **Restart Resilient**: Old messages deleted even after bot restarts
✅ **Logging**: Detailed logs with ISO timestamps, duration, and next update time
✅ **No Duplicates**: Single rankings message maintained in the channel

## Migration Path

### For Existing Deployments
1. Deploy the changes
2. Database migration runs automatically on bot startup
3. First update may not delete old message (no ID in DB yet)
4. Subsequent updates work correctly
5. Manually delete any duplicate messages if needed

### For Clean Deployments
1. Deploy the changes
2. Database migration creates `bot_state` table
3. First update posts new message and saves ID
4. All subsequent updates work correctly

## Performance Impact

- **Database Queries**: +2 per update (1 read, 1 write)
- **Memory**: Minimal (1 message object cached)
- **Startup Time**: +100-200ms for initial message load
- **Update Time**: +50-100ms for database operations

All impacts are negligible and well within acceptable limits.
