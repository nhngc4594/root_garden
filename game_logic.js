import { INITIAL_GAME_STATE, ZONES, loadGameState } from './game_data_model.js';

// --- Global Game State and Persistence ---
let gameState = INITIAL_GAME_STATE;
let currentZone = ZONES[0];
let currentLevel = currentZone.levels[0];

// Keys for localStorage
const GAME_STATE_KEY = 'grammarGardenState';

/**
 * Saves the current gameState to localStorage.
 */
export function saveProgress() {
    try {
        localStorage.setItem(GAME_STATE_KEY, JSON.stringify(gameState));
        console.log('Game state saved.');
    } catch (e) {
        console.error('Error saving game state to localStorage:', e);
    }
}

/**
 * Loads the game state from localStorage, or uses the initial state if none is found.
 */
export function loadProgress() {
    try {
        const savedState = JSON.parse(localStorage.getItem(GAME_STATE_KEY));
        gameState = loadGameState(savedState);
        // Sync current zone and level based on loaded state
        currentZone = ZONES.find(z => z.id === gameState.currentZoneId) || ZONES[0];
        currentLevel = currentZone.levels[gameState.currentLevelIndex] || currentZone.levels[0];
        console.log('Game state loaded:', gameState);
    } catch (e) {
        console.error('Error loading game state from localStorage, initializing new game.', e);
        gameState = INITIAL_GAME_STATE;
        saveProgress(); // Save the fresh state
    }
}

/**
 * Applies the currency rewards based on the action, factoring in the Bear threat.
 * @param {('root'|'pos'|'perfect')} rewardType - The type of reward earned.
 */
function applyReward(rewardType) {
    let harvestReward = 0;
    let gemReward = 0;

    switch (rewardType) {
        case 'root':
            harvestReward = 1; // +1 Root Harvest for zapping the Pest
            break;
        case 'pos':
            harvestReward = 2; // +2 Root Harvest for applying the Tonic
            break;
        case 'perfect':
            gemReward = 1; // +1 Gem for a perfect word
            break;
    }

    // Apply Bear Penalty (50% reduction in Root Harvest)
    if (gameState.isBearActive) {
        harvestReward = Math.floor(harvestReward * 0.5);
    }
    
    gameState.playerHarvest += harvestReward;
    gameState.playerGems += gemReward;

    console.log(`Reward applied: +${harvestReward} Harvest, +${gemReward} Gems. Current Harvest: ${gameState.playerHarvest}`);

    // If a penalty was applied, decrement the bear timer
    if (gameState.isBearActive && (harvestReward > 0 || gemReward > 0)) {
        gameState.roundsUntilBearLeaves--;
        if (gameState.roundsUntilBearLeaves <= 0) {
            gameState.isBearActive = false;
            console.log("The Grizzly Bear has left! Your garden is safe.");
        }
    }
}

/**
 * Handles a successful Root Retrieval (Phase 1).
 */
export function handleRootSuccess() {
    applyReward('root');
    // Health logic: The garden health should drop on failure, but for success, we can
    // either do nothing or give a tiny maintenance boost (not needed yet).
}

/**
 * Handles a failed Root Retrieval (Phase 1).
 * @param {number} levelId - The ID of the current level for tracking mistakes.
 */
export function handleRootFailure(levelId) {
    // 1. Mistake Tracking: Add word ID to imperfect list if not already there
    if (!gameState.imperfectWords.includes(levelId)) {
        gameState.imperfectWords.push(levelId);
    }
    // 2. Health Penalty: The Pest covers the plant (lowers health)
    gameState.gardenHealth = Math.max(0, gameState.gardenHealth - 5); 
    console.warn(`Root ID failed. Imperfect word added (ID ${levelId}). Health: ${gameState.gardenHealth}`);
}

/**
 * Handles a successful POS Fertilizer application (Phase 2).
 * @param {boolean} isPerfect - True if both Root and POS were correct on the first try.
 */
export function handlePOSSuccess(isPerfect) {
    applyReward('pos');
    if (isPerfect) {
        applyReward('perfect');
    }
    // Health logic: Plant pulses with light (tiny health boost for maintenance)
    gameState.gardenHealth = Math.min(100, gameState.gardenHealth + 1);
}

/**
 * Handles a failed POS Fertilizer application (Phase 2).
 * @param {number} levelId - The ID of the current level for tracking mistakes.
 */
export function handlePOSFailure(levelId) {
    // 1. Mistake Tracking: Add word ID to imperfect list if not already there
    if (!gameState.imperfectWords.includes(levelId)) {
        gameState.imperfectWords.push(levelId);
    }
    // 2. Health Penalty: Fertilizer sizzles (drains more health)
    gameState.gardenHealth = Math.max(0, gameState.gardenHealth - 10);
    console.warn(`POS ID failed. Imperfect word added (ID ${levelId}). Health: ${gameState.gardenHealth}`);
}

// Export the game state getter for UI/other modules to read
export const getGameState = () => gameState;

// Export the current level details
export const getCurrentLevel = () => currentLevel;

// --- Initialization Example ---
loadProgress(); // Load the game state on startup
