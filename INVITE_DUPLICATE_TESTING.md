# Testing Duplicate Invitation Prevention

This document explains how to test the duplicate invitation prevention feature in the virtuous-surprise Discord bot.

## Overview

The bot now includes comprehensive debug logging and strict validation to prevent duplicate invitations from being counted. The anti-cheat system uses the `invite_history` table with a composite PRIMARY KEY to ensure each user can only be invited once by any specific inviter.

## Debug Logs Added

### Bot-Level Logs (bot.js)
When a new member joins via an invite, the following logs are generated:

```
Inviter ID: <inviter_user_id>, Invited ID: <invited_user_id>
Verifying invitation from <inviter_username> for <invited_username>
Checking invite history for duplicates...
```

**If duplicate detected:**
```
🚫 Duplicate invite blocked: <inviter_username> -> <invited_username>
Sent duplicate invite notification to channel <channel_id>
```

**If validation passes:**
```
✅ Invite validation passed - invite is unique
Creating/fetching inviter user record...
Found existing inviter record for <inviter_username>
Creating/fetching invited user record...
Created new invited user record for <invited_username>
Adding invite to history table...
✅ Invite successfully added to history
Incrementing invite count for <inviter_username>...
Rewarding 25 LC to both users...
✅ <inviter_username> invited <invited_username> (unique invite)
   Total invites for <inviter_username>: <count>
```

### Database-Level Logs (db.js)
The database layer also provides detailed logging:

**Checking invite history:**
```
[DB] checkInviteHistory(<inviter_id>, <invited_id>) = false
```

**Adding new invite:**
```
[DB] Successfully added invite history: <inviter_id> -> <invited_id>
```

**Duplicate detected at database level:**
```
[DB] Duplicate key violation: invite already exists <inviter_id> -> <invited_id>
```

## Testing Procedure

### Prerequisites
1. Discord bot is running and connected to the server
2. PostgreSQL database is configured and running
3. Invite tracking channel is set up in `config.json`

### Test Case 1: First-Time Invitation (Should Succeed)
1. Create a test Discord account (Account A)
2. Generate an invite link from your main account
3. Have Account A join the server using that invite
4. **Expected Result:**
   - Console shows all validation steps passing
   - Invite count increments by 1
   - Both users receive 25 LC reward
   - Success message appears in invite tracking channel
   - Database records the invitation in `invite_history` table

### Test Case 2: Duplicate Invitation Attempt (Should Fail)
1. Have Account A leave the server
2. Use the same invite link (or any invite from the same inviter)
3. Have Account A rejoin the server
4. **Expected Result:**
   - Console shows: `🚫 Duplicate invite blocked`
   - Invite count remains unchanged
   - No LC rewards distributed
   - Duplicate notification appears in invite tracking channel: "🚫 L'invitation n'a pas été comptée, cet utilisateur a déjà été invité !"
   - Database query finds existing record in `invite_history`

### Test Case 3: Race Condition Protection
1. Create two test accounts simultaneously
2. Have both accounts attempt to join within milliseconds using the same invite
3. **Expected Result:**
   - First invitation succeeds
   - Second invitation blocked at database level
   - Console shows duplicate key violation if race condition occurs
   - Only one invitation counted

### Test Case 4: Different Inviters (Should Succeed Once Per Inviter)
1. Account A is invited by User 1 (succeeds)
2. Account A leaves
3. Account A is invited by User 2 (should succeed - different inviter)
4. **Expected Result:**
   - Both invitations succeed
   - Both User 1 and User 2 get invite credit
   - Database has two separate records in `invite_history`

## Monitoring in Production

### Real-Time Monitoring
Monitor the bot's console output for:
- Any "🚫 Duplicate invite blocked" messages
- Successful invitation flow logs
- Database operation confirmations

### Database Verification
Query the `invite_history` table to verify invite tracking:

```sql
-- Check all invitations for a specific user
SELECT * FROM invite_history WHERE invited_id = 'USER_ID';

-- Check duplicate prevention is working (should return 0 or 1 per inviter-invited pair)
SELECT inviter_id, invited_id, COUNT(*) as count 
FROM invite_history 
GROUP BY inviter_id, invited_id 
HAVING COUNT(*) > 1;

-- Verify composite primary key is in place
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'invite_history' AND constraint_type = 'PRIMARY KEY';
```

### Channel Monitoring
Monitor the invite tracking channel (configured in `config.json`) for:
- Success messages: `<emoji> <member> à rejoins l'équipe. Passe D de <inviter> qui a maintenant X invitation(s)! <emoji>`
- Duplicate warnings: "🚫 L'invitation n'a pas été comptée, cet utilisateur a déjà été invité !"

## Troubleshooting

### Issue: Duplicates still being counted
1. Check database schema - ensure `invite_history` table exists
2. Verify composite PRIMARY KEY on (inviter_id, invited_id)
3. Check console logs for database errors
4. Verify migration `004_add_invite_history_table.sql` ran successfully

### Issue: No logs appearing
1. Ensure `console.log` statements are not filtered by your logging system
2. Check that the bot has the `GuildMembers` intent enabled
3. Verify the `guildMemberAdd` event is firing

### Issue: False duplicate detection
1. Check if user ID is being consistently tracked
2. Verify the database query is using correct parameters
3. Review `invite_history` table for unexpected records

## Security Notes

The anti-cheat system provides multiple layers of protection:

1. **Pre-check validation**: Queries database before processing
2. **Composite PRIMARY KEY**: Database-level constraint prevents duplicates
3. **Race condition handling**: Second layer catches concurrent attempts
4. **Comprehensive logging**: Every step is logged for audit trail

This ensures that even in edge cases (network issues, concurrent requests, etc.), duplicate invitations will not be counted.
