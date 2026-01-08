# 007 Interactive Game Implementation

## Overview
This document describes the implementation of the interactive **007 game** for the virtuous-surprise Discord bot. The game is a 1v1 competitive action game where players make strategic choices using interactive buttons.

## Game Mechanics

### Starting Conditions
- Each player starts with **1 bullet** 🔫
- Players bet LC (virtual currency) before the game starts
- The game continues in rounds until one player is eliminated

### Actions

#### 🔄 Recharger (Reload)
- Adds **+1 bullet** to the player's inventory
- Players can accumulate bullets by reloading multiple times
- Always available (button always enabled)

#### 🔫 Tirer (Shoot)
- Uses **1 bullet** from the player's inventory
- Eliminates the opponent if they are:
  - Reloading (vulnerable)
  - Not using a shield
- **Disabled** (grayed out) when the player has no bullets
- The button remains **visible** but non-clickable

#### 🛡️ Bouclier (Shield)
- Protects the player from incoming shots for that round
- Blocks one shot completely
- Always available (button always enabled)

### Round Flow
1. Both players receive action buttons (via DM or channel)
2. Players have **10 seconds** to choose an action
3. Once both players choose, actions are revealed
4. Actions are resolved:
   - If Player A shoots and Player B is reloading (without shield) → Player A wins
   - If Player A shoots and Player B has a shield → Shot is blocked
   - If both players shoot → Both shots are fired
   - If both players reload → Both gain bullets
5. If no winner, proceed to next round with updated bullet counts
6. If timeout occurs, the player who didn't respond loses

### Winning Conditions
- Player shoots opponent who is reloading (without shield)
- Opponent times out (doesn't respond within 10 seconds)

## Technical Implementation

### File Structure
```
commands/007.js         - Main game logic
config.json            - Game configuration (minBet, maxBet)
responses.json         - French language strings
bot.js                 - Command registration
```

### Key Features

#### Button State Management
```javascript
const tirerButton = new ButtonBuilder()
    .setCustomId(`007_tirer_${playerId}`)
    .setLabel('Tirer')
    .setEmoji('🔫')
    .setStyle(ButtonStyle.Danger)
    .setDisabled(!hasBullets); // Disabled if no bullets
```

#### Player-Specific Buttons
- Each button has a unique ID: `007_{action}_{playerId}`
- Prevents players from clicking each other's buttons
- Validation ensures only the correct player can interact

#### Interaction Collection
- Uses Discord.js `MessageComponentCollector`
- 10-second timeout per round
- Handles both player choices before proceeding

#### Game State Tracking
```javascript
const gameState = {
    players: {
        [playerId]: {
            bullets: 1,        // Current bullet count
            shield: false,     // Shield status for current round
            action: null,      // Chosen action
            user: userObject   // Discord user object
        }
    },
    roundNumber: 1
};
```

### Database Integration
- Records game outcomes using `db.recordGame()`
- Updates player balances with `db.updateBalance()`
- Winner gains bet amount, loser loses bet amount

## Configuration

### config.json
```json
"007": {
    "minBet": 10,
    "maxBet": 1000
}
```

### Usage
```
!007 @opponent [bet_amount]
```

**Example:**
```
!007 @User 50
```

## Response Strings

All game messages are localized in French in `responses.json`:
- Challenge messages
- Round status
- Action descriptions
- Victory/defeat messages
- Timeout messages
- Error messages

## Button Behavior Examples

### Player with 2 bullets:
```
🔄 Recharger [Active - Blue]
🔫 Tirer [Active - Red]
🛡️ Bouclier [Active - Green]
```

### Player with 0 bullets:
```
🔄 Recharger [Active - Blue]
🔫 Tirer [DISABLED - Gray]
🛡️ Bouclier [Active - Green]
```

## Error Handling

### Timeout Handling
- If one player doesn't respond → Other player wins by default
- If both players don't respond → Game ends with timeout message

### Validation
- Checks if player has sufficient bullets before shooting
- Prevents duplicate action selection
- Validates player-button ownership

### Edge Cases
- Players already in a game
- Insufficient LC balance
- Bot challenges
- Self-challenges

## Security

### CodeQL Analysis
- ✅ No security vulnerabilities detected
- All user inputs properly validated
- No injection risks identified

### Input Validation
- Bet amount validation (min/max range)
- User mention validation
- Action validation (bullets check)

## Testing

Basic module test available in `test-007.js`:
```bash
node test-007.js
```

Tests verify:
- Module structure and exports
- Configuration presence
- Response strings existence

## Future Enhancements (Optional)

Potential improvements for future versions:
1. Special power-ups (double shot, ricochet)
2. Best-of-3 rounds mode
3. Spectator mode
4. Game statistics tracking
5. Tournament mode
6. Animated action reveals

## Integration with Bot

The 007 game is fully integrated into the bot:
- Registered in `bot.js`
- Accessible via `!007` command
- Listed in help menu (`!help`)
- Compatible with existing game infrastructure

## Benefits

1. **Intuitive Interface**: Visual buttons make gameplay clear
2. **Strategic Depth**: Multiple viable strategies (aggressive shooting vs. bullet accumulation)
3. **Fair Play**: Timeout system prevents stalling
4. **Visual Feedback**: Disabled buttons clearly show when actions are unavailable
5. **Competitive**: LC betting adds stakes to each match
