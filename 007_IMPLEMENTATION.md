# 007 Game Implementation

## Overview
The 007 game is a strategic 1v1 duel game where players face off using bullets, shields, and recharge actions. Players must carefully manage their bullets and predict their opponent's moves to win.

## Game Mechanics

### Starting Conditions
- Each player starts with **1 bullet**
- Players bet LC before the game begins
- The game uses a turn-based system with simultaneous action selection

### Available Actions

#### 🔄 Recharger (Recharge)
- Adds **1 bullet** to the player's inventory
- Bullets accumulate over multiple turns
- No limit on maximum bullets
- Always available

#### 🔫 Tirer (Shoot)
- Uses **1 bullet** to shoot at the opponent
- Eliminates opponent if they don't have a shield active
- Button is **disabled** when player has 0 bullets
- Button shows "Tir (Pas de balle)" when disabled

#### 🛡️ Bouclier (Shield)
- Protects the player from being shot in that turn
- Active only for the current turn
- Does not consume bullets
- Always available

### Win Conditions

1. **Victory by Shooting**: Player shoots opponent who has no shield active
2. **Draw**: Both players shoot each other simultaneously and neither has a shield
3. **Continues**: Any other combination of actions (both shield, both recharge, shield blocks shot, etc.)

### Game Flow

1. **Challenge Phase**
   - Player A challenges Player B with a bet amount
   - Player B can accept or refuse
   - If refused or timeout, game is cancelled

2. **Turn Phase**
   - Both players see their current bullet counts
   - Both players simultaneously choose their action
   - Actions are hidden from the opponent until both have chosen
   - Timeout: 30 seconds per turn

3. **Resolution Phase**
   - Actions are revealed and processed
   - If game ends, LC is transferred and game is recorded
   - If game continues, next turn begins

## Implementation Details

### File Structure
```
commands/007.js           # Main game logic
config.json              # Game configuration (min/max bets, initial bullets)
responses.json           # French text responses
bot.js                   # Command registration
```

### Key Features

#### Dynamic Button States
- Shoot button automatically disabled when bullets = 0
- Button label changes to show unavailability
- All buttons disabled after actions are chosen

#### Player Validation
- Players cannot click opponent's action buttons
- Custom IDs include player ID for validation
- Ephemeral error messages for invalid clicks

#### Bullet Tracking
- Bullets increment on recharge
- Bullets decrement on shoot (with validation)
- Bullets displayed in status before each turn
- Cannot shoot with 0 bullets (validated in code and UI)

#### Balance Management
- Bets are NOT deducted at game start
- Winner receives bet amount
- Loser loses bet amount
- Draw: no balance changes (bets never deducted)
- Follows same pattern as PFC and other 1v1 games

### Database Integration

Games are recorded in the `game_history` table:
```javascript
await db.recordGame(
    '007',              // game type
    playerId,           // player ID
    opponentId,         // opponent ID
    betAmount,          // bet amount
    'win' or 'loss',    // result
    winnings            // amount won (0 for loss)
);
```

### Configuration

In `config.json`:
```json
"007": {
    "minBet": 10,
    "maxBet": 1000,
    "initialBullets": 1
}
```

### Response Keys

All responses are in French and located in `responses.json` under the `"007"` key:

- `noOpponent` - No opponent mentioned
- `selfChallenge` - Cannot challenge self
- `botChallenge` - Cannot challenge bot
- `invalidBet` - Invalid bet amount
- `insufficientBalanceChallenger` - Challenger lacks funds
- `insufficientBalanceOpponent` - Opponent lacks funds
- `alreadyInGame` - Player already in a game
- `challenge.*` - Challenge embed messages
- `refused.*` - Refusal messages
- `accepted.*` - Acceptance messages
- `turn.*` - Turn status messages
- `actionChosen` - Action confirmed
- `alreadyChosen` - Already chose action
- `result.*` - Game result messages
- `timeout.*` - Timeout messages

## Usage

```bash
!007 @opponent 100
```

**Parameters:**
- `@opponent` - Mention the user to challenge
- `100` - Bet amount (must be between minBet and maxBet)

## Example Game Flow

```
Player A: !007 @PlayerB 100

Bot: 🔫 Duel 007 !
     Player A challenges Player B to a 007 duel!
     Bet: 100 LC
     [Accept] [Refuse]

Player B: [clicks Accept]

Bot: ✅ Duel Accepted
     Player B accepted the duel!
     The duel begins...

Bot: 🎮 Jeu 007 : Choisissez votre action !
     Turn 1
     Player A: 1 🔫
     Player B: 1 🔫
     Both players choose their actions...

[Player A chooses Recharge]
[Player B chooses Shoot]

Bot: Player B shot at Player A who had no shield! 💥
     🏆 Winner: Player B
     💰 Winnings: 100 LC

Game ends. Player B gains 100 LC, Player A loses 100 LC.
```

## Technical Notes

### Security
- No CodeQL vulnerabilities detected
- Button validation prevents cross-player actions
- Bullet count validation prevents negative values
- Balance changes only occur on legitimate game end

### Performance
- Uses Discord.js message component collectors
- Efficient turn-based state management
- Automatic cleanup of active games on completion/timeout

### Error Handling
- 30-second timeout per turn
- 30-second timeout for challenge acceptance
- Automatic game cleanup on errors
- Prevents multiple simultaneous games per player

## Testing

The module can be tested with:
```bash
node -e "const game007 = require('./commands/007'); console.log('Module loaded:', game007.name);"
```

All responses are validated through the response helper system.

## Future Enhancements

Potential improvements for future versions:
1. Add maximum bullet limit
2. Add special actions (dodge, double shot, etc.)
3. Add round timer with auto-recharge
4. Add spectator mode
5. Add tournament bracket support
6. Add replay/history viewing
