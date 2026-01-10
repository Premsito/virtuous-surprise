# Admin Access Control System

## Overview
This document describes the admin access control system implemented in the virtuous-surprise Discord bot to restrict sensitive administrative commands to a specific user.

## Admin User ID
The bot restricts admin-level commands to the user with the following Discord ID:
```
473336458715987970
```

## Implementation

### Admin Helper Module
Location: `utils/adminHelper.js`

```javascript
const ADMIN_USER_ID = '473336458715987970';

function isAdmin(userId) {
    return userId === ADMIN_USER_ID;
}
```

### Protected Commands

#### Moderation Commands (commands/moderation.js)
- **!setlc** - Set a user's LC balance
- **!setinvites** - Set a user's invite count
- **!giveitem** / **!givebonus** - Give items to a user's inventory

#### Lottery Commands (commands/loto.js)
- **!loto setjackpot** - Set the lottery jackpot amount

### Before Changes
Previously, these commands were restricted to users with Discord Administrator permissions:
```javascript
if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
    return message.reply(getResponse('moderation.noPermission'));
}
```

### After Changes
Now restricted to the specific admin user ID:
```javascript
const { isAdmin } = require('../utils/adminHelper');

if (!isAdmin(message.author.id)) {
    return message.reply(getResponse('moderation.noPermission'));
}
```

## Benefits

1. **Centralized Control**: Single point of control for admin permissions
2. **Enhanced Security**: Only one specific user can execute admin commands
3. **Maintainability**: Easy to update admin ID in one location
4. **Consistency**: All admin checks use the same helper function

## Usage

### For Developers
To add admin restrictions to a new command:

```javascript
const { isAdmin } = require('../utils/adminHelper');

async function execute(message, args) {
    if (!isAdmin(message.author.id)) {
        return message.reply(getResponse('moderation.noPermission'));
    }
    
    // Admin-only logic here
}
```

### For Server Administrators
Only the user with ID `473336458715987970` can execute the following commands:
- `!setlc @user [amount]` - Set user's LC balance
- `!setinvites @user [count]` - Set user's invite count  
- `!giveitem @user [item_type] [quantity]` - Give items to user
- `!givebonus @user [item_type] [quantity]` - Alternative command for giving items
- `!loto setjackpot [amount]` - Set lottery jackpot

All other users, including those with Discord Administrator permissions, will receive a "no permission" error when attempting to use these commands.

## Error Messages
When a non-admin user attempts to use an admin command, they receive:
```
❌ Vous n'avez pas la permission d'utiliser cette commande.
```
(Configured in `responses.json` under `moderation.noPermission`)

## Security Considerations
- User ID is hardcoded to prevent unauthorized changes
- All admin checks happen server-side
- No client-side permission bypasses possible
- CodeQL security scan shows no vulnerabilities

## Testing
To verify admin restrictions:
1. As the admin user (473336458715987970), test each protected command
2. As a non-admin user (even with Discord Administrator role), attempt to use each command
3. Verify non-admin users receive permission denied error
4. Verify admin user can successfully execute all commands

## Future Enhancements
Potential improvements:
- Support for multiple admin user IDs
- Role-based admin tiers (super admin, moderator, etc.)
- Admin action logging
- Temporary admin permissions delegation
