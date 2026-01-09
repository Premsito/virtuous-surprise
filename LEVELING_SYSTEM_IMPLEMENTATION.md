# Leveling System Implementation Summary

## Overview
The virtuous-surprise Discord bot now includes a comprehensive leveling system that rewards users for their activity and engagement on the server.

## XP System Rules

### 1. Game Participation XP
Players earn XP based on their performance in games:
- **+15 XP** for a victory
- **+5 XP** for a defeat
- No XP for push/tie results

**Integrated Games:**
- Pierre-Feuille-Ciseaux (!pfc)
- Casino games (!roue, !bj, !machine)
- 007 (!007)
- Challenge 21 (!c21)

### 2. Message Activity XP
Players earn dynamic XP for participation through messages:
- XP per message varies between **1 and 3 XP** (randomly assigned)
- **Anti-spam system**: Users can only earn XP once per minute from messages
- Automatic level-up notifications when reaching a new level

### 3. Voice Chat Activity XP
Players earn XP for participating in voice channels:
- **+1 XP every 2 minutes** while in voice chat
- **Bonus: +25 XP** for staying active for a full hour (continuous session)
- XP only applies if at least **2 people** are in the voice channel (excluding bots)
- **Bonus XP per additional user**: +2 XP per extra user beyond the minimum 2
  - Example: With 5 users in VC = 1 (base) + 6 (3 extra users × 2) = 7 XP every 2 minutes

### 4. Reaction Participation XP
Players earn XP for receiving reactions on their messages:
- **+2 XP per reaction** received
- Maximum of **10 XP** can be earned per message through reactions
- Prevents spam by capping total reaction XP per message

## Level Progression System

The leveling system uses a progressive formula where each level requires more XP:
- **Level 1 → 2**: 100 XP
- **Level 2 → 3**: 200 XP
- **Level 3 → 4**: 300 XP
- **Level N → N+1**: N × 100 XP

### Example Level Requirements:
| Level | Total XP Required | XP for Next Level |
|-------|------------------|-------------------|
| 1     | 0                | 100               |
| 2     | 100              | 200               |
| 3     | 300              | 300               |
| 4     | 600              | 400               |
| 5     | 1,000            | 500               |
| 10    | 5,500            | 1,000             |

## Commands

### !niveau
Displays the user's current level, total XP, and progress towards the next level.

**Usage:**
- `!niveau` - Show your own level
- `!niveau @user` - Show another user's level

**Example Output:**
```
📊 Niveau de Username
🎯 Niveau: 5
⭐ XP Total: 1,250
📈 Progression: ████████████░░░░░░░░ 50%
    250 / 500 XP

350 XP pour le niveau 6
```

## Technical Details

### Database Schema
New tables and columns added:
- `users.xp` - Total XP accumulated
- `users.level` - Current level
- `users.last_message_xp_time` - Timestamp of last message XP grant (for anti-spam)
- `voice_xp_tracking` - Tracks active voice sessions and hourly bonuses
- `message_reaction_xp` - Tracks XP earned from reactions per message

### Rate Limiting
- **Message XP**: 1-minute cooldown between XP grants
- **Voice XP**: Calculated every 2 minutes for active users
- **Reaction XP**: Max 10 XP per message (no time limit)

### Performance Optimizations
- Message count caching to reduce database load
- Voice XP uses cached guild member data
- Parallel processing of voice XP sessions
- Error throttling to prevent log flooding

## Benefits

The leveling system encourages greater participation and engagement through:
1. **Fair rewards** across different activity types
2. **Progressive difficulty** to maintain long-term engagement
3. **Social incentives** (voice chat bonuses scale with group size)
4. **Immediate feedback** with level-up notifications
5. **Anti-spam protection** to prevent abuse

## Migration

The system includes an idempotent database migration (`007_add_xp_level_system.sql`) that:
- Adds new columns safely without data loss
- Creates necessary indexes for performance
- Can be run multiple times without errors
- Initializes all existing users with default values (0 XP, Level 1)

## Testing

Comprehensive unit tests validate:
- XP calculation formulas
- Level progression accuracy
- Anti-spam mechanisms
- Reaction XP capping
- Voice XP bonus calculations
- Edge cases and boundary conditions

All 26 tests pass successfully, ensuring system reliability.
