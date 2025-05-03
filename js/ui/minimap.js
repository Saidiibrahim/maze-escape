// js/ui/minimap.js
// Handles the setup and rendering of the minimap display.
import * as THREE from 'three';
import {
    MINIMAP_SIZE,
    MINIMAP_SCOPE,
    MAIN_LAYER,
    PLAYER_MARKER_LAYER,
    MINIMAP_LAYER
} from '../core/constants.js';

let _miniCam = null;
let _miniRenderer = null;
let _playerMarker = null; // Reference to the player marker mesh (created in player.js)

/**
 * Initializes the minimap camera and renderer.
 * @param {THREE.Mesh} playerMarkerInstance - The player marker mesh.
 * @returns {{ miniCam: THREE.OrthographicCamera, miniRenderer: THREE.WebGLRenderer }}
 */
export function initMinimap(playerMarkerInstance) {
    _playerMarker = playerMarkerInstance; // Store reference to the marker

    // --- Minimap Camera ---
    _miniCam = new THREE.OrthographicCamera(
        -MINIMAP_SCOPE, MINIMAP_SCOPE,
        MINIMAP_SCOPE, -MINIMAP_SCOPE,
        0.1, 1000 // Near and far clipping planes
    );
    _miniCam.layers.enable(MAIN_LAYER);        // See main objects (walls, enemies, exit)
    _miniCam.layers.enable(PLAYER_MARKER_LAYER); // See player marker
    _miniCam.layers.enable(MINIMAP_LAYER);     // See grid helper
    _miniCam.up.set(0, 0, -1); // Point camera's top towards negative Z (looking down)

    // --- Minimap Renderer ---
    _miniRenderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
    _miniRenderer.setClearColor(0x111111, 1); // Opaque dark background
    _miniRenderer.setSize(MINIMAP_SIZE, MINIMAP_SIZE);
    _miniRenderer.domElement.style.cssText = `
      position: absolute;
      bottom: 10px;
      right: 10px;
      border: 2px solid #fff;
      border-radius: 4px;
      z-index: 1; /* Ensure it's above the main canvas */
    `;
    document.body.appendChild(_miniRenderer.domElement);

    console.log("Minimap Initialized");
    return { miniCam: _miniCam, miniRenderer: _miniRenderer };
}

/**
 * Updates the minimap camera position and renders the scene from the top-down view.
 * @param {THREE.Vector3} playerPosition - The current player position.
 * @param {THREE.Scene} scene - The main scene object.
 * @param {THREE.PerspectiveCamera} mainCamera - The main player camera (to get direction).
 */
export function updateMinimap(playerPosition, scene, mainCamera) {
    if (!_miniCam || !_miniRenderer || !_playerMarker) {
        // console.warn("Minimap not fully initialized for update.");
        return;
    }

    // Update minimap camera position to follow the player from above
    _miniCam.position.copy(playerPosition).setY(500); // Fixed height above player
    _miniCam.lookAt(playerPosition.x, 0, playerPosition.z); // Look down at the player's XZ

    // Update player marker position (already done in player.js, but kept here for clarity if marker isn't passed)
    // _playerMarker.position.x = playerPosition.x;
    // _playerMarker.position.z = playerPosition.z;

    // Update player marker rotation to match main camera direction
    const lookDirection = new THREE.Vector3();
    mainCamera.getWorldDirection(lookDirection);
    // We update the marker's Z rotation because it was initially rotated PI/2 on X
    _playerMarker.rotation.z = Math.atan2(lookDirection.x, lookDirection.z);

    // Render the scene from the minimap camera's perspective
    _miniRenderer.clear();
    _miniRenderer.render(scene, _miniCam);
}

/** Cleans up minimap resources (removes renderer DOM element). */
export function cleanupMinimap() {
    if (_miniRenderer && _miniRenderer.domElement && _miniRenderer.domElement.parentNode) {
        _miniRenderer.domElement.parentNode.removeChild(_miniRenderer.domElement);
    }
    _miniCam = null;
    _miniRenderer = null;
    _playerMarker = null; // Clear reference
} 