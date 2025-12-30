const responses = require('../responses.json');
const config = require('../config.json');

/**
 * Replace placeholders in a string with actual values
 * @param {string} template - The template string with placeholders like {key}
 * @param {object} values - Object containing key-value pairs for replacement
 * @returns {string} - The string with placeholders replaced
 */
function replacePlaceholders(template, values = {}) {
    if (!template) return '';
    
    // Add common values from config
    const allValues = {
        prefix: config.prefix,
        currency_symbol: config.currency.symbol,
        ...values
    };
    
    return template.replace(/\{(\w+)\}/g, (match, key) => {
        return allValues[key] !== undefined ? allValues[key] : match;
    });
}

/**
 * Get a response from the responses.json file
 * @param {string} path - Dot-separated path to the response (e.g., 'lc.balance.title')
 * @param {object} values - Object containing values for placeholder replacement
 * @returns {string} - The response with placeholders replaced
 */
function getResponse(path, values = {}) {
    const keys = path.split('.');
    let response = responses;
    
    for (const key of keys) {
        response = response[key];
        if (response === undefined) {
            console.error(`Response path not found: ${path}`);
            return '';
        }
    }
    
    return replacePlaceholders(response, values);
}

module.exports = {
    responses,
    replacePlaceholders,
    getResponse
};
