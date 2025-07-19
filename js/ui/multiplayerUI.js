// js/ui/multiplayerUI.js
// UI components for multiplayer functionality

import { connectToServer, disconnectFromServer, isMultiplayer } from '../multiplayer/manager.js';

let _multiplayerPanel = null;
let _connectButton = null;
let _disconnectButton = null;
let _statusIndicator = null;
let _serverUrlInput = null;
let _roomIdInput = null;
let _playerNameInput = null;
let _playerCountDisplay = null;

/**
 * Initializes multiplayer UI components
 */
export function initMultiplayerUI() {
    createMultiplayerPanel();
    setupEventListeners();
    updateConnectionStatus(false);
    console.log('Multiplayer UI initialized');
}

/**
 * Creates the multiplayer panel HTML
 */
function createMultiplayerPanel() {
    // Create main panel
    _multiplayerPanel = document.createElement('div');
    _multiplayerPanel.id = 'multiplayer-panel';
    _multiplayerPanel.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 300px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 15px;
        border-radius: 10px;
        font-family: Arial, sans-serif;
        font-size: 14px;
        z-index: 1000;
        border: 2px solid #444;
    `;

    // Create content
    _multiplayerPanel.innerHTML = `
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
            <h3 style="margin: 0; flex-grow: 1;">Multiplayer</h3>
            <div id="status-indicator" style="
                width: 12px;
                height: 12px;
                border-radius: 50%;
                background: #ff0000;
                margin-left: 10px;
            "></div>
        </div>
        
        <div id="connection-form" style="margin-bottom: 15px;">
            <input type="text" id="server-url" placeholder="Server URL (ws://localhost:8080)" 
                   style="width: 100%; margin-bottom: 8px; padding: 5px; border: 1px solid #555; background: #333; color: white; border-radius: 3px;">
            <input type="text" id="room-id" placeholder="Room ID" 
                   style="width: 100%; margin-bottom: 8px; padding: 5px; border: 1px solid #555; background: #333; color: white; border-radius: 3px;">
            <input type="text" id="player-name" placeholder="Player Name" 
                   style="width: 100%; margin-bottom: 8px; padding: 5px; border: 1px solid #555; background: #333; color: white; border-radius: 3px;">
        </div>
        
        <div style="margin-bottom: 15px;">
            <button id="connect-button" style="
                width: 48%;
                padding: 8px;
                background: #28a745;
                color: white;
                border: none;
                border-radius: 3px;
                cursor: pointer;
                margin-right: 4%;
            ">Connect</button>
            <button id="disconnect-button" style="
                width: 48%;
                padding: 8px;
                background: #dc3545;
                color: white;
                border: none;
                border-radius: 3px;
                cursor: pointer;
                display: none;
            ">Disconnect</button>
        </div>
        
        <div id="player-count" style="
            font-size: 12px;
            color: #ccc;
            text-align: center;
        ">Not connected</div>
    `;

    // Add to document
    document.body.appendChild(_multiplayerPanel);

    // Get references to elements
    _statusIndicator = document.getElementById('status-indicator');
    _connectButton = document.getElementById('connect-button');
    _disconnectButton = document.getElementById('disconnect-button');
    _serverUrlInput = document.getElementById('server-url');
    _roomIdInput = document.getElementById('room-id');
    _playerNameInput = document.getElementById('player-name');
    _playerCountDisplay = document.getElementById('player-count');

    // Set default values
    _serverUrlInput.value = 'ws://localhost:8080';
    _roomIdInput.value = 'game-room';
    _playerNameInput.value = 'Player' + Math.floor(Math.random() * 1000);
}

/**
 * Sets up event listeners for UI elements
 */
function setupEventListeners() {
    _connectButton.addEventListener('click', handleConnect);
    _disconnectButton.addEventListener('click', handleDisconnect);
    
    // Add hover effects
    _connectButton.addEventListener('mouseenter', () => {
        _connectButton.style.background = '#218838';
    });
    _connectButton.addEventListener('mouseleave', () => {
        _connectButton.style.background = '#28a745';
    });
    
    _disconnectButton.addEventListener('mouseenter', () => {
        _disconnectButton.style.background = '#c82333';
    });
    _disconnectButton.addEventListener('mouseleave', () => {
        _disconnectButton.style.background = '#dc3545';
    });
}

/**
 * Validates input fields
 * @param {string} serverUrl - Server URL
 * @param {string} roomId - Room ID
 * @param {string} playerName - Player name
 * @returns {string|null} Error message or null if valid
 */
function validateInputs(serverUrl, roomId, playerName) {
    if (!serverUrl || !roomId || !playerName) {
        return 'Please fill in all fields';
    }
    
    // Validate WebSocket URL format
    try {
        const url = new URL(serverUrl);
        if (!['ws:', 'wss:'].includes(url.protocol)) {
            return 'Server URL must use ws:// or wss:// protocol';
        }
    } catch (error) {
        return 'Invalid server URL format';
    }
    
    // Validate room ID
    const roomIdPattern = /^[a-zA-Z0-9_-]+$/;
    if (roomId.length < 1 || roomId.length > 50 || !roomIdPattern.test(roomId)) {
        return 'Room ID must be 1-50 characters, letters/numbers/hyphens/underscores only';
    }
    
    // Validate player name
    if (playerName.length < 1 || playerName.length > 30) {
        return 'Player name must be 1-30 characters';
    }
    
    // Check for dangerous characters in player name
    if (/<[^>]*>|[<>'"&]/.test(playerName)) {
        return 'Player name contains invalid characters';
    }
    
    return null;
}

/**
 * Handles connect button click
 */
function handleConnect() {
    const serverUrl = _serverUrlInput.value.trim();
    const roomId = _roomIdInput.value.trim();
    const playerName = _playerNameInput.value.trim();

    const validationError = validateInputs(serverUrl, roomId, playerName);
    if (validationError) {
        alert(validationError);
        return;
    }

    console.log('Connecting to multiplayer server...');
    connectToServer(serverUrl, roomId, playerName);
}

/**
 * Handles disconnect button click
 */
function handleDisconnect() {
    console.log('Disconnecting from multiplayer server...');
    disconnectFromServer();
}

/**
 * Updates the connection status indicator
 * @param {boolean} isConnected - Whether connected to server
 */
export function updateConnectionStatus(isConnected) {
    if (!_statusIndicator) return;

    if (isConnected) {
        _statusIndicator.style.background = '#28a745';
        _connectButton.style.display = 'none';
        _disconnectButton.style.display = 'inline-block';
        _playerCountDisplay.textContent = 'Connected';
        
        // Disable input fields
        _serverUrlInput.disabled = true;
        _roomIdInput.disabled = true;
        _playerNameInput.disabled = true;
    } else {
        _statusIndicator.style.background = '#dc3545';
        _connectButton.style.display = 'inline-block';
        _disconnectButton.style.display = 'none';
        _playerCountDisplay.textContent = 'Not connected';
        
        // Enable input fields
        _serverUrlInput.disabled = false;
        _roomIdInput.disabled = false;
        _playerNameInput.disabled = false;
    }
}

/**
 * Updates the player count display
 * @param {number} count - Number of connected players
 */
export function updatePlayerCount(count) {
    if (!_playerCountDisplay) return;
    _playerCountDisplay.textContent = `Players: ${count}`;
}

/**
 * Shows a connection error message
 * @param {string} message - Error message
 */
export function showConnectionError(message) {
    alert(`Connection Error: ${message}`);
}

/**
 * Hides the multiplayer panel
 */
export function hideMultiplayerPanel() {
    if (_multiplayerPanel) {
        _multiplayerPanel.style.display = 'none';
    }
}

/**
 * Shows the multiplayer panel
 */
export function showMultiplayerPanel() {
    if (_multiplayerPanel) {
        _multiplayerPanel.style.display = 'block';
    }
}

/**
 * Toggles the multiplayer panel visibility
 */
export function toggleMultiplayerPanel() {
    if (_multiplayerPanel) {
        const isVisible = _multiplayerPanel.style.display !== 'none';
        if (isVisible) {
            hideMultiplayerPanel();
        } else {
            showMultiplayerPanel();
        }
    }
}