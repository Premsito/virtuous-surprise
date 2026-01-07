# Duel de Quiz - Implementation Documentation

## Overview
The **Duel de Quiz** (Quiz Duo) is a competitive knowledge quiz game where two players compete by answering multiple-choice questions. The game features interactive buttons for answering, time-based scoring, and real-time scoreboard updates.

## Command Usage

### Basic Command
```
!quizduo @user
```

### Example
```
!quizduo @Joueur2
```

## Game Flow

### 1. Challenge Setup
- Player 1 challenges Player 2 using `!quizduo @Joueur2`
- Player 2 receives a challenge notification with Accept/Refuse buttons
- Player 2 has 30 seconds to respond

### 2. Match Acceptance
- If Player 2 clicks **Accepter** (✅), the quiz begins
- If Player 2 clicks **Refuser** (❌), the challenge is cancelled
- If Player 2 doesn't respond within 30 seconds, the challenge expires

### 3. Quiz Gameplay
- The game presents 7 questions (configurable in `config.json`)
- Each question has 4 multiple-choice answers (A, B, C, D)
- Players have 10 seconds to answer each question
- Players select answers using interactive buttons with emojis: 🅰, 🅱, 🅲, 🅳

### 4. Scoring
- Players earn 1 point for each correct answer
- No points are awarded for incorrect or missing answers
- Response time is tracked and displayed but doesn't affect scoring

### 5. Scoreboard Updates
After each question, the bot displays:
- The correct answer
- Both players' answers (with ✅ or ❌)
- Response times for both players
- Current cumulative scores

### 6. Final Results
At the end of the quiz, the bot announces:
```
🎉 Jeu terminé ! Résultats :
@Premsito : 6 points
@Joueur2 : 4 points
🏆 Vainqueur : @Premsito
```

In case of a tie:
```
🎉 Jeu terminé ! Résultats :
@Premsito : 5 points
@Joueur2 : 5 points
🏆 Vainqueur : Aucun - Match nul !
```

## Features

### Interactive Buttons
- **Accept/Refuse Buttons**: Green checkmark for accept, red X for refuse
- **Answer Buttons**: Four buttons labeled A, B, C, D with corresponding emojis
- **Visual Feedback**: Buttons are disabled after interaction to prevent multiple submissions

### Timers
- **Challenge Acceptance**: 30 seconds
- **Per Question**: 10 seconds
- **Between Questions**: 3 seconds pause for reading results

### Inactivity Handling
- If a player doesn't respond to the challenge within 30 seconds, the game is cancelled
- If a player doesn't answer a question within 10 seconds, they get no points for that question
- The game continues even if one player times out on a question

### Anti-Cheat
- Players can only answer each question once
- Answer buttons are disabled after both players answer or time expires
- Active game tracking prevents players from starting multiple games simultaneously

## Question Database

The game includes 20 diverse questions covering:
- Geography (capitals, oceans, rivers, deserts, mountains)
- History (French Revolution, moon landing)
- Science (chemistry, physics, astronomy)
- Literature (authors)
- Sports (football)
- General knowledge

Questions are randomly selected and shuffled for each game to ensure variety.

## Configuration

In `config.json`:
```json
"quizduo": {
  "questionCount": 7
}
```

You can adjust the number of questions per game by changing the `questionCount` value (recommended: 5-10).

## Technical Implementation

### Files Modified
1. **`commands/quizduo.js`** - Main game logic
2. **`config.json`** - Game configuration
3. **`responses.json`** - Localized text responses
4. **`bot.js`** - Command registration and handler

### Key Functions
- **Challenge System**: Uses Discord.js button interactions
- **Question Delivery**: Embeds with formatted question text and answer options
- **Answer Collection**: Message component collectors with timeout
- **Score Tracking**: Map-based score storage per player
- **Result Calculation**: Comparison of final scores

### Dependencies
- discord.js v14.14.1+ (for button interactions)
- Node.js 18+

## Error Handling

The game gracefully handles:
- Missing opponent mention
- Self-challenges
- Bot challenges
- Players already in games
- Timeout scenarios
- Database errors

## Future Enhancements

Potential improvements:
1. Add difficulty levels (easy, medium, hard)
2. Implement speed-based bonus points
3. Add leaderboards for total wins
4. Include question categories
5. Allow custom question packs
6. Add hints or lifelines
7. Implement betting with LC currency
8. Multi-round tournaments

## Testing

Run the validation tests:
```bash
node test-quizduo.js
```

This validates:
- Command file structure
- Configuration presence
- Response text availability
- Bot.js integration
- Question database size
- Key feature implementation

## Usage Examples

### Starting a Quiz
```
User1: !quizduo @User2
Bot: 🧠 Duel de Quiz !
     🎯 @User1 défie @User2 à un Duel de Quiz!
     📝 Questions: 7
     ⏱️ Temps par question: 10 secondes
     @User2, acceptez-vous le défi ?
     [Accepter ✅] [Refuser ❌]
```

### Question Display
```
Bot: ❓ Question 1/7
     Quelle est la capitale de la France ?
     🅰 A: Paris
     🅱 B: Londres
     🅲 C: Berlin
     🅳 D: Madrid
     ⏱️ Vous avez 10 secondes pour répondre!
     [🅰 A] [🅱 B] [🅲 C] [🅳 D]
```

### Answer Feedback
```
Bot: 📊 Résultat de la question
     ✅ Bonne réponse: 🅰 A - Paris
     
     User1: 🅰 Paris ✅ (2.3s)
     User2: 🅱 Londres ❌ (5.1s)
     
     📊 Score actuel
     User1: 1 points
     User2: 0 points
```

## Support

For issues or questions:
1. Check that all configuration is correct in `config.json`
2. Verify responses exist in `responses.json`
3. Ensure the command is properly registered in `bot.js`
4. Run the test suite to validate the implementation

## License

This implementation is part of the virtuous-surprise Discord bot project.
