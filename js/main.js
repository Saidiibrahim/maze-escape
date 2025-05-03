// js/main.js
// Main entry point for the Maze Escape game.

import { initGame } from './core/game.js';

// Ensure the DOM is fully loaded before initializing the game
document.addEventListener('DOMContentLoaded', () => {
    // Initialize and start the game
    initGame();
}); 