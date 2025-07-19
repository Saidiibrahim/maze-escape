// js/multiplayer/remotePlayer.js
// Manages remote player entities in multiplayer games

import * as THREE from 'three';
import { MAIN_LAYER, PLAYER_MARKER_LAYER } from '../core/constants.js';

/**
 * Creates a remote player entity
 * @param {THREE.Scene} scene - Three.js scene
 * @param {string} playerId - Player ID
 * @param {string} playerName - Player name
 * @param {object} position - Initial position {x, y, z}
 * @returns {object} Remote player object
 */
export function initRemotePlayer(scene, playerId, playerName, position = { x: 0, y: 10, z: 0 }) {
    // Create player body (simple capsule)
    const bodyGeometry = new THREE.CapsuleGeometry(5, 15, 4, 8);
    const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(position.x, position.y, position.z);
    body.layers.set(MAIN_LAYER);
    
    // Create player marker for minimap
    const markerGeometry = new THREE.ConeGeometry(8, 15, 3);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.set(position.x, 0.1, position.z);
    marker.rotation.x = Math.PI / 2;
    marker.layers.set(PLAYER_MARKER_LAYER);
    
    // Create name tag
    const nameTag = createNameTag(playerName);
    nameTag.position.set(position.x, position.y + 20, position.z);
    
    // Create group to hold all components
    const playerGroup = new THREE.Group();
    playerGroup.add(body);
    playerGroup.add(marker);
    playerGroup.add(nameTag);
    
    scene.add(playerGroup);
    
    const remotePlayer = {
        id: playerId,
        name: playerName,
        group: playerGroup,
        body: body,
        marker: marker,
        nameTag: nameTag,
        position: new THREE.Vector3(position.x, position.y, position.z),
        rotation: new THREE.Euler(0, 0, 0),
        lastUpdate: Date.now()
    };
    
    console.log(`Remote player created: ${playerName} (${playerId})`);
    return remotePlayer;
}

/**
 * Updates remote player position and rotation
 * @param {object} remotePlayer - Remote player object
 * @param {object} position - New position {x, y, z}
 * @param {object} rotation - New rotation {x, y, z}
 */
export function updateRemotePlayer(remotePlayer, position, rotation) {
    if (!remotePlayer || !remotePlayer.group) return;
    
    // Update position
    remotePlayer.position.set(position.x, position.y, position.z);
    remotePlayer.body.position.copy(remotePlayer.position);
    remotePlayer.nameTag.position.set(position.x, position.y + 20, position.z);
    
    // Update marker position (for minimap)
    remotePlayer.marker.position.set(position.x, 0.1, position.z);
    
    // Update rotation
    if (rotation) {
        remotePlayer.rotation.set(rotation.x, rotation.y, rotation.z);
        remotePlayer.body.rotation.copy(remotePlayer.rotation);
        remotePlayer.marker.rotation.z = rotation.y; // Only Y rotation for minimap
    }
    
    remotePlayer.lastUpdate = Date.now();
}

/**
 * Removes remote player from scene
 * @param {object} remotePlayer - Remote player object
 */
export function removeRemotePlayer(remotePlayer) {
    if (!remotePlayer || !remotePlayer.group) return;
    
    remotePlayer.group.parent.remove(remotePlayer.group);
    
    // Dispose of geometries and materials
    remotePlayer.body.geometry.dispose();
    remotePlayer.body.material.dispose();
    remotePlayer.marker.geometry.dispose();
    remotePlayer.marker.material.dispose();
    
    // Dispose of name tag
    if (remotePlayer.nameTag.material.map) {
        remotePlayer.nameTag.material.map.dispose();
    }
    remotePlayer.nameTag.geometry.dispose();
    remotePlayer.nameTag.material.dispose();
    
    console.log(`Remote player removed: ${remotePlayer.name} (${remotePlayer.id})`);
}

/**
 * Creates a name tag for the remote player
 * @param {string} playerName - Player name
 * @returns {THREE.Mesh} Name tag mesh
 */
function createNameTag(playerName) {
    // Create canvas for text
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 256;
    canvas.height = 64;
    
    // Style the text
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.fillStyle = 'white';
    context.font = '24px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Draw the player name
    context.fillText(playerName, canvas.width / 2, canvas.height / 2);
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    // Create material and geometry
    const material = new THREE.MeshBasicMaterial({ 
        map: texture,
        transparent: true,
        alphaTest: 0.1
    });
    
    const geometry = new THREE.PlaneGeometry(20, 5);
    const nameTag = new THREE.Mesh(geometry, material);
    
    // Make the name tag always face the camera
    nameTag.lookAt = function(camera) {
        this.quaternion.copy(camera.quaternion);
    };
    
    nameTag.layers.set(MAIN_LAYER);
    
    return nameTag;
}

/**
 * Updates name tags to face the camera
 * @param {object[]} remotePlayers - Array of remote players
 * @param {THREE.Camera} camera - Camera to face
 */
export function updateNameTags(remotePlayers, camera) {
    remotePlayers.forEach(remotePlayer => {
        if (remotePlayer.nameTag && remotePlayer.nameTag.lookAt) {
            remotePlayer.nameTag.lookAt(camera);
        }
    });
}

/**
 * Gets all remote players
 * @returns {object[]} Array of remote player objects
 */
export function getRemotePlayers() {
    // This would be managed by the multiplayer manager
    // Placeholder for now
    return [];
}