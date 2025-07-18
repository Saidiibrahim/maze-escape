// js/multiplayer/manager.js
// Manages multiplayer game state and coordination

import * as THREE from 'three';
import { initWebSocket, sendPlayerPosition, sendPlayerShot, joinRoom, closeWebSocket, isConnected, getPlayerId } from './websocket.js';
import { initRemotePlayer, updateRemotePlayer, removeRemotePlayer, getRemotePlayers } from './remotePlayer.js';

let _scene = null;
let _isMultiplayer = false;
let _remotePlayers = new Map();
let _lastPositionUpdate = 0;
let _positionUpdateInterval = 100; // Update every 100ms
let _localPlayer = null;
let _callbacks = {};

/**
 * Initializes multiplayer manager
 * @param {THREE.Scene} scene - Three.js scene
 * @param {object} callbacks - Event callbacks
 */
export function initMultiplayer(scene, callbacks = {}) {
    _scene = scene;
    _callbacks = callbacks;
    
    console.log('Multiplayer manager initialized');
}

/**
 * Connects to multiplayer server
 * @param {string} serverUrl - WebSocket server URL
 * @param {string} roomId - Room ID to join
 * @param {string} playerName - Player name
 */
export function connectToServer(serverUrl, roomId, playerName) {
    const wsCallbacks = {
        onConnect: () => {
            console.log('Connected to multiplayer server');
            joinRoom(roomId, playerName);
            _isMultiplayer = true;
            if (_callbacks.onConnected) _callbacks.onConnected();
        },
        
        onDisconnect: () => {
            console.log('Disconnected from multiplayer server');
            _isMultiplayer = false;
            clearRemotePlayers();
            if (_callbacks.onDisconnected) _callbacks.onDisconnected();
        },
        
        onError: (error) => {
            console.error('Multiplayer connection error:', error);
            if (_callbacks.onError) _callbacks.onError(error);
        },
        
        onPlayerJoined: (data) => {
            console.log('Player joined:', data);
            if (data.playerId !== getPlayerId()) {
                addRemotePlayer(data.playerId, data.playerName, data.position);
            }
            if (_callbacks.onPlayerJoined) _callbacks.onPlayerJoined(data);
        },
        
        onPlayerLeft: (data) => {
            console.log('Player left:', data);
            removeRemotePlayer(data.playerId);
            if (_callbacks.onPlayerLeft) _callbacks.onPlayerLeft(data);
        },
        
        onPlayerPosition: (data) => {
            if (data.playerId !== getPlayerId()) {
                updateRemotePlayerPosition(data.playerId, data.position, data.rotation);
            }
        },
        
        onPlayerShot: (data) => {
            if (data.playerId !== getPlayerId()) {
                handleRemotePlayerShot(data);
            }
        },
        
        onGameState: (data) => {
            if (_callbacks.onGameState) _callbacks.onGameState(data);
        },
        
        onIdAssigned: (data) => {
            console.log('Player ID assigned:', data.playerId);
            if (_callbacks.onIdAssigned) _callbacks.onIdAssigned(data);
        }
    };
    
    initWebSocket(serverUrl, wsCallbacks);
}

/**
 * Disconnects from multiplayer server
 */
export function disconnectFromServer() {
    closeWebSocket();
    _isMultiplayer = false;
    clearRemotePlayers();
}

/**
 * Updates multiplayer state (called from game loop)
 * @param {object} localPlayerData - Local player data
 */
export function updateMultiplayer(localPlayerData) {
    if (!_isMultiplayer || !isConnected()) return;
    
    const now = Date.now();
    if (now - _lastPositionUpdate > _positionUpdateInterval) {
        sendPlayerPosition(localPlayerData.position, localPlayerData.rotation);
        _lastPositionUpdate = now;
    }
}

/**
 * Notifies about local player shot
 * @param {object} position - Shot origin
 * @param {object} direction - Shot direction
 */
export function notifyPlayerShot(position, direction) {
    if (!_isMultiplayer || !isConnected()) return;
    
    sendPlayerShot(position, direction);
}

/**
 * Adds a remote player to the game
 * @param {string} playerId - Player ID
 * @param {string} playerName - Player name
 * @param {object} position - Initial position
 */
function addRemotePlayer(playerId, playerName, position) {
    if (_remotePlayers.has(playerId)) return;
    
    const remotePlayer = initRemotePlayer(_scene, playerId, playerName, position);
    _remotePlayers.set(playerId, remotePlayer);
    
    console.log(`Added remote player: ${playerName} (${playerId})`);
}

/**
 * Updates remote player position
 * @param {string} playerId - Player ID
 * @param {object} position - New position
 * @param {object} rotation - New rotation
 */
function updateRemotePlayerPosition(playerId, position, rotation) {
    const remotePlayer = _remotePlayers.get(playerId);
    if (remotePlayer) {
        updateRemotePlayer(remotePlayer, position, rotation);
    }
}

/**
 * Handles remote player shot
 * @param {object} data - Shot data
 */
function handleRemotePlayerShot(data) {
    console.log('Remote player shot:', data);
    // TODO: Implement visual effects for remote shots
    if (_callbacks.onRemoteShot) _callbacks.onRemoteShot(data);
}

/**
 * Removes a remote player
 * @param {string} playerId - Player ID to remove
 */
function removeRemotePlayer(playerId) {
    const remotePlayer = _remotePlayers.get(playerId);
    if (remotePlayer) {
        removeRemotePlayer(remotePlayer);
        _remotePlayers.delete(playerId);
        console.log(`Removed remote player: ${playerId}`);
    }
}

/**
 * Clears all remote players
 */
function clearRemotePlayers() {
    _remotePlayers.forEach((remotePlayer, playerId) => {
        removeRemotePlayer(remotePlayer);
    });
    _remotePlayers.clear();
}

/**
 * Gets multiplayer status
 * @returns {boolean} True if in multiplayer mode
 */
export function isMultiplayer() {
    return _isMultiplayer;
}

/**
 * Gets all remote players
 * @returns {Map} Remote players map
 */
export function getRemotePlayersMap() {
    return _remotePlayers;
}