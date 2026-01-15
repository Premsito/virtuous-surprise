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
        const newInvites = await guild.invites.fetch();
        
        // Find which invite was used by comparing uses
        for (const [code, invite] of newInvites) {
            const cachedUses = cachedInvites.get(code) || 0;
            if (invite.uses > cachedUses) {
                // Update the cache for this invite
                cachedInvites.set(code, invite.uses);
                
                // Return the inviter if available
                if (invite.inviter) {
                    return invite.inviter;
                }
            }
        }
        
        // Update the entire cache with new invite data
        for (const [code, invite] of newInvites) {
            cachedInvites.set(code, invite.uses);
        }
        
        return null;
    } catch (error) {
        console.error('[ERROR] Failed to detect inviter:', error);
        return null;
    }
}

module.exports = {
    getInviter
};
