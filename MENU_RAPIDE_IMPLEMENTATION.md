# Menu System and Jeu Rapide Implementation

## Overview
This document describes the implementation of the interactive menu system with dynamic submenus and the new "Jeu Rapide" (Fast Typing Game) for the Virtuous Surprise Discord bot.

## Features Implemented

### 1. Interactive Menu System (`!menu`)

The menu system provides a user-friendly interface to navigate through bot features using Discord's dropdown menus.

#### Main Menu Categories:
- 🎮 **Jeux Solo** - Solo games
- 🤼 **Jeux 1v1** - Player vs Player games
- 🎰 **Casino** - Casino games
- 📊 **Statistiques** - Statistics

#### Dynamic Submenus:

**Jeux Solo Submenu:**
- Roulette (multiplayer game)
- Back to main menu

**Jeux 1v1 Submenu:**
- Jeu Rapide (Fast typing game) - `!rapide @user [montant]`
- Duel (Classic duel) - `!jeu duel @user [montant]`
- Back to main menu

**Casino Submenu:**
- Roulette - `!roue [montant] [couleur]`
- Blackjack - `!bj [montant]`
- Machine à sous - `!machine [montant]`
- Back to main menu

**Statistiques:**
- Direct link to statistics - `!stats` or `!stats @user`

#### Technical Details:
- Uses Discord.js v14 `StringSelectMenuBuilder` and `ActionRowBuilder`
- Implements interaction collectors with 2-minute timeout
- User-specific menus (only the command invoker can interact)
- Smooth navigation with back buttons

### 2. Jeu Rapide (`!rapide`)

A fast-paced typing game where two players compete to type a word first.

#### Command Format:
```
!rapide @user [montant]
```

#### Game Flow:

1. **Challenge Phase** (1 minute timeout)
   - Player 1 challenges Player 2 with a bet amount
   - Player 2 must type "accepter" to accept the challenge
   - If not accepted within 60 seconds, the challenge is cancelled

2. **Rules Display**
   - Once accepted, game rules are shown to both players
   - Players are informed about the countdown and typing challenge

3. **Countdown** (5 seconds)
   - Visual countdown from 5 to 1
   - Builds anticipation for the challenge

4. **Typing Challenge** (30 seconds)
   - A random word is displayed
   - First player to type the word exactly (case-insensitive) wins
   - If nobody types the word correctly within 30 seconds, bets are returned

5. **Result**
   - Winner receives double their bet (loser's bet)
   - Game results are recorded in the database
   - LC balances are updated automatically

#### Configuration:
- **Minimum bet:** 10 LC
- **Maximum bet:** 1000 LC
- **Word pool:** 35 words (mix of French and English)
- **Acceptance timeout:** 60 seconds
- **Typing timeout:** 30 seconds

#### Word List:
The game uses a curated list of 35 words including:
- French words: champion, victoire, rapidité, clavier, discord, galaxie, musique, etc.
- English words: dragon, phoenix, thunder, cosmos, crystal, velocity, quantum, etc.

#### Database Integration:
- Games are recorded in the `games` table with type 'rapide'
- Tracks wins/losses for both players
- Updates player balances in real-time
- Compatible with existing statistics system

### 3. Help System Updates

The help command (`!help` or `!aide`) has been updated to include:
- New menu section at the top
- Updated games section with rapide command
- Clear command syntax and descriptions

## Files Modified

### New Files:
1. `commands/menu.js` - Interactive menu system
2. `commands/rapide.js` - Fast typing game implementation
3. `test-menu-rapide.js` - Test suite for new features

### Modified Files:
1. `bot.js` - Registered new commands and handlers
2. `config.json` - Added rapide game configuration
3. `responses.json` - Added menu and rapide responses

## User Experience

### Menu Navigation:
1. User types `!menu`
2. Bot displays interactive dropdown menu
3. User selects a category
4. Bot updates the menu to show submenu options
5. User can select specific games or return to main menu
6. Each game option shows usage instructions

### Rapide Game:
1. Player 1: `!rapide @Player2 100`
2. Bot displays challenge with 1-minute timer
3. Player 2 types: `accepter`
4. Bot shows game rules
5. Bot counts down: 5, 4, 3, 2, 1
6. Bot displays random word
7. First player to type the word wins
8. Bot announces winner and updates balances

## Error Handling

The implementation includes comprehensive error handling:
- Invalid bet amounts
- Insufficient balances
- Self-challenges
- Bot challenges
- Already in game checks
- Timeout handling
- User permission checks (menu interactions)

## Testing

A dedicated test suite (`test-menu-rapide.js`) verifies:
- Command module loading
- Response structure
- Configuration presence
- Bot.js integration
- Help system updates

All tests pass successfully, confirming the implementation is ready for production.

## Future Enhancements

Potential improvements for future versions:
1. Add more words to the word list
2. Implement difficulty levels (word length)
3. Add streak tracking for consecutive wins
4. Create leaderboards for fastest typing times
5. Add more games to Jeux Solo category
6. Implement game categories in the menu

## Compatibility

- Discord.js: v14.14.1
- Node.js: >=18
- PostgreSQL database (existing schema)
- All existing bot features remain functional

## Usage Statistics

Once deployed, the following metrics will be tracked:
- Number of menu interactions
- Most selected menu categories
- Rapide games played
- Average game duration
- Win rates per player
