# Responses Configuration

This document explains how to customize bot responses using the `responses.json` file.

## Overview

All bot text responses are centralized in the `responses.json` file. This allows you to customize messages without modifying the bot's source code.

## Response Structure

The `responses.json` file is organized by command categories:

- `lc` - LC balance and management
- `transfer` - LC transfer operations
- `invites` - Invitation tracking
- `stats` - User statistics
- `games` - Game commands (duel, roulette)
- `moderation` - Admin commands
- `help` - Help command
- `errors` - Error messages

## Placeholders

Responses support dynamic placeholders that are replaced with actual values at runtime:

### Common Placeholders

- `{prefix}` - Command prefix (default: `!`)
- `{currency_symbol}` - Currency symbol (default: 💰)
- `{user}` or `{username}` - User's name
- `{balance}` - User's LC balance
- `{amount}` - Transaction or bet amount
- `{invites}` - Number of invitations

### Command-Specific Placeholders

#### LC Commands
- `{sender}` - User sending LC
- `{recipient}` - User receiving LC
- `{newBalance}` - Updated balance after transaction

#### Invites
- `{inviter}` - User who sent the invite
- `{invited}` - User who joined via invite
- `{reward}` - LC reward amount

#### Stats
- `{gamesPlayed}` - Total games played
- `{gamesWon}` - Total games won
- `{messages}` - Message count (currently N/A)

#### Games
- `{challenger}` - User starting a duel
- `{opponent}` - User challenged to duel
- `{bet}` - Bet amount
- `{winner}` - Winner of the game
- `{loser}` - Loser of the game
- `{totalWinnings}` - Total winnings
- `{minBet}` - Minimum bet amount
- `{maxBet}` - Maximum bet amount
- `{player}` - Player in roulette
- `{playerCount}` - Number of players
- `{totalPot}` - Total pot in roulette
- `{winnings}` - Winnings amount

## Examples

### Example 1: Customizing LC Balance Message

Original in `responses.json`:
```json
"lc": {
  "balance": {
    "title": "{currency_symbol} Votre solde LC",
    "description": "**{balance} LC**",
    "footer": "Utilisez {prefix}don pour transférer des LC"
  }
}
```

To change the language to English:
```json
"lc": {
  "balance": {
    "title": "{currency_symbol} Your LC Balance",
    "description": "**{balance} LC**",
    "footer": "Use {prefix}don to transfer LC"
  }
}
```

### Example 2: Customizing Game Messages

Original:
```json
"games": {
  "duel": {
    "challenge": {
      "title": "⚔️ Duel!",
      "description": "{challenger} défie {opponent} pour **{bet} LC**!\n\n{opponent}, tapez `accepter` pour accepter le duel dans les 30 secondes."
    }
  }
}
```

Custom version:
```json
"games": {
  "duel": {
    "challenge": {
      "title": "⚔️ Battle Challenge!",
      "description": "{challenger} challenges {opponent} for **{bet} LC**!\n\n{opponent}, type `accept` to accept the duel within 30 seconds."
    }
  }
}
```

## How It Works

The bot uses the `utils/responseHelper.js` module to:

1. Load responses from `responses.json`
2. Navigate to the requested response using dot notation (e.g., `lc.balance.title`)
3. Replace placeholders with actual values
4. Return the formatted string

Example usage in code:
```javascript
const { getResponse } = require('./utils/responseHelper');

// Get a response with placeholders
const message = getResponse('transfer.success.description', {
    sender: user1,
    amount: 100,
    recipient: user2,
    newBalance: 900
});
```

## Best Practices

1. **Maintain Structure**: Keep the JSON structure intact when making changes
2. **Test Changes**: After modifying responses, test the affected commands
3. **Backup**: Keep a backup of the original `responses.json` before making major changes
4. **Consistency**: Use consistent formatting and style across all responses
5. **Placeholders**: Ensure all placeholders are properly closed with `{}`

## Validation

To validate your `responses.json` file:

```bash
node -e "const responses = require('./responses.json'); console.log('✅ Valid JSON');"
```

To test the response helper:

```bash
node -e "const { getResponse } = require('./utils/responseHelper'); console.log(getResponse('lc.balance.title'));"
```
