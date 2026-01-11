# Level-Up Card Visual Design

## Card Layout (800x400px)

```
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║                     🎉 FÉLICITATIONS 🎉                              ║
║                                                                      ║
║    ┌─────┐                                                          ║
║    │     │   👤 User: Premsito                                      ║
║    │ 👤  │   🆙 Niveau: 12                                          ║
║    │     │   📊 XP: 915 / 1200                                      ║
║    └─────┘   ┌────────────────────────────────────┐                ║
║              │████████████████░░░░░░░░░░░░░░░░    │  76%           ║
║              └────────────────────────────────────┘                ║
║                                                                      ║
║              🎁 Cadeau gagné : Trésor 🗝️                           ║
║                                                                      ║
║          💡 Les !missions permettent de gagner de l'XP et des LC !  ║
╚══════════════════════════════════════════════════════════════════════╝
```

## Color Scheme

### Background
- **Gradient**: Blue gradient (#5865F2 → #7289DA → #5865F2)
- Creates a professional Discord-themed look

### Borders
- **Outer Border**: Gold (#FFD700) - 8px width
- **Inner Border**: White (#FFFFFF) - 2px width
- Adds elegance and frames the content

### Text Colors
- **Title**: White (#FFFFFF) - "🎉 FÉLICITATIONS 🎉"
- **Username**: White (#FFFFFF) - User information
- **Level**: Gold (#FFD700) - Highlighted to draw attention
- **XP Info**: White (#FFFFFF) - Progress details
- **Reward**: Gold (#FFD700) - Emphasizes the prize
- **Footer**: Light Gray (#E0E0E0) - Subtle guidance text

### Avatar
- **Border**: Gold (#FFD700) - 4px circular border
- **Size**: 100x100px
- **Fallback**: Discord blue circle (#7289DA) if avatar fails to load

### Progress Bar
- **Background**: Dark gray (#2C2F33)
- **Fill**: Gradient from green (#57F287) to gold (#FFD700)
- **Border**: White (#FFFFFF) - 2px
- **Height**: 25px
- **Width**: 350px
- **Percentage**: Centered white text showing exact progress

## Typography

### Fonts
- **Title**: Bold 48px sans-serif
- **Username**: Bold 28px sans-serif
- **Level**: Bold 28px sans-serif
- **XP Info**: 24px sans-serif
- **Progress %**: Bold 16px sans-serif
- **Reward**: Bold 26px sans-serif
- **Footer**: 20px sans-serif

## Layout Positioning

### Elements
1. **Title** (top center): Y=70px
2. **Avatar** (left side): X=80px, Y=120px
3. **User Info** (right of avatar): X=220px, starting Y=135px
4. **Progress Bar**: Below user info, with 35px line spacing
5. **Reward**: Centered below progress bar
6. **Footer**: Y=360px (40px from bottom)

## Design Philosophy

### Visual Hierarchy
1. Title draws immediate attention
2. Avatar provides personalization
3. Level number in gold emphasizes achievement
4. Progress bar offers visual satisfaction
5. Reward creates excitement
6. Footer provides actionable guidance

### User Experience
- **Instant Recognition**: User avatar makes it personal
- **Clear Achievement**: Level number is prominent and gold
- **Progress Feedback**: Visual bar shows how far they've come
- **Motivation**: Reward and footer encourage continued engagement
- **Professional**: Matches Discord's visual language

### Accessibility
- High contrast white text on blue background
- Large, readable fonts
- Visual and textual progress indicators
- Emojis for quick visual scanning

## Example Scenarios

### Low Level (Level 5)
```
🎉 FÉLICITATIONS 🎉
👤 User: NewPlayer
🆙 Niveau: 5
📊 XP: 250 / 500
[Progress bar: 50%]
🎁 Cadeau gagné : Trésor 🗝️
```

### Mid Level (Level 12)
```
🎉 FÉLICITATIONS 🎉
👤 User: Premsito
🆙 Niveau: 12
📊 XP: 915 / 1200
[Progress bar: 76%]
🎁 Cadeau gagné : Trésor 🗝️
```

### High Level (Level 20)
```
🎉 FÉLICITATIONS 🎉
👤 User: ProPlayer
🆙 Niveau: 20
📊 XP: 1900 / 2000
[Progress bar: 95%]
🎁 Cadeau gagné : Trésor 🗝️
```

## Technical Implementation

The card is generated using the Node.js Canvas library:
- Pure programmatic rendering (no image templates needed)
- Dynamic content based on user data
- Gradients and anti-aliasing for smooth visuals
- Fallback handling for network issues
- ~50-60KB file size per card
- PNG format with full transparency support

## Future Enhancement Ideas

- **Milestone Levels**: Special designs for levels 10, 25, 50, 100
- **Seasonal Themes**: Holiday-specific backgrounds
- **Custom Rewards**: Different rewards displayed based on level tier
- **Achievements**: Badge icons for special accomplishments
- **Leaderboard Rank**: Show user's position in server
- **Animated Versions**: GIF cards with sparkle effects
- **Custom Backgrounds**: User-selected themes
- **Server Branding**: Custom colors matching server identity
