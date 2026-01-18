/**
 * Helper functions for invite tracking
 */

/**
 * Detect which invite was used when a member joins
 * @param {Guild} guild - The guild the member joined
 * @param {GuildMember} member - The member who joined
 * @returns {Promise<User|null>} - The inviter user object or null if not found
 */
async function getInviter(guild, member, cachedInvites) {
    try {
        console.log(`[DEBUG] [getInviter] Fetching invites for guild ${guild.name} (${guild.id})`);
        const newInvites = await guild.invites.fetch();
        console.log(`[DEBUG] [getInviter] Fetched ${newInvites.size} invites from guild`);
        
        // Find which invite was used by comparing uses
        for (const [code, invite] of newInvites) {
            const cachedUses = cachedInvites.get(code) || 0;
            console.log(`[DEBUG] [getInviter] Checking invite code ${code}: cached=${cachedUses}, current=${invite.uses}`);
            
            if (invite.uses > cachedUses) {
                // Update the cache for this invite
                cachedInvites.set(code, invite.uses);
                
                // Return the inviter if available
                if (invite.inviter) {
                    console.log(`[DEBUG] [getInviter] Found inviter: ${invite.inviter.tag} (${invite.inviter.id}) via invite code ${code}`);
                    return invite.inviter;
                } else {
                    console.warn(`[WARNING] [getInviter] Invite code ${code} was used but has no inviter information`);
                }
            }
        }
        
        // Update the entire cache with new invite data
        for (const [code, invite] of newInvites) {
            cachedInvites.set(code, invite.uses);
        }
        
        console.warn(`[WARNING] [getInviter] Could not detect inviter for ${member.user.tag} - no invite use count increased`);
        return null;
    } catch (error) {
        console.error('[ERROR] Failed to detect inviter:', error);
        console.error('[ERROR] Error details:', error.message);
        console.error('[ERROR] Stack trace:', error.stack);
        return null;
    }
}

module.exports = {
    getInviter
};
