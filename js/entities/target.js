// js/entities/target.js
// Manages the spawning and state of target objects (boxes) in the maze.
import * as THREE from 'three';
import {
    MAX_TARGETS,
    SPAWN_INTERVAL,
    CELL_SIZE,
    TARGET_SIZE,
    TARGET_SPAWN_MARGIN
} from '../core/constants.js';

// Private variables for the module
let _targets = [];
let _scene = null;
let _spawnCells = [];      // All possible cell center coordinates
let _freeCellIndices = []; // Indices of _spawnCells that are currently unoccupied
let _spawnIntervalId = null; // ID for the periodic spawn timer

// Shared geometry and material (optional optimization)
const _targetGeometry = new THREE.BoxGeometry(TARGET_SIZE, TARGET_SIZE, TARGET_SIZE);
const _targetMaterial = new THREE.MeshLambertMaterial(); // Color set individually

/**
 * Initializes the Target Manager.
 * @param {THREE.Scene} sceneInstance - The main scene object.
 * @param {Array<{x: number, z: number}>} spawnCellCoords - Coordinates of possible spawn locations.
 * @param {number[]} initialFreeIndices - Initial list of available spawn cell indices.
 */
export function initTargetManager(sceneInstance, spawnCellCoords, initialFreeIndices) {
    _scene = sceneInstance;
    _spawnCells = spawnCellCoords;
    _freeCellIndices = [...initialFreeIndices]; // Copy initial indices
    _targets = [];

    // Spawn initial targets
    spawnInitialTargets();

    // Start periodic spawning
    if (_spawnIntervalId) clearInterval(_spawnIntervalId); // Clear previous interval if any
    _spawnIntervalId = setInterval(trySpawnTarget, SPAWN_INTERVAL);

    console.log("Target Manager initialized");
}

/** Spawns the initial set of targets up to MAX_TARGETS. */
function spawnInitialTargets() {
    const numToSpawn = Math.min(MAX_TARGETS, _freeCellIndices.length);
    console.log(`Spawning initial ${numToSpawn} targets.`);
    for (let i = 0; i < numToSpawn; i++) {
        spawnTarget();
    }
}

/** Attempts to spawn a target if conditions are met (called by interval). */
function trySpawnTarget() {
    if (_targets.length < MAX_TARGETS) {
        spawnTarget();
    }
}

/**
 * Spawns a single target box in a random free maze cell.
 * @returns {THREE.Mesh | null} The spawned target mesh or null if spawn failed.
 */
function spawnTarget() {
    if (!_scene || _targets.length >= MAX_TARGETS || _freeCellIndices.length === 0) {
        // console.warn("Cannot spawn target: Max reached or no free cells.");
        return null;
    }

    // Choose a random free cell index and remove it from the available list
    const listIndex = Math.floor(Math.random() * _freeCellIndices.length);
    const cellIndex = _freeCellIndices.splice(listIndex, 1)[0];
    const cell = _spawnCells[cellIndex];

    // Create the mesh
    // const boxMaterial = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff });
    // Using shared material and cloning + setting color: potentially slightly better perf
    const boxMaterial = _targetMaterial.clone();
    boxMaterial.color.setHex(Math.random() * 0xffffff);

    const box = new THREE.Mesh(_targetGeometry, boxMaterial);

    // Calculate position with jitter
    const jitterRange = CELL_SIZE - 2 * TARGET_SPAWN_MARGIN;
    box.position.x = cell.x + (Math.random() - 0.5) * jitterRange;
    box.position.y = TARGET_SIZE / 2; // Position on the floor
    box.position.z = cell.z + (Math.random() - 0.5) * jitterRange;

    // Store the cell index this target occupies
    box.userData.cellIndex = cellIndex;
    box.userData.isTarget = true; // Add flag to easily identify targets

    _scene.add(box);
    _targets.push(box);
    // console.log(`Spawned target in cell ${cellIndex}. Targets: ${_targets.length}`);
    return box;
}

/**
 * Removes a target from the scene and manager.
 * @param {THREE.Mesh} targetMesh - The target mesh to remove.
 * @param {object} [options]
 * @param {boolean} [options.respawn=true] - Whether to attempt spawning a new target immediately.
 */
export function removeTarget(targetMesh, options = { respawn: true }) {
    if (!_scene) return;

    const index = _targets.indexOf(targetMesh);
    if (index > -1) {
        // Free up the cell index
        if (targetMesh.userData.cellIndex !== undefined) {
            // Only add back if it's not already present (safety check)
            if (!_freeCellIndices.includes(targetMesh.userData.cellIndex)) {
                _freeCellIndices.push(targetMesh.userData.cellIndex);
                // Optional: Sort for efficiency? Might not be necessary.
                // _freeCellIndices.sort((a, b) => a - b);
            }
        }

        _scene.remove(targetMesh);
        _targets.splice(index, 1);
        // console.log(`Removed target from cell ${targetMesh.userData.cellIndex}. Targets: ${_targets.length}`);

        // Optionally spawn a replacement immediately
        if (options.respawn) {
             // Use setTimeout to avoid potential issues if called rapidly within the same frame
            setTimeout(trySpawnTarget, 0);
        }

    } else {
        console.warn("Target mesh not found in managed list for removal.");
    }
}

/** Clears all targets and stops the spawn interval. */
export function clearTargets() {
    if (_spawnIntervalId) {
        clearInterval(_spawnIntervalId);
        _spawnIntervalId = null;
    }
    // Iterate backwards for safe removal
    for (let i = _targets.length - 1; i >= 0; i--) {
        // No need to manage free cells here, assuming a full reset
        if(_scene) _scene.remove(_targets[i]);
    }
    _targets = [];
    // Reset free cell indices? Depends on how reset is handled globally.
    // _freeCellIndices = Array.from({ length: _spawnCells.length }, (_, i) => i);
    console.log("Cleared all targets.");
}

/** Gets the array of active target meshes. */
export function getTargets() {
    return _targets;
} 