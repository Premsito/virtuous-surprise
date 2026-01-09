# Inventory System User Flow

This document shows the complete user experience flow for the bonus items system.

## Flow 1: Viewing and Using the Inventory

### Step 1: Player Opens Inventory
**Command**: `!sac`

**Result**:
```
🎒 Sac de PlayerName

⚡ Bonus Actif
🎫 Multiplieur x2 - 1 partie(s) restante(s)

📦 Vos items disponibles:

🎁 Jackpot x3
└ Ouvre un jackpot pour gagner des LC aléatoires (50, 100, 250 ou 1000 LC)

🎫 Multiplieur x2 x5
└ Active un bonus x2 LC pour vos 2 prochaines parties

🎫 Multiplieur x3 x2
└ Active un bonus x3 LC pour vos 2 prochaines parties

[Ouvrir Jackpot 🎁 (3)] [Activer x2 🎫 (5)] [Activer x3 🎫 (2)]
```

### Step 2A: Player Opens a Jackpot
**Action**: Click "Ouvrir Jackpot 🎁" button

**Result**:
```
🎁 Jackpot Ouvert !

🎉 Félicitations PlayerName !

Vous avez gagné 250 LC 💰
```

**Inventory Updates Automatically**:
- Jackpot quantity: 3 → 2
- LC balance: +250

### Step 2B: Player Activates a Multiplier
**Action**: Click "Activer x2 🎫" button

**Result**:
```
🎫 Multiplieur Activé !

✨ Multiplieur x2 activé !

Vos 2 prochaines parties donneront x2 LC 🎮
```

**Inventory Updates Automatically**:
- Multiplieur x2 quantity: 5 → 4
- Active multiplier displayed in inventory
- Cannot activate another multiplier until this one expires

### Step 2C: Player Tries to Activate Another Multiplier (Error Case)
**Action**: Click "Activer x3 🎫" button while x2 is active

**Result**:
```
❌ Vous avez déjà un multiplieur x2 actif avec 2 partie(s) restante(s) !
```

## Flow 2: Using Multipliers in Games

### Game 1: Blackjack with Active Multiplier

**Command**: `!bj 100`

**Initial Message**:
```
🃏 Blackjack — Votre Main

➤ Cartes : 🂱 10 ♠, 🂻 J ♠ (20)
➤ Croupier : 🂵 5 ♠, [?]

💡 Tapez 'tirer' pour une carte ou 'rester' pour vous arrêter

[Tirer 🃏] [Rester 🔒]
```

**After Standing and Winning**:
```
🏆 Blackjack - Gagné !

🎴 Vos cartes : 🂱 10 ♠, 🂻 J ♠ (20)
🎭 Cartes croupier : 🂵 5 ♠, 🂹 9 ♠ (14)

✨ Vous avez battu le croupier! Vous gagnez 200 LC!

🎫 Multiplieur x2 appliqué! (200 LC → 400 LC)

🎫 Multiplieur x2 activé! Votre 1 prochaine(s) partie(s) donneront x2 LC.
```

**Result**:
- Base winnings: 200 LC
- With multiplier: 400 LC awarded
- Multiplier games remaining: 2 → 1

### Game 2: Roulette with Active Multiplier

**Command**: `!roue 50 rouge`

**Suspense Message**:
```
🎰 Les jeux sont faits, rien ne va plus ! 🎲
[Spinning roulette GIF]
```

**After Win**:
```
🏆 Roulette - Gagné !

🎲 Résultat de la roulette 🎯 : 🟥 Rouge
🎉 Félicitations, @PlayerName! Tu remportes 100 LC !

🎫 Multiplieur x2 appliqué! (100 LC → 200 LC)
```

**Result**:
- Base winnings: 100 LC
- With multiplier: 200 LC awarded
- Multiplier games remaining: 1 → 0 (expires)
- Multiplier automatically removed from active list

### Game 3: After Multiplier Expires

**Command**: `!jeu duel @Opponent 100`

**Normal Win (No Multiplier)**:
```
🏆 Duel - Victoire de PlayerName !

...

💰 Gains : 200 LC
```

**Result**:
- Normal winnings (no multiplier)
- Can activate a new multiplier if available

## Flow 3: Admin Giving Items

### Admin Command
**Command**: `!giveitem @PlayerName jackpot 10`

**Result**:
```
✅ Item Donné

Jackpot 🎁 x10 a été donné à @PlayerName
```

**Player Inventory Updates**:
- Jackpot quantity increases by 10
- Player can now use `!sac` to see and use items

## Item Probabilities

### Jackpot Rewards
- **50 LC**: 50% chance (common)
- **100 LC**: 30% chance (uncommon)
- **250 LC**: 15% chance (rare)
- **1000 LC**: 5% chance (epic)

## Key Features

### Automatic Updates
- ✅ Inventory display updates after each item use
- ✅ Button labels show current quantities
- ✅ Empty inventory shows helpful message
- ✅ Active multipliers clearly displayed

### Multiplier Tracking
- ✅ Only one multiplier active at a time
- ✅ Multipliers apply to ALL compatible games
- ✅ Games remaining counter decrements automatically
- ✅ Expired multipliers auto-cleanup
- ✅ Clear notifications before and after each game

### Compatible Games
- ✅ Duel (`!jeu duel`)
- ✅ Roulette (`!jeu roulette`)
- ✅ Roue (`!roue`)
- ✅ Blackjack (`!bj`)
- ✅ Machine à Sous (`!machine`)

### Safety Features
- ✅ Cannot use items you don't have
- ✅ Cannot activate multiple multipliers
- ✅ Quantities never go negative
- ✅ Database transactions ensure consistency
- ✅ Button interactions verify ownership

## Integration with Existing Systems

### LC Balance
- Jackpot rewards add directly to LC balance
- Multipliers increase LC from game wins
- All transactions recorded in database

### Game History
- Games with multipliers record final winnings
- Multiplier usage tracked per game
- Statistics remain accurate

### Admin Tools
- Admins can give items for events/rewards
- Testing and debugging support
- No impact on normal gameplay
