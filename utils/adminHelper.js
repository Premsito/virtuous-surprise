/**
 * Admin Helper - Centralized admin permission checking
 */

const ADMIN_USER_ID = '473336458715987970';

/**
 * Check if a user has admin permissions for the bot
 * @param {string} userId - The Discord user ID to check
 * @returns {boolean} - True if the user is an admin
 */
function isAdmin(userId) {
    return userId === ADMIN_USER_ID;
}

module.exports = {
    isAdmin,
    ADMIN_USER_ID
};
