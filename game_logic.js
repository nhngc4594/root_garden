import { INITIAL_GAME_STATE, ZONES, loadGameState } from './game_data_model.js';
import { SHOP_ITEMS } from './shop_items.js'; // Import shop items

// --- Global Game State and Persistence ---
let gameState = INITIAL_GAME_STATE;
let currentZone = ZONES[0];
// Need to reference all levels for review mode lookup
const allLevels = ZONES.flatMap(zone => zone.levels);
let currentLevel = currentZone.levels[0];

// Keys for localStorage
const GAME_STATE_KEY = 'grammarGardenState';

// Extend GameState with Review Mode flag
if (typeof gameState.isInReviewMode === 'undefined') {
    gameState.isInReviewMode = false;
}

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
        // Ensure new properties are initialized if not present in old save data
        if (typeof gameState.isInReviewMode === 'undefined') {
            gameState.isInReviewMode = false;
        }

        // Sync current zone and level based on loaded state
        currentZone = ZONES.find(z => z.id === gameState.currentZoneId) || ZONES[0];
        
        // Determine the next level to load based on mode
        if (gameState.isInReviewMode) {
             currentLevel = loadReviewLevel(true); // Loads the next review level without advancing the index
        } else {
             // Ensure index is valid for the current zone
             const zoneLevels = currentZone.levels;
             if (gameState.currentLevelIndex >= zoneLevels.length) {
                 gameState.currentLevelIndex = zoneLevels.length - 1; // Cap at last level if corrupted
             }
             currentLevel = zoneLevels[gameState.currentLevelIndex] || zoneLevels[0];
        }

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
    let harvestMultiplier = 1;

    // Check for consumable boosts (e.g., Fertilizer)
    // Note: We are using 'fertilizerCount' from inventory.
    if (rewardType === 'pos' && gameState.inventory.fertilizerCount > 0) {
        harvestMultiplier = 2;
        // The boost is consumed on use
        gameState.inventory.fertilizerCount--;
        console.log("Nutrient Fertilizer consumed! Harvest multiplier applied (x2).");
    }

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

    // Apply Multiplier
    harvestReward = harvestReward * harvestMultiplier;

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

// --- Game Action Handlers (Success/Failure) ---

/**
 * Handles a successful Root Retrieval (Phase 1).
 */
export function handleRootSuccess() {
    applyReward('root');
}

/**
 * Handles a failed Root Retrieval (Phase 1).
 * @param {number} levelId - The ID of the current level for tracking mistakes.
 */
export function handleRootFailure(levelId) {
    // 1. Mistake Tracking
    if (!gameState.imperfectWords.includes(levelId)) {
        gameState.imperfectWords.push(levelId);
    }
    // 2. Health Penalty
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
    // 1. Mistake Tracking
    if (!gameState.imperfectWords.includes(levelId)) {
        gameState.imperfectWords.push(levelId);
    }
    // 2. Health Penalty
    gameState.gardenHealth = Math.max(0, gameState.gardenHealth - 10);
    console.warn(`POS ID failed. Imperfect word added (ID ${levelId}). Health: ${gameState.gardenHealth}`);
}

// --- Shop and Inventory Logic ---

/**
 * Attempts to purchase an item, updating currency and inventory if successful.
 * @param {string} itemId - The ID of the item to purchase (must match item in SHOP_ITEMS).
 * @returns {object} { success: boolean, message: string }
 */
export function buyItem(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);

    if (!item) {
        return { success: false, message: 'Error: Item not found.' };
    }

    // 1. Check if item is already owned (for permanent items)
    if (item.type === 'cosmetic' && gameState.inventory[item.id]) {
        return { success: false, message: 'You already own this item.' };
    }
    
    // Check defense item status
    if (item.id === 'rattlerSnake' && gameState.inventory.snakeActive) {
        return { success: false, message: 'The Rattler is already guarding your garden!' };
    }

    // 2. Check sufficient funds
    if (item.currencyType === 'harvest' && gameState.playerHarvest < item.cost) {
        return { success: false, message: `Not enough Root Harvest! Need ${item.cost}.` };
    }
    if (item.currencyType === 'gem' && gameState.playerGems < item.cost) {
        return { success: false, message: `Not enough Guardian Gems! Need ${item.cost}.` };
    }

    // --- Purchase Successful ---

    // 3. Deduct currency
    if (item.currencyType === 'harvest') {
        gameState.playerHarvest -= item.cost;
    } else {
        gameState.playerGems -= item.cost;
    }

    // 4. Apply effect and update inventory
    let inventoryKey;
    switch (item.type) {
        case 'cosmetic':
            // Cosmetic items are tracked by their type (hat, apron, hoe)
            // The item ID is saved under the category key
            inventoryKey = item.id.replace(/(Hat|Apron|Hoe)$/, '').toLowerCase() + item.type.replace('c', 'C');
            gameState.inventory[inventoryKey] = item.id;
            break;
        case 'consumable':
            // Fertilizer is tracked by count
            gameState.inventory.fertilizerCount++;
            break;
        case 'defense':
            // Snake activates immediately upon purchase
            if (item.id === 'rattlerSnake') {
                gameState.inventory.snakeActive = true;
                // If the bear is active, purchasing the snake scares it away immediately
                if (gameState.isBearActive) {
                    gameState.isBearActive = false;
                    gameState.roundsUntilBearLeaves = 0;
                    console.log("Rattler purchased! The Grizzly Bear has been scared off!");
                }
            }
            break;
    }

    saveProgress(); // Save the state immediately after purchase
    return { success: true, message: `${item.name} purchased! Garden upgraded.` };
}


// --- Level and Progression Management ---

/**
 * Determines the next level to load when in Review Mode.
 * @param {boolean} peek - If true, just return the level without modifying state.
 * @returns {Level | null} The next level to review, or null if review list is empty.
 */
function loadReviewLevel(peek = false) {
    if (gameState.imperfectWords.length === 0) {
        if (!peek) {
            gameState.isInReviewMode = false;
            console.log("Review complete! Returning to main progression.");
        }
        return null;
    }

    // Always review the word that has been in the list the longest (FIFO)
    const nextLevelId = gameState.imperfectWords[0];
    const reviewLevel = allLevels.find(level => level.id === nextLevelId);

    if (!reviewLevel) {
        // Should not happen, but clean up bad ID just in case
        if (!peek) gameState.imperfectWords.shift();
        return loadReviewLevel(peek);
    }
    
    currentLevel = reviewLevel;
    return currentLevel;
}

/**
 * Attempts to unlock and move to the next sequential zone.
 * @returns {boolean} True if the zone transition was successful.
 */
function tryAdvanceZone() {
    const currentZoneIndex = ZONES.findIndex(z => z.id === gameState.currentZoneId);
    const nextZoneIndex = currentZoneIndex + 1;

    if (nextZoneIndex < ZONES.length) {
        const nextZone = ZONES[nextZoneIndex];
        
        if (nextZone.levels.length === 0) {
            console.log(`Zone ${nextZone.title} is empty (Phase 4 content pending). Game halted.`);
            return false; // Stop progression if zone is empty
        }

        // UNLOCK AND TRANSITION
        gameState.currentZoneId = nextZone.id;
        gameState.currentLevelIndex = 0;
        currentZone = nextZone;
        currentLevel = currentZone.levels[0];
        // Note: The UI layer will need to visually unlock the map segment
        console.log(`Transitioning to new Zone: ${currentZone.title}`);
        return true;
    } else {
        console.log("All current zones mastered! You are a Grand Guardian!");
        // The game should offer a final reward or loop back to the first zone here.
        return false; 
    }
}


/**
 * Advances the game to the next level, handling Zone completion and Review Mode transition.
 * @param {boolean} wasPerfect - True if the last word was answered perfectly (Root & POS).
 */
export function advanceLevel(wasPerfect) {
    saveProgress(); // Save before advancing

    // 1. Handle Review Mode Completion/Advancement
    if (gameState.isInReviewMode) {
        if (wasPerfect) {
            // If perfect in review, remove it from the list
            gameState.imperfectWords.shift();
            console.log(`Review word mastered (ID ${currentLevel.id}) and removed from list.`);
        }
        
        // Load the next review word, or exit review mode
        if (loadReviewLevel() !== null) {
            // Still in review mode, next level loaded
            return;
        } 
        // If loadReviewLevel returned null, it means Review Mode is now false.
    }

    // 2. Trigger the Bear Event (only if we are NOT in review mode and the snake is NOT active)
    // Note: The bear can be triggered after a perfect review or a normal word.
    maybeTriggerBear(wasPerfect);
    
    // 3. Normal Progression Logic
    const currentZoneLevels = currentZone.levels;
    const nextIndex = gameState.currentLevelIndex + 1;

    if (nextIndex < currentZoneLevels.length) {
        // Move to the next word in the current zone
        gameState.currentLevelIndex = nextIndex;
        currentLevel = currentZoneLevels[nextIndex];
        console.log(`Advanced to level ${nextIndex + 1} of ${currentZone.title}.`);
    } else {
        // Zone Complete! Try to move to the next zone.
        console.log(`Zone ${currentZone.title} completed! Attempting map transition...`);
        if (!tryAdvanceZone()) {
            // If advancing fails (e.g., last zone is complete), reset to start of the current zone for replayability
            gameState.currentLevelIndex = 0;
            currentLevel = currentZoneLevels[0];
            console.log("Zone completed, resetting to beginning of zone for replay.");
        }
    }
    
    // Ensure the currentLevel reference is correct after any index change
    currentLevel = currentZone.levels[gameState.currentLevelIndex]; 
}

/**
 * Randomly checks if the Grizzly Bear should be triggered, and initiates Review Mode if so.
 * This should be called after a player completes a word or section.
 * @param {boolean} wasPerfect - True if the last word was answered perfectly.
 */
function maybeTriggerBear(wasPerfect) {
    if (gameState.inventory.snakeActive || gameState.isBearActive) {
        return; // Defense active or bear is already here
    }

    // Calculate a failure chance based on mistakes made so far
    // High mistakes = high chance. Low mistakes (perfect round) = low chance.
    const baseChance = 0.05; // 5% base chance per word
    
    // Additive chance for poor performance
    let mistakeMultiplier = gameState.imperfectWords.length / allLevels.length;
    
    // If the last word was imperfect, increase the immediate chance
    if (!wasPerfect) {
        mistakeMultiplier += 0.1; // 10% bonus chance if the last word failed
    }

    const triggerChance = baseChance + mistakeMultiplier;

    if (Math.random() < triggerChance) {
        console.log(`Bear Trigger Chance was ${Math.round(triggerChance * 100)}%... Successful!`);
        
        // 1. Activate Bear Penalty
        gameState.isBearActive = true;
        gameState.roundsUntilBearLeaves = 3; // Bear stays for 3 rounds

        // 2. Initiate Review Mode (Reinforcement Learning)
        if (gameState.imperfectWords.length > 0) {
            gameState.isInReviewMode = true;
            loadReviewLevel(); // Load the first word to review
            console.warn("!! GRIZZLY BEAR ATTACK !! Review Mode Initiated to repair the garden!");
        } else {
            // Player was perfect! The Bear is just randomly annoying.
            // In this case, it just causes the currency penalty without forced review.
            console.warn("!! GRIZZLY BEAR ATTACK !! You were perfect, but the Bear is demanding a toll!");
        }
    }
}


// Export the game state getter for UI/other modules to read
export const getGameState = () => gameState;

// Export the current level details
export const getCurrentLevel = () => currentLevel;

// Export ZONES array for map UI rendering
export const getZones = () => ZONES;


// --- Initialization Example ---
loadProgress(); // Load the game state on startup
