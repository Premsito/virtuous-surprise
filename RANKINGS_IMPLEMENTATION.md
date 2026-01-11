# Rankings System with Podiums Implementation

## Overview
This implementation adds a comprehensive ranking system to display the top users for both LC (virtual currency) and Levels. The system includes podium displays for the top 3 users and complete rankings tables showing the top 10 users in each category.

## Features

### 1. Podium Displays
- **LC Podium**: Shows the top 3 users by LC balance with medals (🥇, 🥈, 🥉)
- **Levels Podium**: Shows the top 3 users by level with medals (🥇, 🥈, 🥉)
- **Profile Pictures (Variable Sizes)**: 
  - 🥇 1st place: 128px - Displayed as the main thumbnail (top-right)
  - 🥈 2nd place: 96px - Displayed as the embed image (below description)
  - 🥉 3rd place: 64px - Displayed as author icon (top-left)

### 2. Rankings Tables
- **LC Rankings**: Side-by-side table showing top 10 users by LC balance
- **Levels Rankings**: Side-by-side table showing top 10 users by level
- Both tables display:
  - Medals for top 3 (🥇, 🥈, 🥉)
  - Numbered positions for ranks 4-10
  - Username and corresponding value (LC or Level)

### 3. Auto-Refresh Mechanism
- Rankings automatically update every **5 minutes**
- Updates are posted in the configured rankings channel: `#1460012957458235618`
- Initial rankings are displayed 5 seconds after bot startup
- Previous messages in the channel are cleared before posting new rankings
- Comprehensive debug logging for troubleshooting

## Commands

### Admin Command
```
!rankings
!classement
```
Both commands manually trigger a rankings display in the current channel. **This command is restricted to administrators only** for security and spam prevention.

**Permission Check:**
- Only users specified in `utils/adminHelper.js` can execute this command
- Non-admin users receive an error message: "Cette commande est réservée aux administrateurs."
- All command executions are logged with user information for audit purposes

**Fallback Behavior:**
- If no ranking data is available, the command responds with: "Aucune donnée de classement disponible pour le moment."
- The command message is automatically deleted to keep the channel clean (admin commands only)

### Auto-Refresh Feature
The auto-refresh feature posts directly to the configured channel ID in `config.json` under `channels.rankings` and does not require manual intervention.

## Technical Implementation

### Database Functions
Added to `database/db.js`:

```javascript
async getTopLC(limit = 10)
```
- Returns top users sorted by LC balance (descending)
- Returns: `{ user_id, username, balance }`

```javascript
async getTopLevels(limit = 10)
```
- Already existed, returns top users sorted by level and XP
- Returns: `{ user_id, username, level, xp }`

### Ranking Command Structure
Located in `commands/rankings.js`:

#### Main Functions:

1. **execute(message, args)**
   - Handles manual command invocation
   - **Checks admin permissions using `isAdmin()` helper**
   - Logs all command attempts with user information
   - Returns error message for non-admin users
   - Deletes the command message for cleanliness (admin only)

2. **displayRankings(channel)**
   - Core function that creates and sends all ranking embeds
   - Fetches top users from database
   - **Checks for empty data and sends fallback message if needed**
   - Creates 4 embeds: LC Podium, Levels Podium, LC Table, Levels Table

3. **createPodiumEmbed(client, topUsers, type, title, color, valueFormatter)**
   - Creates a podium display for top 3 users
   - Fetches Discord user avatars
   - Sets 1st place avatar as thumbnail
   - Formats medals and values using the valueFormatter

4. **createRankingsTableEmbed(topUsers, title, color, valueFormatter)**
   - Creates a rankings table for top 10 users
   - Assigns medals to top 3
   - Numbers remaining positions
   - Uses valueFormatter to display appropriate values

5. **updateRankingsChannel(client)**
   - Fetches the configured rankings channel
   - Clears old messages (bulk delete or individual)
   - Displays fresh rankings
   - Called by auto-refresh interval

### Bot Integration
Modified `bot.js`:

1. **Command Registration**
   - Added `rankingsCommand` to imports
   - Registered command in commands collection
   - Added command handlers for `!rankings` and `!classement`

2. **Auto-Refresh Setup**
   - Interval set for 5 minutes (300,000 ms)
   - Initial update triggered 5 seconds after bot ready
   - Error throttling to prevent log spam
   - Comprehensive debug logging for troubleshooting
   
3. **Enhanced Logging**
   - Channel verification and permission checks
   - User avatar fetching logs
   - Embed creation progress logs
   - Discord API error details (error codes, HTTP status)
   - Stack trace logging for debugging

3. **Configuration**
   - Added `rankings` channel ID to `config.json`

### Configuration
Added to `config.json`:

```json
"channels": {
  "inviteTracker": "1455345486071463936",
  "lotteryAnnouncement": "1455345486071463936",
  "levelUpNotification": "1459283080576766044",
  "rankings": "1460012957458235618"
}
```

## Display Format

### Example LC Podium:
```
💰 Podium LC

🥇 User1
└─ 4200 LC

🥈 User2
└─ 3800 LC

🥉 User3
└─ 3600 LC
```

### Example Levels Podium:
```
⭐ Podium Niveaux

🥇 UserAlpha
└─ Niveau 15

🥈 UserBeta
└─ Niveau 12

🥉 UserGamma
└─ Niveau 10
```

### Example LC Rankings Table:
```
📊 Classement LC - Top 10

🥇 **User1** → 4200 LC
🥈 **User2** → 3800 LC
🥉 **User3** → 3600 LC
4. **User4** → 3200 LC
5. **User5** → 3000 LC
6. **User6** → 2800 LC
7. **User7** → 2500 LC
8. **User8** → 2200 LC
9. **User9** → 2000 LC
10. **User10** → 1800 LC
```

### Example Levels Rankings Table:
```
🏆 Classement Niveaux - Top 10

🥇 **UserAlpha** → Niveau 15
🥈 **UserBeta** → Niveau 12
🥉 **UserGamma** → Niveau 10
4. **UserDelta** → Niveau 9
5. **UserTheta** → Niveau 8
6. **UserEpsilon** → Niveau 7
7. **UserZeta** → Niveau 6
8. **UserEta** → Niveau 5
9. **UserKappa** → Niveau 4
10. **UserLambda** → Niveau 3
```

## Error Handling

1. **Permission Denied**: Non-admin users attempting to run the command receive a clear error message
2. **No Data Available**: If both LC and Levels rankings are empty, displays a user-friendly fallback message
3. **Database Errors**: Caught and logged, prevents bot crashes
4. **Discord API Errors**: 
   - User fetch failures handled gracefully
   - Falls back to stored username if user can't be fetched
   - Logs error codes and HTTP status for debugging
5. **Channel Errors**: Logged with channel ID and user information for debugging
6. **Message Deletion Errors**: Silently caught (permissions issue)
7. **Error Throttling**: Prevents log spam for recurring errors
8. **Permission Verification**: 
   - Checks for ViewChannel, SendMessages, EmbedLinks, ManageMessages
   - Logs missing permissions with clear error messages

## Debug Logs

The bot now includes comprehensive debug logging for rankings updates:

### Bot Startup Logs
```
🎯 Displaying initial rankings...
✅ Initial rankings displayed successfully
```

### Scheduled Update Logs
```
🔄 Starting scheduled rankings update...
✅ Scheduled rankings update completed
```

### Rankings Channel Logs
```
🔍 Attempting to update rankings in channel: 1460012957458235618
📡 Fetching channel 1460012957458235618...
✅ Channel fetched successfully: #rankings
✅ Bot has all required permissions (View, Send, Embed, Manage)
🧹 Cleaning old messages from rankings channel...
   - Found 12 messages to clean
   ✅ Bulk deleted 12 messages
```

### Rankings Display Logs
```
📊 Rankings command called by Username (123456789)
   ✅ Permission granted - displaying rankings
📊 Fetching rankings data for channel: 1460012957458235618
   - Fetched 10 LC rankings
   - Fetched 10 level rankings
💰 Creating LC Podium embed...
   ✓ Fetched user Username1 (🥇) for podium
   🖼️ Set 1st place avatar: Username1 (128px thumbnail)
   ✓ Fetched user Username2 (🥈) for podium
   🖼️ Set 2nd place avatar: Username2 (96px image)
   ✓ Fetched user Username3 (🥉) for podium
   🖼️ Set 3rd place avatar: Username3 (64px author icon)
⭐ Creating Levels Podium embed...
📊 Creating LC Rankings table...
🏆 Creating Levels Rankings table...
📤 Sending LC podium embed...
📤 Sending Levels podium embed...
📤 Sending rankings tables (side by side)...
✅ All rankings embeds sent successfully
   ✅ Rankings command completed successfully
✅ Rankings successfully updated in channel #rankings (1460012957458235618)
```

### Permission Denied Logs
```
📊 Rankings command called by RegularUser (987654321)
   ❌ Permission denied - user is not an admin
```

### No Data Available Logs
```
📊 Fetching rankings data for channel: 1460012957458235618
   - Fetched 0 LC rankings
   - Fetched 0 level rankings
   ⚠️ No ranking data available
```

### Error Logs
```
❌ Error updating rankings channel: <error message>
   Channel ID: 1460012957458235618
   Discord API Error Code: 50001
   HTTP Status: 403
   Stack: <stack trace>
```

### Permission Error Example
```
❌ Missing required permissions in channel 1460012957458235618:
   - SendMessages
   - EmbedLinks
```

## Testing

Run the test suites:
```bash
# Test command structure and embed creation
node test-rankings.js

# Test admin permission checking
node test-rankings-permissions.js
```

**Structure Test** verifies:
- Command structure and required functions
- Embed creation with mock data
- Medal assignment logic
- Description formatting

**Permission Test** verifies:
- Admin user identification
- Permission checking in execute function
- Non-admin user rejection
- Appropriate error messages

## Future Enhancements

Potential improvements:
1. Add filtering by time period (weekly, monthly rankings)
2. Include user avatars in rankings table (not just podium)
3. Add personal ranking position display
4. Create combined rankings (LC + Levels weighted score)
5. Add visual progress bars in rankings
6. Include statistics (gains/losses since last update)

## Maintenance

### Changing Update Frequency
Modify the interval in `bot.js`:
```javascript
setInterval(async () => {
    await rankingsCommand.updateRankingsChannel(client);
}, 5 * 60 * 1000); // Change this value (in milliseconds)
// Current: 5 minutes (300,000 ms)
```

### Changing Rankings Channel
Update `config.json`:
```json
"channels": {
  "rankings": "YOUR_CHANNEL_ID_HERE"
}
```

### Adjusting Number of Displayed Users
Change the limit in `displayRankings()`:
```javascript
const topLC = await db.getTopLC(20); // Show top 20 instead of 10
const topLevels = await db.getTopLevels(20);
```

## File Changes Summary

### New Files:
- `commands/rankings.js` - Main rankings command implementation
- `test-rankings.js` - Test suite for rankings functionality
- `test-rankings-permissions.js` - Test suite for admin permission checking
- `RANKINGS_IMPLEMENTATION.md` - This documentation

### Modified Files:
- `bot.js` - Added command registration and auto-refresh
- `config.json` - Added rankings channel configuration
- `database/db.js` - Added `getTopLC()` function

## Performance Considerations

- Database queries are optimized with `ORDER BY` and `LIMIT`
- Profile pictures are fetched asynchronously
- Old messages are bulk deleted when possible (faster)
- Errors are throttled to prevent log flooding
- No caching of rankings data (always fresh from database)

## Security

- **Admin-only command execution** prevents spam and unauthorized use
- Command execution logged with user information for audit trail
- No sensitive data exposed in rankings
- User IDs used internally but not displayed
- Command deletion prevents message spam (admin only)
- Channel clearing requires proper bot permissions
- Fallback messages prevent confusion when data is unavailable
