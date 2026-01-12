# Visual Examples: Discord Embed Pancartes

This document shows visual representations of the new Discord Embed pancartes for level-up notifications.

## Example 1: Milestone Level 5 - Grand Trésor 💎

```
╔════════════════════════════════════════════════════════╗
║              🎉 Félicitations 🎉                       ║
║                                                        ║
║       **Tu as atteint le Niveau 5** 🏆                ║
║                                                        ║
║  [User Avatar]                                         ║
║                                                        ║
║  📊 Progression XP                🎁 Récompense        ║
║  250 / 500 XP (50%)              Grand trésor: 88 LC 💰║
║                                                        ║
║  Continue jusqu'au niveau 10 pour le prochain trésor ! 💎
╚════════════════════════════════════════════════════════╝
Color: GOLDEN (#FFD700)
```

## Example 2: Milestone Level 10 - Trésor Épique 💎⚡

```
╔════════════════════════════════════════════════════════╗
║              🎉 Félicitations 🎉                       ║
║                                                        ║
║       **Tu as atteint le Niveau 10** 🏆               ║
║                                                        ║
║  [User Avatar]                                         ║
║                                                        ║
║  📊 Progression XP                🎁 Récompense        ║
║  500 / 1000 XP (50%)             Trésor épique: 237 LC 💰
║                                  + x2 XP Boost (1h) ⚡ ║
║                                                        ║
║  Continue jusqu'au niveau 15 pour le prochain trésor ! 💎
╚════════════════════════════════════════════════════════╝
Color: GOLDEN (#FFD700)
```

## Example 3: Intermediate Level 3 - Bonus LC Boost ⚡

```
╔════════════════════════════════════════════════════════╗
║              🎉 Félicitations 🎉                       ║
║                                                        ║
║       **Tu as atteint le Niveau 3** 🏆                ║
║                                                        ║
║  [User Avatar]                                         ║
║                                                        ║
║  📊 Progression XP                🎁 Récompense        ║
║  150 / 300 XP (50%)              x2 LC Boost (1h) 💎   ║
║                                                        ║
║  💡 Les !missions permettent de gagner de l'XP et des LC !
╚════════════════════════════════════════════════════════╝
Color: SUCCESS (#57F287)
```

## Example 4: Even Level 8 - Fixed LC Reward 💰

```
╔════════════════════════════════════════════════════════╗
║              🎉 Félicitations 🎉                       ║
║                                                        ║
║       **Tu as atteint le Niveau 8** 🏆                ║
║                                                        ║
║  [User Avatar]                                         ║
║                                                        ║
║  📊 Progression XP                🎁 Récompense        ║
║  400 / 800 XP (50%)              +20 LC 💰             ║
║                                                        ║
║  💡 Les !missions permettent de gagner de l'XP et des LC !
╚════════════════════════════════════════════════════════╝
Color: PRIMARY (#5865F2)
```

## Example 5: Milestone Level 15 - Trésor Légendaire 💎

```
╔════════════════════════════════════════════════════════╗
║              🎉 Félicitations 🎉                       ║
║                                                        ║
║       **Tu as atteint le Niveau 15** 🏆               ║
║                                                        ║
║  [User Avatar]                                         ║
║                                                        ║
║  📊 Progression XP                🎁 Récompense        ║
║  750 / 1500 XP (50%)             Trésor légendaire: 361 LC 💰
║                                  + x2 LC Boost (1h) 💎 ║
║                                                        ║
║  Continue jusqu'au niveau 20 pour le prochain trésor ! 💎
╚════════════════════════════════════════════════════════╝
Color: GOLDEN (#FFD700)
```

## Color Legend

| Reward Type | Color | Hex Code | When Applied |
|-------------|-------|----------|--------------|
| Milestone/Treasure | 🟡 GOLDEN | #FFD700 | Levels 5, 10, 15, 20, 25... |
| LC Boost | 🟢 SUCCESS | #57F287 | Odd levels with LC boost |
| XP Boost | 🟡 WARNING | #FEE75C | Odd levels with XP boost |
| Fixed LC Reward | 🔵 PRIMARY | #5865F2 | Even levels (2, 4, 6, 8...) |

## Key Features Visible in Examples

✅ **User Avatar**: Displayed as thumbnail at the top of each pancarte
✅ **"🎉 Félicitations"**: Celebratory title on all pancartes
✅ **"Tu as atteint le Niveau {X}"**: Clear level achievement message
✅ **Dynamic Rewards**: Different rewards based on level type
✅ **XP Progress**: Shows current/next level XP with percentage
✅ **Color Coding**: Golden for treasures, success/warning for boosts
✅ **Footer Messages**: Contextual messages for motivation

## Comparison: Old vs New

### Old System (Canvas-based PNG)
- Generated 800x400px PNG images
- Required Canvas library
- Larger file sizes (~50-60KB per card)
- More processing overhead
- Font rendering issues possible
- Not mobile-optimized

### New System (Discord Embeds)
- Native Discord embeds
- No image generation needed
- Minimal payload size
- Instant rendering
- Better mobile support
- Respects user theme preferences
- More accessible

## Discord Display

When displayed in Discord, these pancartes will appear as rich embeds with:
- Colored left border matching the reward type
- User avatar as a circular thumbnail
- Inline fields for XP and reward
- Proper timestamp
- User mention above the embed

The pancartes are sent to the `#📘 niveaux` channel (ID: 1459283080576766044) automatically whenever a user levels up through message XP, voice XP, or reaction XP.
