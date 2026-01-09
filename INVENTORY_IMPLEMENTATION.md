# Bonus LC Items System Implementation

This document describes the implementation of the bonus LC items system for managing **Jackpots** and **Multipliers** in the virtuous-surprise Discord bot.

## Overview

The system provides:
- **Inventory Management**: Players can view and manage bonus items via the `!sac` command
- **Clickable Interactions**: Discord buttons for seamless item usage
- **Active Multipliers**: Track and apply LC bonuses across multiple games
- **Game Integration**: Automatic multiplier application to all compatible games

## Database Schema

### user_inventory Table
Stores items owned by each user:
- `user_id`: Discord user ID
- `item_type`: Type of item ('jackpot', 'multiplier_x2', 'multiplier_x3')
- `quantity`: Number of items owned
- Unique constraint on (user_id, item_type)

### active_multipliers Table
Tracks currently active multipliers:
- `user_id`: Discord user ID
- `multiplier_type`: Type of multiplier
- `multiplier_value`: Multiplier value (2 or 3)
- `games_remaining`: Number of games the multiplier is active for (default: 2)

## Available Items

### 🎁 Jackpot
- **Description**: Opens a jackpot to receive random LC rewards
- **Possible rewards**: 50, 100, 250, or 1000 LC
- **Probabilities**: 
  - 50 LC: 50%
  - 100 LC: 30%
  - 250 LC: 15%
  - 1000 LC: 5%

### 🎫 Multiplieur x2
- **Description**: Doubles LC gains for the next 2 games
- **Duration**: 2 matches (even if lost)
- **Effect**: All LC winnings are multiplied by 2

### 🎫 Multiplieur x3
- **Description**: Triples LC gains for the next 2 games
- **Duration**: 2 matches (even if lost)
- **Effect**: All LC winnings are multiplied by 3

## Commands

### Player Commands

#### !sac
Displays the player's inventory with all available items. Each item shows:
- Quantity owned
- Description of what the item does
- Clickable button to use the item

**Example**:
```
!sac
```

### Admin Commands

#### !giveitem @user <type> <quantity>
(Admin only) Give items to a user for testing or rewards.

**Parameters**:
- `@user`: The user to give items to
- `type`: Item type (jackpot, multiplier_x2, multiplier_x3)
- `quantity`: Number of items to give

**Example**:
```
!giveitem @Player jackpot 5
!giveitem @Player multiplier_x2 3
```

## Game Integration

The multiplier system is integrated into the following games:

### Jeu Commands
- **Duel** (`!jeu duel @user [amount]`)
- **Roulette** (`!jeu roulette [amount]`)

### Casino Commands
- **Roue** (`!roue [amount] [color]`) - Roulette wheel
- **Blackjack** (`!bj [amount]`)
- **Machine** (`!machine [amount]`) - Slot machine

### How It Works

1. **Before Game Start**: The system checks if the player has an active multiplier
2. **During Game**: Normal game logic executes
3. **After Win**: If the player wins and has an active multiplier:
   - Base winnings are calculated
   - Multiplier is applied to base winnings
   - Final LC amount is awarded
   - Multiplier games remaining counter is decremented
   - Expired multipliers are automatically cleaned up
4. **Notification**: Players see the multiplier bonus in the result message

### Example Flow

```
Player activates Multiplieur x3 (2 games remaining)
→ Plays !bj 100 and wins → Normally wins 200 LC
→ With multiplier: 200 × 3 = 600 LC awarded
→ Games remaining: 1

→ Plays !roue 50 rouge and wins → Normally wins 100 LC
→ With multiplier: 100 × 3 = 300 LC awarded
→ Games remaining: 0 (multiplier expires)
```

## User Experience

### Opening a Jackpot
1. User runs `!sac`
2. Sees "Jackpot 🎁 x5" with "Ouvrir Jackpot 🎁" button
3. Clicks the button
4. Bot shows: "🎉 Félicitations! Vous avez gagné **250 LC** 💰"
5. Inventory updates automatically to show "Jackpot 🎁 x4"

### Activating a Multiplier
1. User runs `!sac`
2. Sees "Multiplieur x2 🎫 x3" with "Activer x2 🎫" button
3. Clicks the button
4. Bot shows: "✨ Multiplieur x2 activé! Vos 2 prochaines parties donneront x2 LC."
5. Inventory shows active multiplier status
6. Next 2 games show multiplier bonus in winnings

### In-Game Experience
When a player with an active multiplier wins a game:

```
🏆 Blackjack - Gagné !
...
🎫 Multiplieur x2 appliqué! (200 LC → 400 LC)
```

## Technical Implementation

### Core Files

1. **commands/sac.js**: Inventory display and item usage
2. **utils/multiplierHelper.js**: Multiplier logic and utilities
3. **database/db.js**: Database methods for inventory and multipliers
4. **database/migrations/006_add_inventory_tables.sql**: Database schema

### Helper Functions

The `multiplierHelper` module provides:
- `getPlayerMultiplier(userId)`: Check for active multiplier
- `applyMultiplier(userId, baseWinnings)`: Apply and decrement multiplier
- `getMultiplierNotification(...)`: Generate notification messages
- `getMultiplierAppliedMessage(...)`: Generate result messages

### Button Interactions

Button interactions are handled globally in bot.js:
```javascript
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    
    const inventoryButtons = ['use_jackpot', 'use_multiplier_x2', 'use_multiplier_x3'];
    if (inventoryButtons.includes(interaction.customId)) {
        await sacCommand.handleButtonInteraction(interaction);
    }
});
```

## Future Enhancements

Potential future additions:
- More item types (shields, instant wins, etc.)
- Item trading between players
- Item rewards from achievements
- Limited-time special items
- Item expiration dates
- Item effects stacking or combination

## Testing

To test the system:

1. **Setup**: Give yourself test items
   ```
   !giveitem @yourself jackpot 5
   !giveitem @yourself multiplier_x2 3
   ```

2. **Test Inventory**: Check items appear
   ```
   !sac
   ```

3. **Test Jackpot**: Click "Ouvrir Jackpot" button
   - Verify LC awarded
   - Verify quantity decremented

4. **Test Multiplier**: 
   - Click "Activer x2" button
   - Play 2 games
   - Verify multiplier applied to winnings
   - Verify multiplier expires after 2 games

5. **Test Multiple Games**:
   - !jeu duel @opponent 100
   - !roue 50 rouge
   - !bj 100
   - !machine 25

## Security Considerations

- Only admins can give items via `!giveitem`
- Inventory quantities cannot go below 0
- Active multipliers are automatically cleaned up when expired
- Database transactions ensure consistency
- Button interactions verify user ownership
