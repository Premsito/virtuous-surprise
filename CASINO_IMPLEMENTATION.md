# Casino Commands Implementation

This document describes the new casino commands added to the virtuous-surprise Discord bot.

## Overview

A new central `!casino` command has been implemented that serves as a menu for accessing different casino games. Players can use this menu to discover available games and their rules.

## Commands

### 1. `!casino` - Casino Menu
Displays an interactive menu with descriptions of all available casino games.

**Example:**
```
!casino
```

**Output:**
Shows an embed with:
- 🎯 **!roue** - Roulette game description
- 🃏 **!bj** - Blackjack game description  
- 🎰 **!machine** - Slot machine game description

### 2. `!roue [montant] [couleur]` - Roulette
A color-based roulette game where players bet on rouge (red), noir (black), or vert (green).

**Usage:**
```
!roue 50 rouge
!roue 100 noir
!roue 25 vert
```

**Mechanics:**
- Bet on one of three colors: rouge, noir, or vert
- Rouge and Noir have equal probability (~49% each)
- Vert is rare (~2.7% chance)
- Payouts:
  - Rouge/Noir: 2x multiplier
  - Vert: 35x multiplier
- Min bet: 10 LC
- Max bet: 500 LC

### 3. `!bj [montant]` - Blackjack
A classic Blackjack card game where players try to get as close to 21 as possible without going over.

**Usage:**
```
!bj 100
```

**Mechanics:**
- Player receives 2 cards, dealer shows 1 card
- Player can choose to:
  - Type `tirer` to draw another card
  - Type `rester` to stand with current hand
- Dealer draws until reaching 17 or higher
- Automatic blackjack (21 with 2 cards) pays 2.5x
- Regular wins pay 2x
- Push (tie) returns the bet
- Bust (over 21) loses the bet
- 60 second timeout to make decisions
- Min bet: 10 LC
- Max bet: 1000 LC

**Card Values:**
- Number cards: Face value (2-10)
- Face cards (J, Q, K): 10 points
- Ace: 11 points (or 1 if 11 would cause bust)

### 4. `!machine [montant]` - Slot Machine
A slot machine game with weighted random symbols and variable payouts.

**Usage:**
```
!machine 50
```

**Mechanics:**
- Three reels spin with 7 different symbols
- Symbols (from common to rare): 🍒 🍋 🍊 🍇 ⭐ 💎 7️⃣
- Win conditions:
  - **Three matching symbols (Jackpot):** Variable multiplier based on symbol rarity
    - 🍒🍒🍒: 2x
    - 🍋🍋🍋: 3x
    - 🍊🍊🍊: 5x
    - 🍇🍇🍇: 10x
    - ⭐⭐⭐: 20x
    - 💎💎💎: 50x
    - 7️⃣7️⃣7️⃣: 100x (Maximum jackpot!)
  - **Two matching symbols:** 1.5x multiplier
  - **No match:** Lose bet
- Min bet: 5 LC
- Max bet: 250 LC

## Configuration

All game settings are defined in `config.json`:

```json
{
  "games": {
    "roue": {
      "minBet": 10,
      "maxBet": 500,
      "colorMultiplier": 2,
      "greenMultiplier": 35
    },
    "blackjack": {
      "minBet": 10,
      "maxBet": 1000,
      "winMultiplier": 2,
      "blackjackMultiplier": 2.5
    },
    "machine": {
      "minBet": 5,
      "maxBet": 250
    }
  }
}
```

## Database Integration

All casino games integrate with the existing database system:
- Players must have sufficient LC balance to play
- Winnings are automatically credited to player balance
- Game history is recorded in the `games` table
- All bets are deducted immediately when the game starts

## Response Messages

All game messages are in French and defined in `responses.json` under the `casino` section. Messages include:
- Menu descriptions
- Error messages (invalid bet, insufficient balance, etc.)
- Game start notifications
- Result announcements with detailed statistics

## Files Modified

1. **commands/casino.js** - New file containing all casino game logic
2. **config.json** - Added game configurations for roue, blackjack, and machine
3. **responses.json** - Added French text responses for all casino games
4. **bot.js** - Registered new casino commands and handlers
5. **test-casino.js** - Test file to validate casino module loading

## Testing

Run the casino test suite:
```bash
node test-casino.js
```

This validates:
- Casino module loads correctly
- All methods are present
- Configuration is complete
- Response messages are defined

## Notes

- All casino games use Discord embeds for rich formatting
- Player mentions are properly formatted using `.toString()`
- Symbol multipliers are defined as named constants for maintainability
- Error handling includes proper timeout management for interactive games
- No security vulnerabilities detected by CodeQL analysis
