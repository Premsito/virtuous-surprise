# LC Dynamic Synchronization - Testing Guide

This guide shows how to verify the dynamic LC synchronization system is working correctly.

## Pre-requisites

1. Bot is running with database connected
2. Rankings channel is configured in config.json
3. At least one user with LC in the database

## Test Scenarios

### Test 1: Basic LC Change Event

**Action:** Run the event emitter test
```bash
node test-lc-events.js
```

**Expected Output:**
```
✅ Event received
✅ Event has correct structure
✅ All tests completed successfully!
```

### Test 2: Rankings Manager Initialization

**Action:** Run the rankings manager test
```bash
node test-rankings-manager.js
```

**Expected Output:**
```
✅ Rankings Manager initialized
📊 LC Change detected
⏰ Scheduling rankings update
✅ All Rankings Manager tests completed!
```

### Test 3: In-Game LC Change

**Steps:**
1. Note current rankings in the rankings channel
2. Play a game (e.g., `!roue 50 rouge`)
3. Wait 30 seconds to 2 minutes

**Expected Results:**
- Rankings channel automatically updates
- If user's position changed, notification appears
- Updated rankings show correct LC values

### Test 4: Admin LC Modification

**Steps:**
1. Admin runs `!setlc @user 5000`
2. Wait for dynamic update

**Expected Results:**
- Rankings update within 2 minutes
- User receives notification if position changed
- LC value matches what was set

### Test 5: Multiple Rapid Changes

**Steps:**
1. Multiple users play games quickly
2. Or single user plays multiple games

**Expected Results:**
- All changes batched into single update
- Update occurs after debounce period
- All notifications sent correctly

## Monitoring

### Console Logs to Watch For

**Successful Initialization:**
```
✅ Rankings channel cached: #rankings
✅ Rankings Manager initialized and listening for LC changes
✅ Dynamic LC rankings synchronization enabled
```

**LC Change Detection:**
```
📊 LC Change detected: User 123456789, 1000 -> 1100 (game_win)
⏰ Scheduling rankings update in 5000ms
```

**Dynamic Update:**
```
🔄 Triggering dynamic rankings update (3 users changed)
✅ Dynamic rankings update completed
```

**Scheduled Backup:**
```
🔄 Starting scheduled rankings update...
✅ Scheduled rankings update completed
```

## Verification Checklist

- [ ] Event emitter tests pass
- [ ] Rankings manager tests pass
- [ ] Bot starts without errors
- [ ] Rankings channel is cached
- [ ] LC changes trigger console logs
- [ ] Rankings update within 2 minutes of LC change
- [ ] Position change notifications appear
- [ ] 5-minute backup refresh still works
- [ ] No duplicate updates (debouncing works)
- [ ] Error handling works (try invalid channel ID)

## Troubleshooting

### Rankings not updating
- Check console for "Rankings Manager initialized"
- Verify rankings channel ID in config.json
- Check bot has permissions in channel
- Look for error messages in console

### Notifications not appearing
- Check if rankings channel is cached
- Verify user is in top 10 and position changed
- Check for notification error messages

### Too many updates
- Verify MIN_UPDATE_INTERVAL_MS is 30000
- Check debouncing logic is working
- Look for "Scheduling rankings update" logs

## Performance Metrics

**Expected Performance:**
- Event emission: < 1ms
- Database query: < 50ms
- Rankings update: < 2 seconds
- Total latency: 30s - 2min (debounced)

**Memory Usage:**
- Event emitter: Negligible
- Rankings manager: < 1MB
- Total overhead: Minimal

## Success Criteria

✅ All requirements met:
1. LC changes trigger events immediately
2. Rankings update within 2 minutes
3. Users notified of position changes
4. No mismatch between LC and rankings
5. System performs efficiently

## Notes

- First update may take up to 2 minutes (max debounce delay)
- Subsequent updates within same period are batched
- 5-minute backup runs independently
- Notifications only sent for top 10 position changes
