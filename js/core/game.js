// js/core/game.js
// Orchestrates the main game logic, initialization, and the animation loop.
import * as THREE from 'three';

// Core
import * as Constants from './constants.js';

// Entities
import { initPlayer, updatePlayerMovement, getPlayerControls, getPlayerCamera, getPlayerPosition, takeDamage as damagePlayer, resetPlayer } from '../entities/player.js';
import { initTargetManager, getTargets, removeTarget, clearTargets } from '../entities/target.js';
import { initEnemyManager, getEnemies, updateEnemies, removeEnemy, clearEnemies } from '../entities/enemy.js';
import { initBulletManager, shootBullet, updateBullets, getBullets } from '../entities/bullet.js';

// World
import { setupEnvironment } from '../world/environment.js';
import { createMaze } from '../world/maze.js';

// UI
import { initHUD, updateScore, updateHealth, showInstructionsMessage } from '../ui/hud.js';
import { initMinimap, updateMinimap, cleanupMinimap } from '../ui/minimap.js';
import { initMultiplayerUI, updateConnectionStatus, updatePlayerCount, showConnectionError } from '../ui/multiplayerUI.js';

// Utils
import { initInput, getMovementState } from '../utils/input.js';
import { initAudio, playSound, stopSound, stopAllSounds, SOUND_KEYS } from '../utils/audio.js';
import { checkSphereWallCollision } from '../utils/collision.js'; // Might use later if needed directly here

// Multiplayer
import { initMultiplayer, updateMultiplayer, notifyPlayerShot, isMultiplayer, getRemotePlayersMap } from '../multiplayer/manager.js';
import { updateNameTags } from '../multiplayer/remotePlayer.js';

// Game state variables
let scene, camera, renderer, clock, textureLoader;
let controls;
let walls = [];
let spawnCells = [];
let freeCellIndices = [];
let exitPosition = null;
let score = 0;
let gameWon = false;
let isPaused = false; // Could be used later
let mainLoopId = null; // To store requestAnimationFrame ID

let hudElements = {};
let minimapElements = {};

/**
 * Initializes and starts the game.
 */
export function initGame() {
    console.log("Initializing Game...");
    // --- Core Three.js Setup ---
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xaaaaaa); // Default background
    scene.fog = new THREE.Fog(Constants.MAIN_LAYER, 1, 2000); // Default fog

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 2000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    clock = new THREE.Clock();
    textureLoader = new THREE.TextureLoader();

    // --- UI Initialization ---
    hudElements = initHUD(); // Get references to score/health elements
    initMultiplayerUI(); // Initialize multiplayer UI

    // --- Environment Setup ---
    const { wallTexture, wallMaterial } = setupEnvironment(scene, textureLoader);

    // --- Maze Creation ---
    walls = []; // Ensure walls array is clear before maze creation
    const mazeData = createMaze(scene, walls, wallMaterial, wallTexture);
    spawnCells = mazeData.spawnCells;
    freeCellIndices = mazeData.freeCellIndices;
    exitPosition = mazeData.exitPosition;

    // --- Player Setup ---
    controls = initPlayer(camera, scene, hudElements.healthElement, document.getElementById('instructions'), {
        collisionWalls: walls,
        onDeath: handlePlayerDeath,
        // Pass audio functions if needed directly by player (currently not)
        // playSound: playSound,
        // stopSound: stopSound
    });
    // The player marker is created inside initPlayer and added to the scene
    const playerMarker = scene.children.find(child => child.layers.isEnabled(Constants.PLAYER_MARKER_LAYER) && child instanceof THREE.Mesh);

    // --- Input Setup ---
    initInput(controls, document.getElementById('instructions'), {
        onShoot: handleShoot,
        getIsGameWon: () => gameWon,
        onUnlock: handleUnlockControls,
        onLock: handleLockControls
    });

    // --- Entity Managers Setup ---
    initTargetManager(scene, spawnCells, freeCellIndices);
    initEnemyManager(scene, spawnCells, freeCellIndices, walls, {
        onPlayerCollision: handleEnemyPlayerCollision,
        // Pass audio functions
        // playSound: playSound,
        // stopSound: stopSound
    });
    initBulletManager(scene, clock);

    // --- Minimap Setup ---
    minimapElements = initMinimap(playerMarker);

    // --- Audio Setup ---
    initAudio();

    // --- Multiplayer Setup ---
    initMultiplayer(scene, {
        onConnected: () => {
            console.log("Connected to multiplayer");
            updateConnectionStatus(true);
        },
        onDisconnected: () => {
            console.log("Disconnected from multiplayer");
            updateConnectionStatus(false);
        },
        onPlayerJoined: (data) => {
            console.log("Player joined:", data.playerName);
            // Update player count if available
        },
        onPlayerLeft: (data) => {
            console.log("Player left:", data.playerName);
            // Update player count if available
        },
        onError: (error) => {
            console.error("Multiplayer error:", error);
            showConnectionError(error.message || "Connection failed");
        }
    });

    // --- Event Listeners ---
    window.addEventListener('resize', onWindowResize);

    // --- Start Game Loop ---
    resetGameState();
    animate();
    console.log("Game Initialized and Started.");
}

/** Resets game state variables. */
function resetGameState() {
    score = 0;
    gameWon = false;
    isPaused = false;
    updateScore(score);
    // Player health reset is handled within player module
    resetPlayer();
    // Clear existing entities and respawn initial set (might need refinement)
    // clearTargets();
    // clearEnemies();
    // TODO: Properly reset targets/enemies if needed without full re-init
}

// --- Event Handlers / Callbacks ---

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    // No need to resize minimap renderer here, it's fixed size
}

function handleShoot() {
    shootBullet(camera);
    
    // Notify multiplayer system about the shot
    if (isMultiplayer()) {
        const playerPos = getPlayerPosition();
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        notifyPlayerShot(playerPos, direction);
    }
}

function handleEnemyPlayerCollision(damageAmount) {
    damagePlayer(damageAmount);
    playSound(SOUND_KEYS.HEAVY_FOOTSTEPS, true);
}

function handlePlayerDeath() {
    console.log("Game Over triggered by player death.");
    gameWon = true; // Reuse gameWon flag to stop main logic
    isPaused = true;
    stopAllSounds();
    showInstructionsMessage("You Died!", "Click to restart");
    // Controls are unlocked within player.js
}

function handleTargetHit(targetMesh) {
    removeTarget(targetMesh, { respawn: true });
    score++;
    updateScore(score);
    // console.log("Target Hit! Score:", score);
}

function handleEnemyHit(enemyMesh) {
    removeEnemy(enemyMesh, { respawn: true });
    playSound(SOUND_KEYS.HEAVY_FOOTSTEPS, true); // Sound for hitting enemy
    // console.log("Enemy Hit!");
}

function handleUnlockControls() {
    console.log("Controls Unlocked");
    // Only pause sounds if the game hasn't already ended (won/lost)
    if (!gameWon) {
        stopAllSounds(); // Stop sounds when pausing mid-game
        isPaused = true;
    }
    // Instructions overlay is handled by input module
}

function handleLockControls() {
    console.log("Controls Locked");
    isPaused = false;
    // Resume background music if it was playing
    playSound(SOUND_KEYS.BACKGROUND_MUSIC, false); // Play without restarting if already playing
}

function checkWinCondition() {
    if (!exitPosition || gameWon) return; // Don't check if already won or exit not set

    const playerPos = getPlayerPosition();
    if (playerPos.distanceTo(exitPosition) < Constants.EXIT_RADIUS) {
        console.log("Player reached exit!");
        gameWon = true;
        isPaused = true;
        controls.unlock();
        stopAllSounds();
        playSound(SOUND_KEYS.HEAVY_FOOTSTEPS, true); // Victory sound (placeholder)
        showInstructionsMessage("You Escaped!", "Click to restart");
    }
}

// --- Main Animation Loop ---

function animate() {
    mainLoopId = requestAnimationFrame(animate);
    const delta = clock.getDelta();

    // Only update game logic if controls are locked (game active)
    if (controls && controls.isLocked && !isPaused) {
        // 1. Get Input
        const movementState = getMovementState();

        // 2. Update Entities
        updatePlayerMovement(delta, movementState);
        updateEnemies(delta, getPlayerPosition());
        updateBullets(delta, getTargets(), getEnemies(), {
            onTargetHit: handleTargetHit,
            onEnemyHit: handleEnemyHit
        });

        // 3. Update Multiplayer
        if (isMultiplayer()) {
            const playerPos = getPlayerPosition();
            const direction = new THREE.Vector3();
            camera.getWorldDirection(direction);
            updateMultiplayer({
                position: { x: playerPos.x, y: playerPos.y, z: playerPos.z },
                rotation: { x: direction.x, y: direction.y, z: direction.z }
            });
            
            // Update name tags to face camera
            const remotePlayers = Array.from(getRemotePlayersMap().values());
            updateNameTags(remotePlayers, camera);
        }

        // 4. Check Game State
        checkWinCondition();
    }

    // 5. Render Main Scene
    renderer.render(scene, camera);

    // 6. Update & Render Minimap (always update to show player marker)
    if (minimapElements.miniCam) { // Check if minimap is initialized
         updateMinimap(getPlayerPosition(), scene, camera);
    }

}

// Optional: Add a function to stop the game loop
export function stopGameLoop() {
    if (mainLoopId) {
        cancelAnimationFrame(mainLoopId);
        mainLoopId = null;
        console.log("Game loop stopped.");
    }
} 