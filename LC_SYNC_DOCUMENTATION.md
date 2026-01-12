# Dynamic LC Synchronization System

This document describes the implementation of the dynamic LC (virtual currency) synchronization system that ensures real-time updates of rankings in the Virtuous Surprise Discord bot.

## Overview

The system consists of three main components:

1. **LC Event Emitter** - Centralized event system for LC changes
2. **Database Layer Integration** - Automatic event emission on balance updates
3. **Rankings Manager** - Smart update scheduler with debouncing and notifications

## Architecture

```
┌─────────────────────┐
│  Game Commands      │
│  (casino, jeu, etc) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Database Layer     │
│  db.updateBalance() │ ──────┐
│  db.setBalance()    │       │ Emits Events
│  db.transferLC()    │       │
└─────────────────────┘       │
                              ▼
                    ┌──────────────────┐
                    │ LC Event Emitter │
                    └────────┬─────────┘
                             │
                             │ Subscribes
                             ▼
                    ┌──────────────────┐
                    │ Rankings Manager │
                    │ - Debouncing     │
                    │ - Smart Updates  │
                    │ - Notifications  │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Rankings Channel │
                    │ (Auto-updated)   │
                    └──────────────────┘
```

## Components

### 1. LC Event Emitter (`utils/lcEventEmitter.js`)

A singleton EventEmitter that broadcasts LC change events across the application.

**Key Methods:**
- `emitLCChange(userId, oldBalance, newBalance, reason)` - Emit an LC change event
- `onLCChange(callback)` - Subscribe to LC changes
- `offLCChange(callback)` - Unsubscribe from LC changes

**Event Structure:**
```javascript
{
    userId: string,
    oldBalance: number,
    newBalance: number,
    change: number,        // newBalance - oldBalance
    reason: string,        // e.g., 'game_win', 'transfer', 'invite_reward'
    timestamp: number      // Unix timestamp in milliseconds
}
```

### 2. Database Layer Integration (`database/db.js`)

All balance-modifying database functions now emit LC change events:

**Modified Functions:**
- `updateBalance(userId, amount, reason)` - Add/subtract LC
- `setBalance(userId, amount, reason)` - Set absolute LC value
- `transferLC(fromUserId, toUserId, amount, description)` - Transfer between users

**LC Change Reasons:**
Each LC change has a categorized reason for better tracking:

- **Games:** `game_duel_win`, `game_duel_loss`, `game_roue_bet`, `game_roue_win`, etc.
- **Rewards:** `level_up`, `invite_reward`, `invite_joined`, `daily_gift`, `tresor_reward`
- **Transfers:** `transfer_sent`, `transfer_received`
- **Lottery:** `lottery_purchase`, `lottery_win`
- **Admin:** `admin_set`

### 3. Rankings Manager (`utils/rankingsManager.js`)

Manages dynamic rankings updates with intelligent debouncing and user notifications.

**Key Features:**

#### Smart Debouncing
- **Minimum interval:** 30 seconds between updates (prevents spam)
- **Maximum delay:** 2 minutes (ensures timely updates)
- **Batch processing:** Groups multiple LC changes into single update

#### Position Change Notifications
Automatically notifies users when their ranking position changes:
- 🎉 **Entered Top 10** - User joins the leaderboard
- 📈 **Position Improved** - User climbed in rankings
- 📉 **Position Dropped** - User fell in rankings
- 😢 **Left Top 10** - User dropped out of leaderboard

#### Update Flow
```
1. LC Change Event Received
   ↓
2. Add to Pending Updates Set
   ↓
3. Schedule Update (with debouncing)
   ↓
4. Fetch Current Rankings
   ↓
5. Update Rankings Channel
   ↓
6. Fetch New Rankings
   ↓
7. Compare & Send Notifications
   ↓
8. Clear Pending Updates
```

**Configuration:**
```javascript
MIN_UPDATE_INTERVAL_MS = 30000;   // 30 seconds
MAX_UPDATE_DELAY_MS = 120000;     // 2 minutes
```

## Integration with Bot

The rankings manager is initialized in `bot.js` during the bot ready event:

```javascript
// Initialize dynamic rankings manager
rankingsManager.initialize(client, rankingsCommand);

// 5-minute backup refresh still runs
setInterval(async () => {
    await rankingsCommand.updateRankingsChannel(client);
}, 5 * 60 * 1000);
```

## Usage Examples

### Example 1: Player Wins a Game

```javascript
// In casino.js
await db.updateBalance(playerId, winnings, 'game_roue_win');

// Triggers:
// 1. LC event emitted
// 2. Rankings manager detects change
// 3. Debounced update scheduled
// 4. Rankings refreshed (if enough time passed)
// 5. User notified if position changed
```

### Example 2: Admin Sets LC

```javascript
// In moderation.js
await db.setBalance(userId, amount, 'admin_set');

// Same flow as above
```

### Example 3: Multiple LC Changes

```javascript
// Multiple users win/lose in quick succession
await db.updateBalance(user1, 100, 'game_win');
await db.updateBalance(user2, -50, 'game_loss');
await db.updateBalance(user3, 25, 'invite_reward');

// All changes batched into single rankings update
// Notifications sent for all position changes
```

## Benefits

### 1. Real-Time Rankings
- Rankings update automatically when LC changes
- No manual refresh needed
- Accurate representation of current standings

### 2. Performance Optimized
- Smart debouncing prevents spam
- Batches multiple changes together
- Reduces unnecessary database queries

### 3. User Engagement
- Real-time notifications keep users informed
- Gamification through position tracking
- Immediate feedback on LC changes

### 4. Reliability
- Event-driven architecture (loose coupling)
- 5-minute backup refresh (failsafe)
- Graceful error handling

## Testing

Two test files verify the system:

### `test-lc-events.js`
Tests the LC Event Emitter:
- Event emission and reception
- Multiple subscribers
- Unsubscribe functionality

### `test-rankings-manager.js`
Tests the Rankings Manager:
- Initialization
- LC change detection
- Debouncing mechanism
- Cleanup functionality

**Run tests:**
```bash
node test-lc-events.js
node test-rankings-manager.js
```

## Monitoring

The system includes comprehensive logging:

```
📊 LC Change detected: User user-123, 1000 -> 1100 (game_win)
⏰ Scheduling rankings update in 5000ms
🔄 Triggering dynamic rankings update (3 users changed)
✅ Dynamic rankings update completed
```

## Configuration

Key settings in `config.json`:

```json
{
  "channels": {
    "rankings": "1460012957458235618"
  }
}
```

## Future Enhancements

Potential improvements:
1. Add more granular reason categories
2. Track historical ranking changes
3. Add weekly/monthly ranking snapshots
4. Implement ranking change analytics
5. Add configurable notification thresholds

## Troubleshooting

### Rankings not updating
1. Check rankings channel ID in `config.json`
2. Verify bot has send/embed permissions
3. Check console for error messages
4. Ensure 5-minute backup is running

### Too many notifications
- Adjust `MIN_UPDATE_INTERVAL_MS` to reduce frequency
- Increase debounce delay in `scheduleUpdate()`

### Delayed updates
- Check `MAX_UPDATE_DELAY_MS` setting
- Verify database performance
- Check for network issues

## Conclusion

The dynamic LC synchronization system provides a robust, real-time solution for keeping rankings accurate and users informed. Through event-driven architecture, smart debouncing, and automatic notifications, it ensures that the leaderboard always reflects the current state of the game while maintaining optimal performance.
