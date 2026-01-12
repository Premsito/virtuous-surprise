# Discord Embed Pancartes for Level-Up Notifications

## Overview
This implementation replaces the previous Canvas-based PNG level-up cards with Discord Embeds (pancartes) to provide visually appealing, dynamic level-up notifications.

## Features

### 1. Pancarte Design
Each level-up notification (pancarte) includes:
- **User's Avatar**: Displayed prominently as a thumbnail at the top
- **Celebratory Title**: "🎉 Félicitations 🎉"
- **Level Achievement Message**: "Tu as atteint le Niveau {X}" 🏆
- **XP Progress**: Shows current XP / next level XP with percentage
- **Dynamic Reward**: Displays the reward earned for reaching the level
- **Footer Message**: Motivational text or information about next milestone

### 2. Dynamic Rewards
The system automatically applies different rewards based on the level reached:

#### Milestone Levels (5, 10, 15, 20, 25...)
- **Level 1**: Petit trésor (15-35 LC) 💰
- **Level 5**: Grand trésor (75-100 LC) 💰
- **Level 10**: Trésor épique (200-300 LC) 💰 + x2 XP Boost (1h) ⚡
- **Level 15+**: Trésor légendaire (300-400+ LC) 💰 + x2 Boost (1h) 💎/⚡

**Visual**: Golden color (#FFD700) for milestone levels

#### Intermediate Levels (Odd: 3, 7, 9, 11...)
- **x2 XP Boost** (1 hour) ⚡ for levels 9, 13, 17, 21...
- **x2 LC Boost** (1 hour) 💎 for levels 3, 7, 11, 15, 19, 23...

**Visual**: Warning color for XP boosts, Success color for LC boosts

#### Regular Levels (Even: 2, 4, 6, 8...)
- **+20 LC** 💰 fixed reward

**Visual**: Primary color (#5865F2)

### 3. Embed Color Scheme
- **Golden (#FFD700)**: Milestone/Treasure levels (5, 10, 15...)
- **Success (#57F287)**: LC Boost rewards
- **Warning (#FEE75C)**: XP Boost rewards
- **Primary (#5865F2)**: Regular LC rewards

## Implementation Details

### Files Modified
1. **bot.js**:
   - Replaced `sendLevelUpCard()` to use EmbedBuilder instead of Canvas
   - Removed dependency on `utils/levelUpCard.js`
   - Updated imports to include `getXPProgress` from xpHelper
   - Modified `handleLevelUp()` to pass complete reward object

### Key Functions

#### `sendLevelUpCard(client, userId, user, newLevel, totalXP, rewardInfo)`
Creates and sends the Discord Embed pancarte with:
- Dynamic color based on reward type
- User avatar as thumbnail
- XP progress information
- Reward details
- Contextual footer message

#### Reward System (Existing)
- `calculateLevelReward(level)`: Returns reward object with type, LC amount, boost info, and description
- `formatRewardEmbed(reward, level)`: Formats reward for embed display (not used directly in this implementation)

## Usage

### Automatic Level-Up Notifications
The system automatically sends pancartes when users level up through:
- **Message XP**: Gained from sending messages (1-3 XP per message, 1-minute cooldown)
- **Voice XP**: Gained from voice chat participation (every 2 minutes with 2+ users)
- **Reaction XP**: Gained when messages receive reactions (max 10 XP per message)

### Channel Configuration
Level-up pancartes are sent to the configured channel:
```json
"channels": {
  "levelUpNotification": "1459283080576766044"
}
```

This corresponds to the `#📘 niveaux` channel in Discord.

## Testing

### Test Files
1. **test-pancarte-embeds.js**: Demonstrates all pancarte types
   ```bash
   node test-pancarte-embeds.js
   ```
   Shows examples of:
   - Milestone level 5 (Grand trésor)
   - Milestone level 10 (Trésor épique with boost)
   - Intermediate level 3 (LC Boost)
   - Even level 8 (Fixed LC reward)
   - Milestone level 15 (Trésor légendaire)

2. **test-embed-pancartes-init.js**: Verifies bot initialization
   ```bash
   node test-embed-pancartes-init.js
   ```
   Checks:
   - Module imports
   - Configuration validity
   - Embed creation for different reward types

### Running the Main Test Suite
```bash
npm test
```

## Retroactive Application

### Automatic Rollout
- ✅ All existing users will see the new embed pancartes on their next level-up
- ✅ No database migration required
- ✅ No manual intervention needed
- ✅ Reward system remains unchanged (uses existing `rewardHelper.js`)

### Backwards Compatibility
The implementation maintains full backwards compatibility:
- All existing reward calculations remain identical
- LC rewards and boosts are still applied to user accounts
- Database structure unchanged
- XP progression system unchanged

## Example Pancartes

### Milestone Level (Level 10)
```
Color: Golden (#FFD700)
Title: 🎉 Félicitations 🎉
Description: Tu as atteint le Niveau 10 🏆
Thumbnail: [User Avatar]
Fields:
  📊 Progression XP: 500 / 1000 XP (50%)
  🎁 Récompense: Trésor épique: 250 LC 💰 + x2 XP Boost (1h) ⚡
Footer: Continue jusqu'au niveau 15 pour le prochain trésor ! 💎
```

### Intermediate Level (Level 3)
```
Color: Success (#57F287)
Title: 🎉 Félicitations 🎉
Description: Tu as atteint le Niveau 3 🏆
Thumbnail: [User Avatar]
Fields:
  📊 Progression XP: 150 / 300 XP (50%)
  🎁 Récompense: x2 LC Boost (1h) 💎
Footer: 💡 Les !missions permettent de gagner de l'XP et des LC !
```

### Regular Level (Level 8)
```
Color: Primary (#5865F2)
Title: 🎉 Félicitations 🎉
Description: Tu as atteint le Niveau 8 🏆
Thumbnail: [User Avatar]
Fields:
  📊 Progression XP: 400 / 800 XP (50%)
  🎁 Récompense: +20 LC 💰
Footer: 💡 Les !missions permettent de gagner de l'XP et des LC !
```

## Advantages Over Canvas-Based Cards

### Performance
- ✅ No image generation overhead
- ✅ No canvas library dependency issues
- ✅ Faster notification delivery
- ✅ Smaller network payload (no PNG files)

### Maintenance
- ✅ Easier to update colors and styling
- ✅ No font rendering issues
- ✅ Native Discord rendering
- ✅ Better mobile support

### User Experience
- ✅ Clean, consistent Discord styling
- ✅ Respects user theme preferences (dark/light mode)
- ✅ Better accessibility
- ✅ Embeds are linkable and more interactive

## Configuration

### Colors (config.json)
```json
"colors": {
  "primary": "#5865F2",
  "success": "#57F287",
  "error": "#ED4245",
  "warning": "#FEE75C",
  "gold": "#FFD700",
  "blue": "#3498db"
}
```

### Channel (config.json)
```json
"channels": {
  "levelUpNotification": "1459283080576766044"
}
```

## Future Enhancements (Optional)

Potential improvements that could be added:
- [ ] Custom embed images for special milestone levels
- [ ] Leaderboard preview in level-up embeds
- [ ] Achievement badges display
- [ ] Seasonal themes for embeds
- [ ] Custom congratulatory messages based on level tier

## Troubleshooting

### Pancartes Not Appearing
1. Verify the channel ID in config.json
2. Check bot permissions for the level-up channel
3. Ensure bot has permission to send embeds
4. Check console logs for errors

### Colors Not Showing
1. Verify color hex codes in config.json
2. Ensure config.json is properly formatted
3. Check that reward type is correctly identified

## Summary

This implementation successfully replaces Canvas-based PNG cards with Discord Embeds, providing:
- ✅ Visual pancartes with user avatars
- ✅ "🎉 Félicitations" celebration
- ✅ "Tu as atteint le Niveau {X}" message
- ✅ Dynamic rewards (Trésor every 5 levels, Bonus for intermediates)
- ✅ Golden color for milestone rewards
- ✅ Colorful, clean layout
- ✅ Automatic retroactive application
- ✅ Full backwards compatibility
