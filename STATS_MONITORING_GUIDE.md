# Stats Tracking Monitoring Guide

## Overview
This guide explains how to monitor the stats tracking system in the Discord bot to ensure that message counts, voice time, and other statistics are being tracked and updated correctly.

## Logging Tags

The bot uses two main logging tags for stats tracking:

- **[Stats]**: Logs related to tracking statistics (messages, voice time, invitations)
- **[XP]**: Logs related to XP grants (messages, voice, reactions)

## Message Tracking

### How It Works
- Messages are tracked in the `messageCreate` event
- Counts are cached and batched to reduce database load (updates every 10 messages)
- Cache is flushed on bot shutdown to prevent data loss

### Logs to Monitor

1. **Message Detection**
   ```
   [Stats] Detected message from {username}. Processing...
   ```
   - Appears for every message sent by a non-bot user
   - Confirms the message was received by the tracking system

2. **Message Count Update**
   ```
   [Stats] Updated message count for {username}: {count} (batched +{batchSize})
   ```
   - Appears every 10 messages (batched)
   - Shows the new total message count for the user
   - Indicates how many messages were batched in this update

### Testing Message Tracking
1. Send messages in a Discord channel
2. Watch for the detection log for each message
3. After 10 messages, verify the update log appears with the correct count
4. Use `!stats` or `!stats @user` to verify the count is accurate

## Voice Time Tracking

### How It Works
- Voice time is tracked when users join and leave voice channels
- Time is calculated as seconds spent in voice channels
- Updates occur when users leave voice channels
- Voice XP sessions track additional metrics every 2 minutes

### Logs to Monitor

1. **Voice Channel Join**
   ```
   [Stats] User {username} joined voice channel. Starting time tracking.
   ```
   - Appears when a user joins any voice channel
   - Confirms voice tracking session has started

2. **Voice Channel Leave**
   ```
   [Stats] Updated voice time for {username}. New total: {seconds} seconds.
   ```
   - Appears when a user leaves a voice channel
   - Shows the new total voice time in seconds
   - Only appears if user spent at least 1 second in voice

3. **Voice Activity Session**
   ```
   [Stats] Voice activity tracked for {username}. Session time: {minutes} minutes.
   ```
   - Appears every 2 minutes while user is in voice
   - Part of the XP grant system
   - Shows ongoing session duration

### Testing Voice Time Tracking
1. Join a voice channel
2. Watch for the join log
3. Wait a few seconds (or minutes for session tracking)
4. Leave the voice channel
5. Verify the leave log shows the correct time in seconds
6. Use `!stats` to verify the voice time is displayed correctly

## XP Tracking Logs

In addition to stats tracking, the bot logs XP grants:

1. **Message XP**
   ```
   [XP] Message XP granted to {username}: +{xp} XP ({oldXP} -> {newXP}, Level {oldLevel} -> {newLevel})
   ```

2. **Voice XP**
   ```
   [XP] Voice XP granted to {username}: +{xp} XP ({oldXP} -> {newXP}, Level {oldLevel} -> {newLevel})
   ```

3. **Reaction XP**
   ```
   [XP] Reaction XP granted to {username}: +{xp} XP ({oldXP} -> {newXP}, Level {oldLevel} -> {newLevel})
   ```

## Using the !stats Command

The `!stats` command displays all tracked statistics for a user:

### Command Usage
- `!stats` - Show your own stats
- `!stats @user` - Show stats for mentioned user

### Displayed Information
- 💰 Balance (LC)
- 🤝 Invitations
- 📩 Messages (tracked count)
- 🎙️ Temps vocal (voice time in hours/minutes)
- 📅 Join date or account creation date
- 🎮 Games played
- 🎉 Games won

### Voice Time Format
- `0m` - Less than 1 minute
- `5m` - 5 minutes
- `1h 0m` - 1 hour
- `2h 10m` - 2 hours and 10 minutes

## Troubleshooting

### Message counts not updating
1. Check for `[Stats] Detected message from` logs
2. Verify messages are being sent (not by bots)
3. Check if batching is working (should update every 10 messages)
4. Check database connectivity

### Voice time not updating
1. Check for `[Stats] User X joined voice channel` log
2. Verify user spent at least 1 second in voice
3. Check for `[Stats] Updated voice time` log when leaving
4. Verify the user is not a bot
5. Check database connectivity

### Missing logs
1. Check log level configuration
2. Verify the bot has proper event listeners registered
3. Check for error messages in logs
4. Verify the bot has required intents (GuildMessages, MessageContent, GuildVoiceStates)

## Best Practices

1. **Regular Monitoring**
   - Monitor logs during peak activity times
   - Look for patterns in stats updates
   - Verify updates are timely and accurate

2. **Testing After Changes**
   - Always test message and voice tracking after code changes
   - Run `node test-message-tracking.js` to verify message tracking
   - Run `node test-vocal-time.js` to verify voice time formatting
   - Run `node test-stats-logging.js` to verify all logging is present

3. **Database Verification**
   - Periodically query the database to verify stats match expected values
   - Check for any anomalies or data inconsistencies
   - Monitor database performance for slow queries

## Performance Considerations

### Message Count Batching
- Reduces database writes by 90% (from every message to every 10 messages)
- Cache is flushed on shutdown to prevent data loss
- Trade-off: Stats may be up to 9 messages behind in real-time

### Voice Time Tracking
- Minimal overhead - only tracks join/leave times
- No polling required for basic time tracking
- Voice XP sessions add periodic checks every 2 minutes

## Log Examples

### Successful Message Tracking Flow
```
[Stats] Detected message from User123. Processing...
[Stats] Detected message from User123. Processing...
... (8 more messages)
[Stats] Updated message count for User123: 50 (batched +10)
```

### Successful Voice Tracking Flow
```
[Stats] User Alice joined voice channel. Starting time tracking.
... (2 minutes later)
[Stats] Voice activity tracked for Alice. Session time: 2 minutes.
[XP] Voice XP granted to Alice: +15 XP (100 -> 115, Level 2 -> 2)
... (user leaves)
[Stats] Updated voice time for Alice. New total: 180 seconds.
```

## Related Files

- `/home/runner/work/virtuous-surprise/virtuous-surprise/bot.js` - Main bot file with event listeners
- `/home/runner/work/virtuous-surprise/virtuous-surprise/commands/stats.js` - Stats command implementation
- `/home/runner/work/virtuous-surprise/virtuous-surprise/database/db.js` - Database operations
- `/home/runner/work/virtuous-surprise/virtuous-surprise/test-message-tracking.js` - Message tracking tests
- `/home/runner/work/virtuous-surprise/virtuous-surprise/test-vocal-time.js` - Voice time tests
- `/home/runner/work/virtuous-surprise/virtuous-surprise/test-stats-logging.js` - Logging verification tests
