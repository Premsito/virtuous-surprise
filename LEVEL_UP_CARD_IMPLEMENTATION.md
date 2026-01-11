# Level-Up Card Announcement System Implementation

## Overview
This implementation adds a highly engaging, visually appealing level-up announcement system using canvas-generated cards that are automatically posted to the designated channel when users level up.

## Features Implemented

### 1. Canvas-Based Card Generation
**Module:** `utils/levelUpCardHelper.js`

The card generator creates beautiful, professional-looking announcement cards with:

#### Visual Elements:
- **Background:** Purple gradient (from `#667eea` to `#764ba2`) with decorative circular elements
- **Title:** "🎉 FÉLICITATIONS 🎉" in bold white text (48px)
- **User Avatar:** 
  - Circular profile picture (120px diameter)
  - White border/frame effect
  - Fallback to white circle if avatar fails to load
- **Username:** Displayed with 👤 emoji (32px bold)
- **Level Display:** Shows current level with 🆙 emoji (36px bold)
- **XP Progress Text:** Current XP / Required XP with 📊 emoji (24px)
- **Progress Bar:**
  - 600px wide, 25px tall
  - Background: Semi-transparent white
  - Fill: Golden gradient (`#FFD700` to `#FFA500`)
  - White border for definition
  - Dynamically fills based on XP percentage
- **Reward Text:** "🎁 Cadeau gagné : [reward]" (26px bold)
- **Footer:** Missions encouragement message in italic (16px)

#### Card Dimensions:
- Width: 800px
- Height: 400px
- Format: PNG

### 2. Integration Points

The card system is integrated into all XP sources:

#### A. Message XP (bot.js)
When users send messages and level up through message activity:
```javascript
const card = await generateLevelUpCard({
    username: message.author.username,
    avatarURL: message.author.displayAvatarURL({ extension: 'png', size: 256 }),
    level: newLevel,
    xp: updatedUser.xp,
    reward: 'Trésor 🗝️'
});
```

#### B. Voice XP (bot.js)
When users level up through voice channel participation:
```javascript
const card = await generateLevelUpCard({
    username: userInVoice.user.username,
    avatarURL: userInVoice.user.displayAvatarURL({ extension: 'png', size: 256 }),
    level: newLevel,
    xp: updatedUser.xp,
    reward: 'Trésor 🗝️'
});
```

#### C. Reaction XP (bot.js)
When users level up from receiving reactions on their messages:
```javascript
const card = await generateLevelUpCard({
    username: messageAuthor.username,
    avatarURL: messageAuthor.displayAvatarURL({ extension: 'png', size: 256 }),
    level: newLevel,
    xp: updatedUser.xp,
    reward: 'Trésor 🗝️'
});
```

#### D. Game XP (utils/gameXPHelper.js)
When users level up from winning or losing games:
```javascript
const card = await generateLevelUpCard({
    username: member.user.username,
    avatarURL: member.user.displayAvatarURL({ extension: 'png', size: 256 }),
    level: newLevel,
    xp: updatedUser.xp,
    reward: 'Trésor 🗝️'
});
```

### 3. Channel Configuration

Cards are automatically posted to the configured level-up notification channel:
- **Channel ID:** `1459283080576766044` (as specified in requirements)
- **Configured in:** `config.json` → `channels.levelUpNotification`
- **Message Format:** `🎉 **Bravo <@userId>** 🎉` + card attachment

### 4. Reward System

Each level-up includes:
- **Visual announcement card** posted to the public channel
- **Trésor 🗝️** item added to user's inventory
- Card displays the reward name prominently

### 5. Dependencies Added

**Package:** `@napi-rs/canvas` v0.1.44
- High-performance canvas library for Node.js
- Native bindings for better performance
- Supports image loading, gradients, and text rendering

## Testing

### Test Script: `test-level-up-card.js`

The test script validates:
1. ✅ Card generation functionality
2. ✅ Avatar loading (with fallback handling)
3. ✅ Progress bar rendering
4. ✅ Dynamic XP calculations for different levels
5. ✅ All text elements display correctly

**Test Cases:**
- Level 5 user (200/300 XP)
- Level 12 user (215/500 XP)
- Level 25 user (500/1100 XP)

**Run tests:**
```bash
node test-level-up-card.js
```

Generated test images are automatically ignored via `.gitignore`.

## Code Quality

### Code Review
✅ Passed with minor suggestions (addressed)

### Security Scan
✅ CodeQL analysis found 0 vulnerabilities

## Example Usage

When a user levels up through any activity (messages, voice, reactions, games):

1. **Automatic Detection:** System detects level increase
2. **Card Generation:** Beautiful card is generated with user's data
3. **Reward Grant:** Trésor item added to inventory
4. **Public Announcement:** Card posted to channel #1459283080576766044
5. **User Mention:** User is @mentioned in the announcement

## Benefits

✅ **Highly Engaging:** Visual cards are more exciting than text notifications
✅ **Professional Design:** Gradient backgrounds and careful typography
✅ **Dynamic Content:** Each card is personalized with user data
✅ **Automatic:** No manual intervention required
✅ **Consistent:** Same beautiful design across all XP sources
✅ **Encouragement:** Footer message promotes continued engagement
✅ **Public Recognition:** Celebrates achievements in the community

## Files Modified

1. `package.json` - Added canvas dependency
2. `bot.js` - Updated 3 level-up notification points
3. `utils/gameXPHelper.js` - Updated game level-up notifications
4. `utils/levelUpCardHelper.js` - New card generator module
5. `.gitignore` - Added test image exclusions
6. `test-level-up-card.js` - New test script

## Future Enhancements (Optional)

Potential improvements that could be added later:
- Different card themes based on level milestones (e.g., special design for level 50, 100)
- Animated GIF cards for major milestones
- Seasonal themes (holiday variants)
- Level-specific rewards beyond Trésor
- Leaderboard integration on cards
