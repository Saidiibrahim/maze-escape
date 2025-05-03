// js/entities/enemy.js
// Manages enemy spawning, movement, and interactions.
import * as THREE from 'three';
import {
    MAX_ENEMIES,
    ENEMY_SPAWN_INTERVAL,
    MAIN_LAYER,
    ENEMY_BASE_SPEED,
    ENEMY_CHASE_RADIUS,
    ENEMY_RADIUS,
    PLAYER_RADIUS,
    ENEMY_COLLISION_DAMAGE
} from '../core/constants.js';
// TODO: Import Collision Utils when created
// TODO: Import Audio Manager when created

// Private variables
let _enemies = [];
let _scene = null;
let _spawnCells = [];
let _freeCellIndices = [];
let _spawnIntervalId = null;
let _walls = []; // For collision checking
let _onPlayerCollisionCallback = null; // Callback to damage player
let _lastEnemyMoveSoundState = false; // Track if sound was playing

// Shared geometry/material
const _enemyGeometry = new THREE.SphereGeometry(ENEMY_RADIUS, 12, 12);
const _enemyMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });

/**
 * Initializes the Enemy Manager.
 * @param {THREE.Scene} sceneInstance
 * @param {Array<{x: number, z: number}>} spawnCellCoords
 * @param {number[]} initialFreeIndices
 * @param {THREE.Mesh[]} collisionWalls
 * @param {object} callbacks
 * @param {function(number): void} callbacks.onPlayerCollision - Function to call when an enemy hits the player (passes damage amount).
 * @param {function(string, boolean=): void} callbacks.playSound - Function to play sounds.
 * @param {function(string): void} callbacks.stopSound - Function to stop sounds.
 */
export function initEnemyManager(sceneInstance, spawnCellCoords, initialFreeIndices, collisionWalls, callbacks) {
    _scene = sceneInstance;
    _spawnCells = spawnCellCoords;
    _freeCellIndices = [...initialFreeIndices];
    _walls = collisionWalls;
    _onPlayerCollisionCallback = callbacks.onPlayerCollision;
    // TODO: Store sound callbacks
    _enemies = [];

    spawnInitialEnemies();

    if (_spawnIntervalId) clearInterval(_spawnIntervalId);
    _spawnIntervalId = setInterval(trySpawnEnemy, ENEMY_SPAWN_INTERVAL);

    console.log("Enemy Manager initialized");
}

/** Spawns initial enemies */
function spawnInitialEnemies() {
    const numToSpawn = Math.min(MAX_ENEMIES, _freeCellIndices.length);
    console.log(`Spawning initial ${numToSpawn} enemies.`);
    for (let i = 0; i < numToSpawn; i++) {
        spawnEnemy();
    }
}

/** Attempts to spawn a new enemy if conditions met. */
function trySpawnEnemy() {
    if (_enemies.length < MAX_ENEMIES) {
        spawnEnemy();
    }
}

/**
 * Spawns a single enemy in a random free cell.
 * @returns {THREE.Mesh | null} The spawned enemy mesh or null.
 */
function spawnEnemy() {
    if (!_scene || _enemies.length >= MAX_ENEMIES || _freeCellIndices.length === 0) {
        return null;
    }

    const listIndex = Math.floor(Math.random() * _freeCellIndices.length);
    const cellIndex = _freeCellIndices.splice(listIndex, 1)[0];
    const cell = _spawnCells[cellIndex];

    const enemy = new THREE.Mesh(_enemyGeometry, _enemyMaterial);
    enemy.position.set(cell.x, ENEMY_RADIUS, cell.z); // Position on the floor
    enemy.userData = { cellIndex: cellIndex, speed: ENEMY_BASE_SPEED };
    enemy.layers.set(MAIN_LAYER); // Visible in main scene and minimap

    _scene.add(enemy);
    _enemies.push(enemy);
    // console.log(`Spawned enemy in cell ${cellIndex}. Enemies: ${_enemies.length}`);
    return enemy;
}

/**
 * Updates all enemies: movement, collision with player, wall avoidance.
 * @param {number} delta - Time delta.
 * @param {THREE.Vector3} playerPosition - Current player position.
 */
export function updateEnemies(delta, playerPosition) {
    if (!_scene) return;

    let anyEnemyMoving = false;

    for (let i = _enemies.length - 1; i >= 0; i--) {
        const enemy = _enemies[i];
        const enemyPos = enemy.position;
        const directionToPlayer = playerPosition.clone().sub(enemyPos).setY(0);
        const distanceToPlayer = directionToPlayer.length();

        // --- Player Collision Check ---
        if (distanceToPlayer < ENEMY_RADIUS + PLAYER_RADIUS) {
            console.log(`Enemy hit player!`);
            if (_onPlayerCollisionCallback) {
                _onPlayerCollisionCallback(ENEMY_COLLISION_DAMAGE);
            }
            // TODO: Play hit sound via Audio Manager
            // Remove enemy, free cell, and attempt respawn
            removeEnemy(enemy, { respawn: true });
            continue; // Skip rest of update for this removed enemy
        }

        // --- Movement Logic ---
        if (distanceToPlayer < ENEMY_CHASE_RADIUS) {
            directionToPlayer.normalize();
            const speed = enemy.userData.speed || ENEMY_BASE_SPEED;
            const potentialMove = directionToPlayer.multiplyScalar(speed * delta);
            const nextPos = enemyPos.clone().add(potentialMove);

            // --- Wall Collision Check ---
            if (!checkEnemyWallCollision(nextPos)) {
                enemyPos.copy(nextPos);
                anyEnemyMoving = true; // Mark that at least one enemy moved
            } else {
                // Basic wall sliding attempt (can be improved)
                // Try moving only along X
                const nextPosX = enemyPos.clone().add(new THREE.Vector3(potentialMove.x, 0, 0));
                if (!checkEnemyWallCollision(nextPosX)) {
                     enemyPos.copy(nextPosX);
                     anyEnemyMoving = true;
                } else {
                    // Try moving only along Z
                    const nextPosZ = enemyPos.clone().add(new THREE.Vector3(0, 0, potentialMove.z));
                    if (!checkEnemyWallCollision(nextPosZ)) {
                        enemyPos.copy(nextPosZ);
                        anyEnemyMoving = true;
                    }
                }
            }
        }
    }

    // --- Handle Enemy Movement Sound ---
    // TODO: Replace with Audio Manager calls
    // if (anyEnemyMoving !== _lastEnemyMoveSoundState) {
    //     const sfxEnemyMove = document.getElementById('sfxEnemyMove');
    //     if (sfxEnemyMove) {
    //         if (anyEnemyMoving) {
    //             if (sfxEnemyMove.paused) sfxEnemyMove.play().catch(e => console.warn("Enemy move audio failed:", e));
    //         } else {
    //             if (!sfxEnemyMove.paused) {
    //                 sfxEnemyMove.pause();
    //                 sfxEnemyMove.currentTime = 0;
    //             }
    //         }
    //     }
    //     _lastEnemyMoveSoundState = anyEnemyMoving;
    // }
}

/**
 * Checks if a given enemy position collides with any walls.
 * @param {THREE.Vector3} position - The position to check.
 * @returns {boolean} True if collision occurs, false otherwise.
 */
function checkEnemyWallCollision(position) {
    // TODO: Move this to collision.js utility?
    for (const wall of _walls) {
        const box = new THREE.Box3().setFromObject(wall);
        const closestPoint = box.clampPoint(position, new THREE.Vector3());
        // Use enemy radius for check
        if (closestPoint.distanceTo(position) < ENEMY_RADIUS) {
            return true; // Collision detected
        }
    }
    return false; // No collision
}

/**
 * Removes an enemy from the scene and manager.
 * @param {THREE.Mesh} enemyMesh - The enemy mesh to remove.
 * @param {object} [options]
 * @param {boolean} [options.respawn=true] - Whether to attempt spawning a new enemy.
 */
export function removeEnemy(enemyMesh, options = { respawn: true }) {
    if (!_scene) return;

    const index = _enemies.indexOf(enemyMesh);
    if (index > -1) {
        // Free up the cell index
        if (enemyMesh.userData.cellIndex !== undefined) {
            if (!_freeCellIndices.includes(enemyMesh.userData.cellIndex)) {
                _freeCellIndices.push(enemyMesh.userData.cellIndex);
                // _freeCellIndices.sort((a, b) => a - b); // Optional sort
            }
        }

        _scene.remove(enemyMesh);
        _enemies.splice(index, 1);
        // console.log(`Removed enemy from cell ${enemyMesh.userData.cellIndex}. Enemies: ${_enemies.length}`);

        if (options.respawn) {
            setTimeout(trySpawnEnemy, 0); // Respawn attempt after slight delay
        }

    } else {
        console.warn("Enemy mesh not found in managed list for removal.");
    }
}

/** Clears all enemies and stops spawning interval. */
export function clearEnemies() {
    if (_spawnIntervalId) {
        clearInterval(_spawnIntervalId);
        _spawnIntervalId = null;
    }
    for (let i = _enemies.length - 1; i >= 0; i--) {
       if(_scene) _scene.remove(_enemies[i]);
    }
    _enemies = [];
    // Reset free cell indices? Depends on global reset strategy.
    console.log("Cleared all enemies.");
}

/** Gets the array of active enemy meshes. */
export function getEnemies() {
    return _enemies;
} 