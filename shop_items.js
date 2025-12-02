// shop_items.js
//
// Defines all purchasable items in the Grammar Garden Guardians shop,
// including their cost, currency type, and effects.

/**
 * @typedef {object} ShopItem
 * @property {string} id - Unique identifier for the item (matches inventory key).
 * @property {string} name - Display name in the shop.
 * @property {string} description - Detailed description of the item.
 * @property {number} cost - The amount of currency required.
 * @property {'harvest' | 'gem'} currencyType - The type of currency used for purchase.
 * @property {'cosmetic' | 'consumable' | 'defense' | 'permanent'} type - Category of the item.
 * @property {string} imagePlaceholder - A simple string for placeholder rendering (e.g., emoji).
 */

/** @type {ShopItem[]} */
export const SHOP_ITEMS = [
    // --- Aesthetic/Cosmetic Items (Permanent) ---
    {
        id: 'strawHat',
        name: 'Guardian Straw Hat',
        description: 'A cheerful hat to protect you from the sun. Permanently changes your Guardian avatar.',
        cost: 100,
        currencyType: 'harvest',
        type: 'cosmetic',
        imagePlaceholder: '👒',
    },
    {
        id: 'fancyApron',
        name: 'Reinforced Apron',
        description: 'Stylish and tough. Permanent aesthetic upgrade.',
        cost: 3,
        currencyType: 'gem',
        type: 'cosmetic',
        imagePlaceholder: '🎽',
    },
    {
        id: 'goldenHoe',
        name: 'Golden Trowel',
        description: 'Looks cool, but performs the same. Permanent aesthetic upgrade.',
        cost: 5,
        currencyType: 'gem',
        type: 'cosmetic',
        imagePlaceholder: '⛏️',
    },
    
    // --- Consumable/Boost Items (Randomly stocked, single-use) ---
    {
        id: 'fertilizer',
        name: 'Nutrient Fertilizer',
        description: 'Gives double Root Harvest (x2) on the next correct POS Fertilizer application. Single use.',
        cost: 50,
        currencyType: 'harvest',
        type: 'consumable',
        imagePlaceholder: '🌱',
    },
    
    // --- Defense/Mitigation Items (Temporary, High Value) ---
    {
        id: 'rattlerSnake',
        name: 'The Rattler Defense',
        description: 'Scares away the Grizzly Bear for the next 5 rounds, mitigating the currency penalty.',
        cost: 10,
        currencyType: 'gem',
        type: 'defense',
        imagePlaceholder: '🐍',
    },

    // --- Permanent Upgrades (Unlocks/Zones) ---
    // (This category will be expanded later in Phase 4)
];
