# Rankings System with Podiums Implementation

## Overview
This implementation adds a comprehensive ranking system to display the top users for both LC (virtual currency) and Levels. The system includes podium displays for the top 3 users and complete rankings tables showing the top 10 users in each category.

## Features

### 1. Podium Displays
- **LC Podium**: Shows the top 3 users by LC balance with medals (🥇, 🥈, 🥉)
- **Levels Podium**: Shows the top 3 users by level with medals (🥇, 🥈, 🥉)
- **Profile Pictures**: 
  - 🥇 1st place: Displayed as the main thumbnail (largest)
  - 🥈 2nd place: Listed with medal in description
  - 🥉 3rd place: Listed with medal in description

### 2. Rankings Tables
- **LC Rankings**: Side-by-side table showing top 10 users by LC balance
- **Levels Rankings**: Side-by-side table showing top 10 users by level
- Both tables display:
  - Medals for top 3 (🥇, 🥈, 🥉)
  - Numbered positions for ranks 4-10
  - Username and corresponding value (LC or Level)

### 3. Auto-Refresh Mechanism
- Rankings automatically update every **15 minutes**
- Updates are posted in the configured rankings channel: `#1460012957458235618`
- Initial rankings are displayed 5 seconds after bot startup
- Previous messages in the channel are cleared before posting new rankings

## Commands

### User Command
```
!rankings
!classement
```
Both commands manually trigger a rankings display in the current channel. The command message is automatically deleted to keep the channel clean.

### Admin Note
The auto-refresh feature posts directly to the configured channel ID in `config.json` under `channels.rankings`.

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
   - Deletes the command message for cleanliness

2. **displayRankings(channel)**
   - Core function that creates and sends all ranking embeds
   - Fetches top users from database
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
   - Interval set for 15 minutes (900,000 ms)
   - Initial update triggered 5 seconds after bot ready
   - Error throttling to prevent log spam

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

1. **Database Errors**: Caught and logged, prevents bot crashes
2. **Discord API Errors**: 
   - User fetch failures handled gracefully
   - Falls back to stored username if user can't be fetched
3. **Channel Errors**: Logged with channel ID for debugging
4. **Message Deletion Errors**: Silently caught (permissions issue)
5. **Error Throttling**: Prevents log spam for recurring errors

## Testing

Run the test suite:
```bash
node test-rankings.js
```

This test verifies:
- Command structure and required functions
- Embed creation with mock data
- Medal assignment logic
- Description formatting

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
}, 15 * 60 * 1000); // Change this value (in milliseconds)
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

- No sensitive data exposed in rankings
- User IDs used internally but not displayed
- Command deletion prevents message spam
- Channel clearing requires proper bot permissions
