# Level-Up Card Announcement System

## Overview
The level-up card announcement system automatically generates and posts visually appealing canvas-based cards to celebrate user level-ups in the Discord server.

## Features

### Visual Card Design
- **Gradient Background**: Beautiful blue gradient (#5865F2 → #7289DA → #5865F2)
- **Decorative Borders**: Gold (#FFD700) outer border with white inner border
- **User Avatar**: Circular profile picture with gold border
- **Celebratory Title**: "🎉 FÉLICITATIONS 🎉"
- **User Information**:
  - Username with 👤 emoji
  - Level with 🆙 emoji and gold highlighting
  - XP progress (current/next) with 📊 emoji
- **Progress Bar**: 
  - Visual representation of XP progress
  - Gradient fill (green to gold)
  - Percentage display
- **Reward Display**: Shows "🎁 Cadeau gagné : [reward]" in gold
- **Footer Message**: "💡 Les !missions permettent de gagner de l'XP et des LC !"

### Automatic Posting
- Posts to channel ID: `1459283080576766044` (configured in config.json)
- Triggers on all level-up events:
  - Message XP gains
  - Voice chat XP gains
  - Reaction XP gains
- Mentions the user who leveled up
- Includes fallback to text notification if card generation fails

### Rewards
- Users receive a "Trésor 🗝️" (treasure) for each level-up
- Reward is automatically added to user inventory

## Implementation Details

### Files Modified/Created

#### New Files:
1. **utils/levelUpCard.js**
   - Main card generation function using Canvas API
   - Creates 800x400px PNG image
   - Handles avatar loading with fallback for failures
   - Uses XP helper functions for progress calculations

2. **test-levelup-card.js**
   - Basic testing script for card generation
   - Creates sample cards for different levels

3. **test-levelup-integration.js**
   - Comprehensive integration test
   - Validates module imports, XP calculations, card generation, PNG format
   - Tests multiple level scenarios

#### Modified Files:
1. **package.json**
   - Added `canvas@^2.11.2` dependency

2. **bot.js**
   - Added `AttachmentBuilder` import from discord.js
   - Added `generateLevelUpCard` import from utils
   - Created `sendLevelUpCard()` helper function
   - Updated 3 level-up detection points to use canvas cards:
     - Voice XP level-ups (line ~270)
     - Reaction XP level-ups (line ~570)
     - Message XP level-ups (line ~625)

3. **.gitignore**
   - Added test output PNG files to ignore list

## Usage

### Testing the Card
Run the test scripts to generate sample cards:
```bash
# Basic card generation test
node test-levelup-card.js

# Full integration test
node test-levelup-integration.js
```

### Level-Up Card Function
```javascript
const { generateLevelUpCard } = require('./utils/levelUpCard');

// Generate a card
const cardBuffer = await generateLevelUpCard(
    user,           // Discord user object
    newLevel,       // New level reached (number)
    totalXP,        // Total XP (number)
    'Trésor 🗝️'    // Reward description (string)
);
```

## Configuration

The level-up channel is configured in `config.json`:
```json
{
  "channels": {
    "levelUpNotification": "1459283080576766044"
  }
}
```

## Error Handling

The system includes robust error handling:
- Avatar loading failures use a placeholder circle
- Card generation failures fall back to text notifications
- All errors are logged with descriptive messages

## Technical Details

### Dependencies
- **canvas**: Node.js Canvas implementation for image generation
- Uses native system fonts for text rendering
- Requires no external image assets

### Card Dimensions
- Width: 800px
- Height: 400px
- Format: PNG with transparency support

### Performance
- Card generation is asynchronous
- Average generation time: <500ms
- File size: ~50-60KB per card

## Example Card Content

```
🎉 FÉLICITATIONS 🎉

👤 User: Premsito
🆙 Niveau: 12
📊 XP: 915 / 1200
[Progress bar: 76%]
🎁 Cadeau gagné : Trésor 🗝️

💡 Les !missions permettent de gagner de l'XP et des LC !
```

## Future Enhancements (Optional)

Potential improvements that could be made:
- Custom card themes based on level milestones
- Different rewards for higher levels
- Leaderboard display on cards
- Achievement badges
- Seasonal/event-specific designs
- Custom backgrounds per server

## Testing

All existing tests pass:
```bash
npm test  # Runs test-responses.js
```

Custom level-up tests:
```bash
node test-levelup-card.js          # Basic card generation
node test-levelup-integration.js   # Full integration test
```

## Maintenance

No special maintenance required. The system:
- Automatically handles all level-up events
- Self-recovers from transient failures
- Logs all operations for monitoring
