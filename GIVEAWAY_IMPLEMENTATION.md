# Giveaway System Implementation

## Overview
This implementation adds a comprehensive giveaway system to the Discord bot using `!` commands instead of slash commands. The system allows administrators to create and manage giveaways with automatic winner selection.

## Features

### 1. Create Giveaways
Administrators can create giveaways with customizable parameters:
- **Command**: `!giveaway créer [titre] [objet] [durée] [gagnants] [quantité]`
- **Example**: `!giveaway créer Nitro "Nitro 🎁" 10 1 1`

**Parameters:**
- `titre`: Unique identifier for the giveaway (e.g., "Nitro")
- `objet`: Description of the reward (e.g., "Nitro 🎁")
- `durée`: Duration in minutes
- `gagnants`: Number of winners to select
- `quantité`: Quantity of items per winner

### 2. End Giveaways
Administrators can manually end active giveaways:
- **Command**: `!giveaway terminer [titre]`
- **Example**: `!giveaway terminer Nitro`

### 3. Participation
Users participate by clicking the "🎯 Participer" button on the giveaway announcement.

## Announcement Embed

The system creates a visually appealing embed with:
```
🎉 GIVEAWAY 🎁
🌟 Récompense : Nitro 🎁 x1
🏆 Nombre de gagnants : 1
👥 Participants : 0

⏲️ Fin dans : 10 minutes
📢 Cliquez sur Participer pour tenter votre chance !
```

### Dynamic Updates
- Participant count updates in real-time when users join
- Timer shows remaining time

## Results Announcement

When a giveaway ends (automatically or manually), the system:

1. Updates the embed to show results:
```
🎉 GIVEAWAY TERMINÉ 🎉
🌟 Récompense : Nitro 🎁 x1
🏆 Gagnant : @User123
👥 Participants : 12
```

2. Sends a congratulations message mentioning all winners
3. Disables the participation button

## Database Schema

### Giveaways Table
- `id`: Primary key
- `title`: Giveaway identifier
- `reward`: Reward description
- `duration`: Duration in minutes
- `winners_count`: Number of winners
- `quantity`: Items per winner
- `channel_id`: Channel where giveaway was posted
- `message_id`: Discord message ID
- `end_time`: When the giveaway ends
- `status`: 'active' or 'ended'
- `created_by`: Admin who created it

### Giveaway Participants Table
- `id`: Primary key
- `giveaway_id`: Foreign key to giveaways
- `user_id`: Discord user ID
- `joined_at`: Timestamp of participation
- Unique constraint prevents duplicate entries

## Implementation Files

### New Files
1. `commands/giveaway.js` - Main command implementation
2. `database/migrations/009_add_giveaway_tables.sql` - Database schema
3. `test-giveaway.js` - Structure tests
4. `test-giveaway-integration.js` - Integration tests

### Modified Files
1. `bot.js` - Command registration and button interaction handler
2. `database/db.js` - Database helper functions
3. `responses.json` - Response strings

## Database Functions

The following functions were added to `database/db.js`:

- `createGiveaway(title, reward, duration, winnersCount, quantity, channelId, createdBy)`
- `updateGiveawayMessage(giveawayId, messageId)`
- `getGiveaway(giveawayId)`
- `getGiveawayByTitle(title, createdBy)`
- `getActiveGiveaways()`
- `endGiveaway(giveawayId)`
- `joinGiveaway(giveawayId, userId)`
- `getGiveawayParticipants(giveawayId)`
- `getGiveawayParticipantCount(giveawayId)`
- `hasJoinedGiveaway(giveawayId, userId)`

## Features

### Automatic Ending
- Giveaways automatically end after the specified duration
- Timer-based system schedules the end event
- Winners are randomly selected from participants

### Manual Ending
- Admins can end giveaways early using `!giveaway terminer`
- Useful for stopping giveaways or fixing issues

### Duplicate Prevention
- Database constraint prevents users from joining twice
- Graceful error handling shows friendly message

### Admin-Only Access
- Only users with admin permissions can create/end giveaways
- Uses the existing `isAdmin()` helper function

## Testing

Run the included tests to verify the implementation:
```bash
node test-giveaway.js
node test-giveaway-integration.js
```

Both test files verify:
- Command structure
- Database functions
- Response integration
- Discord.js components
- Bot.js integration

## Benefits

1. **Consistent with Bot's Design**: Uses `!` prefix like all other commands
2. **User-Friendly**: Simple button-based participation
3. **Visual Appeal**: Attractive embeds with emojis
4. **Automatic Management**: Timer-based ending reduces manual work
5. **Scalable**: Supports multiple concurrent giveaways
6. **Reliable**: Database-backed with proper constraints

## Example Usage Flow

1. Admin creates giveaway:
   ```
   !giveaway créer Nitro "Nitro 🎁" 10 1 1
   ```

2. Bot posts announcement with button

3. Users click "🎯 Participer" to join

4. Participant count updates in real-time

5. After 10 minutes (or manual end):
   - Embed updates with winner
   - Winners are mentioned
   - Button is disabled

6. Clean, simple results display
