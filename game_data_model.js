// game_data_model.js
//
// This file defines the core data structures and the initial game state
// for the Grammar Garden Guardians application.

// --- 1. CORE DATA STRUCTURES ---

/**
 * Defines the structure for a single word level in the game.
 * @typedef {object} Level
 * @property {number} id - The unique ID of the level (used for tracking mistakes).
 * @property {string} fullWord - The derivative word presented to the player (the 'Pest').
 * @property {string} root - The core root word (the 'Root Plant').
 * @property {string[]} decoys - Incorrect root choices for the multiple-choice question.
 * @property {string} pos - The correct Part of Speech (POS) of the root ('Fertilizer').
 * @property {string[]} posDecoys - Incorrect POS choices.
 */

/**
 * Defines a Zone on the map, grouping a set of levels.
 * @typedef {object} Zone
 * @property {string} id - Unique identifier for the zone (matches GameState currentZoneId).
 * @property {string} title - The name displayed on the map (e.g., 'Quaint English Garden').
 * @property {Level[]} levels - The array of words/levels in this zone.
 * @property {boolean} isLocked - Flag to prevent access until mastery criteria are met.
 */

/**
 * Defines the comprehensive, persistent state of the player and the garden.
 * Corresponds to the GameState model in the roadmap.
 * @typedef {object} GameState
 * @property {string} currentZoneId - The ID of the zone the player is currently in.
 * @property {number} currentLevelIndex - The index of the current word in the zone's levels array.
 * @property {number} playerHarvest - Soft currency for basic supplies.
 * @property {number} playerGems - Hard currency for permanent items/pets/defenses.
 * @property {number[]} imperfectWords - IDs of levels where the player made a mistake.
 * @property {object} inventory - Tracks cosmetic and active items.
 * @property {number} gardenHealth - Progress bar health (100 is max).
 * @property {boolean} isBearActive - Flag for the Grizzly Bear threat.
 * @property {number} roundsUntilBearLeaves - Counter for the currency penalty duration.
 */


// --- 2. GAME CONTENT (LEVELS & ZONES) ---

// Define the initial list of levels. The structure ensures we have all necessary components
// for both the Root Retrieval and POS Fertilizer steps.

/** @type {Level[]} */
const allLevels = [
    // Zone 1: English Garden (Beginner) - Focus on simple, common roots
    { id: 1, fullWord: 'Visible', root: 'Vis', decoys: ['Abl', 'Tion'], pos: 'Adjective', posDecoys: ['Noun', 'Verb'] },
    { id: 2, fullWord: 'Audience', root: 'Aud', decoys: ['Ence', 'Audi'], pos: 'Noun', posDecoys: ['Adjective', 'Verb'] },
    { id: 3, fullWord: 'Credible', root: 'Cred', decoys: ['Able', 'Cree'], pos: 'Adjective', posDecoys: ['Noun', 'Verb'] },
    { id: 4, fullWord: 'Project', root: 'Ject', decoys: ['Pro', 'Ect'], pos: 'Verb', posDecoys: ['Noun', 'Adjective'] },
    { id: 5, fullWord: 'Territory', root: 'Terr', decoys: ['Tory', 'Ito'], pos: 'Noun', posDecoys: ['Adjective', 'Verb'] },
    { id: 6, fullWord: 'Inscribe', root: 'Scrib', decoys: ['In', 'Cribe'], pos: 'Verb', posDecoys: ['Noun', 'Adjective'] },

    // Zone 2: Mossy Glade (Advanced) - Longer words, focus on tougher POS
    { id: 7, fullWord: 'Demography', root: 'Dem', decoys: ['Graph', 'Yphy'], pos: 'Noun', posDecoys: ['Adjective', 'Verb'] },
    { id: 8, fullWord: 'Biography', root: 'Bio', decoys: ['Graphy', 'Bioh'], pos: 'Noun', posDecoys: ['Adjective', 'Verb'] },
    { id: 9, fullWord: 'Symmetric', root: 'Metr', decoys: ['Sym', 'Tric'], pos: 'Adjective', posDecoys: ['Noun', 'Verb'] },
    { id: 10, fullWord: 'Telepathy', root: 'Path', decoys: ['Tele', 'Ethy'], pos: 'Noun', posDecoys: ['Adjective', 'Verb'] },
    { id: 11, fullWord: 'Hydration', root: 'Hydr', decoys: ['Tion', 'Drat'], pos: 'Noun', posDecoys: ['Adjective', 'Verb'] },
    { id: 12, fullWord: 'Microscope', root: 'Scop', decoys: ['Micro', 'Rope'], pos: 'Noun', posDecoys: ['Adjective', 'Verb'] },
];

/** @type {Zone[]} */
export const ZONES = [
    {
        id: 'EnglishGarden',
        title: 'Quaint English Country Garden',
        levels: allLevels.slice(0, 6), // Levels 1-6
        isLocked: false,
    },
    {
        id: 'MossyGlade',
        title: 'The Enchanted Mossy Glade',
        levels: allLevels.slice(6, 12), // Levels 7-12
        isLocked: true, // Will be unlocked after English Garden mastery
    },
    {
        id: 'GrecoRoman',
        title: 'The Greco-Roman Temple Garden',
        levels: [], // Future Greek/Latin root words (Phase 4 content)
        isLocked: true,
    },
];


// --- 3. INITIAL GAME STATE ---

/** @type {GameState} */
export const INITIAL_GAME_STATE = {
    currentZoneId: ZONES[0].id,
    currentLevelIndex: 0,
    playerHarvest: 0, // Root Harvest currency
    playerGems: 0,
    imperfectWords: [], // List of level IDs where mistakes occurred
    inventory: {
        hat: null, // e.g., 'straw'
        apron: null, // e.g., 'green'
        hoe: null, // e.g., 'silver'
        snakeActive: false,
        fertilizerCount: 0,
    },
    gardenHealth: 100, // Starts full
    isBearActive: false,
    roundsUntilBearLeaves: 0,
};

// Function to safely load state, merging with initial state to ensure new properties are added.
export const loadGameState = (savedState) => {
    return savedState
        ? { ...INITIAL_GAME_STATE, ...savedState }
        : INITIAL_GAME_STATE;
};
