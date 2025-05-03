// js/ui/hud.js
// Manages the Heads-Up Display elements: Score and Health Bar.

let _scoreElement = null;
let _healthElement = null;

/**
 * Initializes the HUD module by finding the required DOM elements.
 * @returns {{scoreElement: HTMLElement | null, healthElement: HTMLElement | null}} References to the found elements.
 */
export function initHUD() {
    _scoreElement = document.getElementById('score');
    _healthElement = document.getElementById('health');

    if (!_scoreElement) {
        console.warn("HUD: Score element (#score) not found!");
    }
    if (!_healthElement) {
        console.warn("HUD: Health element (#health) not found!");
    } else {
        // Ensure the health element exists before trying to style it initially
        // Initial state is set in player.js now, but good practice
        // updateHealth(100); // Or get initial health from constants/player
    }
    console.log("HUD Initialized");
    return { scoreElement: _scoreElement, healthElement: _healthElement };
}

/**
 * Updates the score display.
 * @param {number} newScore - The player's current score.
 */
export function updateScore(newScore) {
    if (_scoreElement) {
        _scoreElement.innerText = `Score: ${newScore}`;
    }
}

/**
 * Updates the health bar display.
 * @param {number} currentHealth - The player's current health (0-100).
 */
export function updateHealth(currentHealth) {
    if (_healthElement) {
        const healthPercentage = Math.max(0, Math.min(100, currentHealth));
        _healthElement.style.background = `linear-gradient(to right, #0f0 ${healthPercentage}%, #400 ${healthPercentage}%)`;
    }
}

/**
 * Shows a message on the instructions overlay (used for win/lose messages).
 * @param {string} title - The main title (e.g., "You Escaped!").
 * @param {string} subtitle - The secondary text (e.g., "Click to restart").
 */
export function showInstructionsMessage(title, subtitle) {
    const instructionsElement = document.getElementById('instructions');
    if (instructionsElement) {
        // Using innerHTML for simplicity, consider safer methods if user input is involved
        instructionsElement.innerHTML = `<h1>${title}</h1><p>${subtitle}</p>`;
        instructionsElement.style.display = ''; // Make visible
        instructionsElement.classList.remove('fade'); // Ensure it's not faded out
    } else {
        console.warn("HUD: Instructions element (#instructions) not found for message.");
    }
} 