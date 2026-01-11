# Visual Example - Rankings Display

This document shows exactly how the rankings will appear in Discord when posted.

## 📊 Complete Rankings Display

The system posts 3 separate embeds to the rankings channel:

---

### Embed 1: LC Podium
```
┌─────────────────────────────────────────┐
│ 💰 Podium LC                            │
│ [Gold color theme]                      │
├─────────────────────────────────────────┤
│                                         │
│ 🥇 User1                                │
│ └─ 4200 LC                              │
│                                         │
│ 🥈 User2                                │
│ └─ 3800 LC                              │
│                                         │
│ 🥉 User3                                │
│ └─ 3600 LC                              │
│                                         │
│ [User1's avatar as thumbnail →]         │
│                                         │
│ Timestamp: [Current time]               │
└─────────────────────────────────────────┘
```

---

### Embed 2: Levels Podium
```
┌─────────────────────────────────────────┐
│ ⭐ Podium Niveaux                       │
│ [Primary blue color theme]              │
├─────────────────────────────────────────┤
│                                         │
│ 🥇 UserAlpha                            │
│ └─ Niveau 15                            │
│                                         │
│ 🥈 UserBeta                             │
│ └─ Niveau 12                            │
│                                         │
│ 🥉 UserGamma                            │
│ └─ Niveau 10                            │
│                                         │
│ [UserAlpha's avatar as thumbnail →]     │
│                                         │
│ Timestamp: [Current time]               │
└─────────────────────────────────────────┘
```

---

### Embed 3 & 4: Rankings Tables (Side-by-Side)

These two embeds appear side-by-side in Discord:

```
┌──────────────────────────────┐  ┌──────────────────────────────┐
│ 📊 Classement LC - Top 10    │  │ 🏆 Classement Niveaux - Top 10│
│ [Blue color theme]           │  │ [Primary color theme]         │
├──────────────────────────────┤  ├──────────────────────────────┤
│                              │  │                              │
│ 🥇 User1 → 4200 LC          │  │ 🥇 UserAlpha → Niveau 15    │
│ 🥈 User2 → 3800 LC          │  │ 🥈 UserBeta → Niveau 12     │
│ 🥉 User3 → 3600 LC          │  │ 🥉 UserGamma → Niveau 10    │
│ 4. User4 → 3200 LC          │  │ 4. UserDelta → Niveau 9     │
│ 5. User5 → 3000 LC          │  │ 5. UserTheta → Niveau 8     │
│ 6. User6 → 2800 LC          │  │ 6. UserEpsilon → Niveau 7   │
│ 7. User7 → 2500 LC          │  │ 7. UserZeta → Niveau 6      │
│ 8. User8 → 2200 LC          │  │ 8. UserEta → Niveau 5       │
│ 9. User9 → 2000 LC          │  │ 9. UserKappa → Niveau 4     │
│ 10. User10 → 1800 LC        │  │ 10. UserLambda → Niveau 3   │
│                              │  │                              │
│ Timestamp: [Current time]    │  │ Timestamp: [Current time]    │
└──────────────────────────────┘  └──────────────────────────────┘
```

---

## 🎨 Color Scheme

The embeds use the following colors from config.json:

1. **LC Podium**: `#FFD700` (Gold) - Represents wealth/currency
2. **Levels Podium**: `#5865F2` (Primary Blue) - Discord's signature color
3. **LC Rankings Table**: `#3498db` (Blue) - Professional blue
4. **Levels Rankings Table**: `#5865F2` (Primary Blue) - Consistent with podium

## 📸 Profile Picture Display

### In Podiums:
- The **1st place user's avatar** is displayed as the embed thumbnail
- This makes the 1st place user's profile picture appear larger and more prominent
- Other users in the podium (2nd and 3rd) don't have their avatars shown separately

### Visual Hierarchy:
```
🥇 1st Place: [LARGE AVATAR THUMBNAIL] + Medal + Username + Value
🥈 2nd Place: Medal + Username + Value (no separate avatar)
🥉 3rd Place: Medal + Username + Value (no separate avatar)
```

This creates a clear visual hierarchy where the winner stands out.

## 🔄 Update Behavior

Every 15 minutes, the bot:

1. **Fetches** the rankings channel (#1460012957458235618)
2. **Clears** old messages (up to 50 recent messages)
3. **Posts** fresh rankings in this order:
   - LC Podium embed
   - Levels Podium embed  
   - LC Rankings table + Levels Rankings table (side-by-side)

## 💬 Manual Trigger

Users can manually trigger a rankings display with:
- `!rankings` - Shows rankings in current channel
- `!classement` - Same as above (French alternative)

The command message is automatically deleted after execution.

## 📱 Mobile vs Desktop Display

### Desktop:
- Two ranking tables appear truly side-by-side
- All embeds are clearly visible
- Profile pictures render at full quality

### Mobile:
- Tables stack vertically instead of side-by-side
- All information remains fully accessible
- Profile pictures scale appropriately

## ⚡ Real-time Updates

The rankings reflect the current state of the database:
- LC balances from user transactions
- Levels from XP accumulation
- No caching - always up-to-date data

## 🎯 Key Visual Features

✅ **Clear Medal System**: Instant recognition of top 3
✅ **Color Coding**: Different colors for LC vs Levels
✅ **Profile Pictures**: Winner's avatar prominently displayed
✅ **Clean Layout**: Organized, easy to read
✅ **Consistent Styling**: Matches existing bot aesthetics
✅ **Responsive**: Works on all devices

## 📊 Data Freshness

- Auto-updates: Every 15 minutes
- Manual updates: On command (!rankings)
- Database queries: Live data (no cache)
- Display: Immediate (< 2 seconds to fetch and post)

---

This visual representation helps understand the final user experience when the rankings are displayed in Discord.
