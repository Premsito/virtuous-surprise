# Interactive Giveaway Menu - Visual Guide

## Overview
This document demonstrates the new interactive menu system for creating giveaways using the `!giveaway` command.

## Command Usage

### Opening the Menu
```
!giveaway
```

### Menu Interface

When an admin runs `!giveaway`, they see this interactive menu:

```
╔══════════════════════════════════════════════════════════════╗
║              🎁 Configuration du Giveaway                    ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  Cliquez sur les boutons ci-dessous pour configurer         ║
║  votre giveaway :                                            ║
║                                                              ║
║  Titre                 │  Récompense           │  Durée      ║
║  _Non défini_          │  _Non défini_         │  _Non défini_║
║                                                              ║
║  Gagnants              │  Quantité                           ║
║  _Non défini_          │  _Non défini_                       ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  Configurez tous les paramètres puis cliquez sur Lancer     ║
╚══════════════════════════════════════════════════════════════╝

   [📝 Titre]  [🌟 Récompense]  [⏲️ Durée]
   
   [🏆 Gagnants]  [🎁 Quantité]
   
   [🚀 Lancer (disabled)]  [❌ Annuler]
```

## Configuration Flow

### Step 1: Set Title
Admin clicks **📝 Titre**

Bot responds (ephemeral):
```
📝 Veuillez entrer le titre du giveaway :
```

Admin types:
```
Nitro
```

Menu updates to show:
```
Titre: Nitro
```

### Step 2: Set Reward
Admin clicks **🌟 Récompense**

Bot responds (ephemeral):
```
🌟 Veuillez entrer la récompense du giveaway :
```

Admin types:
```
Nitro 🎁
```

Menu updates to show:
```
Récompense: Nitro 🎁
```

### Step 3: Set Duration
Admin clicks **⏲️ Durée**

Bot responds (ephemeral):
```
⏲️ Veuillez entrer la durée en minutes :
```

Admin types:
```
10
```

Menu updates to show:
```
Durée: 10 minutes
```

### Step 4: Set Winners
Admin clicks **🏆 Gagnants**

Bot responds (ephemeral):
```
🏆 Veuillez entrer le nombre de gagnants :
```

Admin types:
```
1
```

Menu updates to show:
```
Gagnants: 1
```

### Step 5: Set Quantity
Admin clicks **🎁 Quantité**

Bot responds (ephemeral):
```
🎁 Veuillez entrer la quantité de récompenses :
```

Admin types:
```
1
```

Menu updates to show:
```
Quantité: 1
```

**Launch button is now enabled!**

### Step 6: Launch Giveaway
Admin clicks **🚀 Lancer**

Bot responds (ephemeral):
```
🚀 Lancement du giveaway...
```

Menu is deleted and replaced with the public giveaway:

```
╔══════════════════════════════════════════════════════════════╗
║                    🎉 GIVEAWAY 🎁                            ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  🌟 Récompense : Nitro 🎁 x1                                 ║
║  🏆 Nombre de gagnants : 1                                   ║
║  👥 Participants : 0                                         ║
║                                                              ║
║  ⏲️ Fin dans : 10 minutes                                    ║
║  📢 Cliquez sur Participer pour tenter votre chance !        ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

Se termine le: [timestamp]

   [🎯 Participer]
```

## Features

### ✅ Interactive Configuration
- Button-based interface
- No need to remember complex command syntax
- Visual feedback as fields are filled

### ✅ Real-Time Updates
- Menu updates immediately when a field is set
- Launch button enabled only when all fields are complete

### ✅ Input Validation
- Duration must be a positive number
- Winners must be a positive number
- Quantity must be a positive number
- Invalid inputs show error messages

### ✅ Timeout Handling
- Each field has a 60-second timeout
- Menu is cancelled if user doesn't respond in time

### ✅ Cancel Anytime
- Admin can click **❌ Annuler** to cancel configuration
- Menu is deleted and configuration is discarded

### ✅ Backward Compatible
- Existing commands still work:
  - `!giveaway créer [titre] [objet] [durée] [gagnants] [quantité]`
  - `!giveaway terminer [titre]`
  - `!giveaway winner [titre] @mention`

## Error Handling

### Invalid Duration
```
❌ Durée invalide. La durée doit être un nombre positif de minutes.
```

### Invalid Winners Count
```
❌ Nombre de gagnants invalide. Doit être un nombre positif.
```

### Invalid Quantity
```
❌ Quantité invalide. Doit être un nombre positif.
```

### Timeout
```
⏱️ Délai d'attente expiré. Configuration annulée.
```

### Incomplete Configuration
If admin tries to launch without setting all fields:
```
⚠️ Veuillez configurer tous les paramètres avant de lancer le giveaway.
```

## Comparison: Old vs New

### Old Method (Still Supported)
```
!giveaway créer Nitro "Nitro 🎁" 10 1 1
```
- Requires remembering exact syntax
- No visual feedback during configuration
- Easy to make mistakes with quotes and numbers

### New Method
```
!giveaway
```
Then click buttons and fill in values one at a time
- Intuitive interface
- Real-time visual feedback
- Validation prevents mistakes
- Much easier for admins to use

## Benefits

1. **Simplified Process**: No need to remember complex command syntax
2. **Visual Feedback**: See configuration update in real-time
3. **Error Prevention**: Validation catches mistakes immediately
4. **User-Friendly**: Button-based interface is more intuitive
5. **Professional**: Clean, modern Discord UI using embeds and buttons
