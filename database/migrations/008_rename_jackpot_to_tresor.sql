-- Rename jackpot to tresor in user_inventory
UPDATE user_inventory 
SET item_type = 'tresor'
WHERE item_type = 'jackpot';

-- Update any transaction descriptions that reference jackpot
UPDATE transactions 
SET description = REPLACE(description, 'Jackpot', 'Trésor')
WHERE description LIKE '%Jackpot%';

UPDATE transactions 
SET description = REPLACE(description, 'jackpot', 'trésor')
WHERE description LIKE '%jackpot%';

UPDATE transactions 
SET transaction_type = 'tresor_reward'
WHERE transaction_type = 'jackpot_reward';
