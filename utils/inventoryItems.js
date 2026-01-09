// Shared inventory item definitions
module.exports = {
    ITEMS: {
        jackpot: {
            name: 'Jackpot',
            emoji: '🎁',
            description: 'Ouvre un jackpot pour gagner des LC aléatoires (50, 100, 250 ou 1000 LC)',
            buttonId: 'use_jackpot',
            buttonLabel: 'Ouvrir Jackpot 🎁'
        },
        multiplier_x2: {
            name: 'Multiplieur x2',
            emoji: '🎫',
            description: 'Active un bonus x2 LC pour vos 2 prochaines parties',
            buttonId: 'use_multiplier_x2',
            buttonLabel: 'Activer x2 🎫'
        },
        multiplier_x3: {
            name: 'Multiplieur x3',
            emoji: '🎫',
            description: 'Active un bonus x3 LC pour vos 2 prochaines parties',
            buttonId: 'use_multiplier_x3',
            buttonLabel: 'Activer x3 🎫'
        }
    },

    // Map user-friendly names to internal item types
    ITEM_TYPE_MAP: {
        'jackpot': 'jackpot',
        'multiplier_x2': 'multiplier_x2',
        'multiplieur_x2': 'multiplier_x2',
        'multiplieurx2': 'multiplier_x2',
        'x2': 'multiplier_x2',
        'multiplier_x3': 'multiplier_x3',
        'multiplieur_x3': 'multiplier_x3',
        'multiplieurx3': 'multiplier_x3',
        'x3': 'multiplier_x3'
    },

    // Display names for success messages
    ITEM_DISPLAY_NAMES: {
        'jackpot': 'Jackpot 🎁',
        'multiplier_x2': 'Multiplieur x2 🎫',
        'multiplier_x3': 'Multiplieur x3 🎫'
    }
};
