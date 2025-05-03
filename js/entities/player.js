// js/entities/player.js
// Represents the player character, handling movement, health, and interactions.
import * as THREE from 'three';
import { PointerLockControls } from 'three/controls/PointerLockControls.js';
import {
    PLAYER_START_HEALTH,
    PLAYER_RADIUS,
    PLAYER_MOVE_SPEED,
    MAIN_LAYER,
    GROUND_LAYER,
    PLAYER_MARKER_LAYER,
    CELL_SIZE,
    MAZE_COLS,
    MAZE_ROWS
} from '../core/constants.js';
// TODO: Import Audio Manager when created

// Private variables for the module
let _health = PLAYER_START_HEALTH;
let _isMoving = false;
let _playerMarker = null;
let _controls = null;
let _camera = null;
let _scene = null;
let _walls = []; // Reference to the wall meshes for collision
let _healthEl = null; // Reference to the health bar UI element
let _instructionsEl = null; // Reference to the instructions UI element

// Callbacks for game state changes
let _onDeathCallback = null;

/**
 * Initializes the Player.
 * @param {THREE.PerspectiveCamera} cameraInstance
 * @param {THREE.Scene} sceneInstance
 * @param {HTMLElement} healthElement
 * @param {HTMLElement} instructionsElement
 * @param {object} options
 * @param {THREE.Mesh[]} options.collisionWalls - Array of wall meshes.
 * @param {function(): void} options.onDeath - Callback when the player dies.
 * @param {function(string, boolean=): void} options.playSound - Function to play a sound.
 * @param {function(string): void} options.stopSound - Function to stop a sound.
 */
export function initPlayer(cameraInstance, sceneInstance, healthElement, instructionsElement, options) {
    _camera = cameraInstance;
    _scene = sceneInstance;
    _walls = options.collisionWalls;
    _healthEl = healthElement;
    _instructionsEl = instructionsElement;
    _onDeathCallback = options.onDeath;
    // TODO: Store playSound/stopSound callbacks when Audio Manager is ready

    // Setup Camera
    _camera.layers.enable(MAIN_LAYER);
    _camera.layers.enable(GROUND_LAYER);
    _camera.layers.disable(PLAYER_MARKER_LAYER);

    // Setup Controls
    _controls = new PointerLockControls(_camera, document.body);
    _scene.add(_controls.getObject());

    // Set Initial Position (Top-left cell)
    const offsetX = -MAZE_COLS * CELL_SIZE / 2;
    const offsetZ = -MAZE_ROWS * CELL_SIZE / 2;
    _controls.getObject().position.set(
        offsetX + CELL_SIZE / 2,
        10, // Player height
        offsetZ + CELL_SIZE / 2
    );

    // Create Player Marker for Minimap
    const markerGeometry = new THREE.ConeGeometry(8, 15, 3);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    _playerMarker = new THREE.Mesh(markerGeometry, markerMaterial);
    _playerMarker.position.y = 0.1; // Slightly above the floor
    _playerMarker.rotation.x = Math.PI / 2;
    _scene.add(_playerMarker);
    _playerMarker.layers.set(PLAYER_MARKER_LAYER);

    // Initialize health
    _health = PLAYER_START_HEALTH;
    updateHealthUI();

    console.log("Player initialized");
    return _controls; // Return controls instance for input system
}

/**
 * Updates the player's position based on input and checks for collisions.
 * @param {number} delta - Time delta since last frame.
 * @param {{ forward: boolean, backward: boolean, left: boolean, right: boolean }} movementState - Current movement input.
 */
export function updatePlayerMovement(delta, movementState) {
    if (!_controls || !_camera) return;

    const playerObject = _controls.getObject();
    const direction = new THREE.Vector3();

    direction.x = Number(movementState.right) - Number(movementState.left);
    direction.z = Number(movementState.forward) - Number(movementState.backward);

    const currentlyMoving = direction.lengthSq() > 0;

    // --- Handle Footstep Sounds ---
    // TODO: Replace direct sfxFootsteps access with Audio Manager calls
    // if (currentlyMoving && !_isMoving) {
    //     // Play footsteps
    //     if (sfxFootsteps && sfxFootsteps.paused) {
    //         sfxFootsteps.play().catch(e => console.warn("Footstep audio failed:", e));
    //     }
    //     _isMoving = true;
    // } else if (!currentlyMoving && _isMoving) {
    //     // Stop footsteps
    //     if (sfxFootsteps && !sfxFootsteps.paused) {
    //         sfxFootsteps.pause();
    //         sfxFootsteps.currentTime = 0;
    //     }
    //     _isMoving = false;
    // }
    _isMoving = currentlyMoving; // Simple state update for now

    // --- Apply Movement & Collision ---
    if (currentlyMoving) {
        direction.normalize();

        // Get camera-relative forward and right vectors (flattened on XZ plane)
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(_camera.quaternion).setY(0).normalize();
        const rightVec = new THREE.Vector3(1, 0, 0).applyQuaternion(_camera.quaternion).setY(0).normalize();

        const moveX = rightVec.multiplyScalar(direction.x * PLAYER_MOVE_SPEED * delta);
        const moveZ = forward.multiplyScalar(direction.z * PLAYER_MOVE_SPEED * delta);
        const move = moveX.add(moveZ);

        const oldPos = playerObject.position.clone();

        // --- Collision Detection (Separated Axes) ---
        // Check X-axis movement
        let newPosX = oldPos.clone();
        newPosX.x += move.x;
        if (!checkWallCollision(newPosX)) {
            playerObject.position.x = newPosX.x;
        }

        // Check Z-axis movement (using potentially updated X position)
        let newPosZ = playerObject.position.clone(); // Start from current pos after X check
        newPosZ.z += move.z;
        if (!checkWallCollision(newPosZ)) {
            playerObject.position.z = newPosZ.z;
        }
    }

    // Keep player at fixed height
    playerObject.position.y = 10;

    // --- Update Player Marker ---
    if (_playerMarker) {
        _playerMarker.position.x = playerObject.position.x;
        _playerMarker.position.z = playerObject.position.z;

        // Update marker rotation
        const lookDirection = new THREE.Vector3();
        _camera.getWorldDirection(lookDirection);
        _playerMarker.rotation.z = Math.atan2(lookDirection.x, lookDirection.z);
    }
}

/**
 * Checks if a given position collides with any walls.
 * @param {THREE.Vector3} position - The position to check.
 * @returns {boolean} True if collision occurs, false otherwise.
 */
function checkWallCollision(position) {
    // TODO: Move this to collision.js utility?
    for (const wall of _walls) {
        const box = new THREE.Box3().setFromObject(wall);
        const closestPoint = box.clampPoint(position, new THREE.Vector3());
        if (closestPoint.distanceTo(position) < PLAYER_RADIUS) {
            return true; // Collision detected
        }
    }
    return false; // No collision
}

/**
 * Reduces player health by the specified amount.
 * @param {number} amount - The amount of damage to take.
 */
export function takeDamage(amount) {
    _health = Math.max(_health - amount, 0);
    updateHealthUI();
    // console.log(`Player took ${amount} damage. Health: ${_health}`);

    if (_health <= 0) {
        die();
    }
}

/** Updates the health bar UI element. */
function updateHealthUI() {
    if (_healthEl) {
        _healthEl.style.background = `linear-gradient(to right, #0f0 ${_health}%, #400 ${_health}%)`;
    }
}

/** Handles the player's death. */
function die() {
    console.log("Player Died!");
    if (_controls) _controls.unlock();

    if (_instructionsEl) {
        _instructionsEl.innerHTML = '<h1>You Died!</h1><p>Click to restart</p>';
        _instructionsEl.style.display = '';
        _instructionsEl.classList.remove('fade');
    }

    // TODO: Use Audio Manager to stop sounds
    // Stop sounds logic removed for now, will be handled by game state manager or audio manager

    if (_onDeathCallback) {
        _onDeathCallback(); // Notify the main game loop/manager
    }
}

/** Resets the player's state (e.g., health) */
export function resetPlayer() {
    _health = PLAYER_START_HEALTH;
    updateHealthUI();
    // Reset position?
    // Maybe add other reset logic here
}

/** Gets the player's current health. */
export function getPlayerHealth() {
    return _health;
}

/** Gets the player's controls object. */
export function getPlayerControls() {
    return _controls;
}

/** Gets the player's camera object. */
export function getPlayerCamera() {
    return _camera;
}

/** Gets the player's position. */
export function getPlayerPosition() {
    return _controls ? _controls.getObject().position.clone() : new THREE.Vector3();
} 