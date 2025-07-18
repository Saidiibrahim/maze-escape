// js/multiplayer/websocket.js
// Simple WebSocket connection manager for multiplayer functionality

let _socket = null;
let _isConnected = false;
let _playerId = null;
let _callbacks = {};

/**
 * Initializes WebSocket connection
 * @param {string} url - WebSocket server URL
 * @param {object} callbacks - Event callbacks
 */
export function initWebSocket(url, callbacks = {}) {
    _callbacks = callbacks;
    
    try {
        _socket = new WebSocket(url);
        
        _socket.onopen = () => {
            console.log('WebSocket connected');
            _isConnected = true;
            if (_callbacks.onConnect) _callbacks.onConnect();
        };
        
        _socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleMessage(data);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };
        
        _socket.onclose = () => {
            console.log('WebSocket disconnected');
            _isConnected = false;
            if (_callbacks.onDisconnect) _callbacks.onDisconnect();
        };
        
        _socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            if (_callbacks.onError) _callbacks.onError(error);
        };
        
    } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        if (_callbacks.onError) _callbacks.onError(error);
    }
}

/**
 * Handles incoming WebSocket messages
 * @param {object} data - Parsed message data
 */
function handleMessage(data) {
    const { type, ...payload } = data;
    
    switch (type) {
        case 'player_joined':
            if (_callbacks.onPlayerJoined) _callbacks.onPlayerJoined(payload);
            break;
        case 'player_left':
            if (_callbacks.onPlayerLeft) _callbacks.onPlayerLeft(payload);
            break;
        case 'player_position':
            if (_callbacks.onPlayerPosition) _callbacks.onPlayerPosition(payload);
            break;
        case 'player_shot':
            if (_callbacks.onPlayerShot) _callbacks.onPlayerShot(payload);
            break;
        case 'game_state':
            if (_callbacks.onGameState) _callbacks.onGameState(payload);
            break;
        case 'assign_id':
            _playerId = payload.playerId;
            if (_callbacks.onIdAssigned) _callbacks.onIdAssigned(payload);
            break;
        default:
            console.warn('Unknown message type:', type);
    }
}

/**
 * Sends a message to the WebSocket server
 * @param {string} type - Message type
 * @param {object} payload - Message payload
 */
export function sendMessage(type, payload = {}) {
    if (!_isConnected || !_socket) {
        console.warn('WebSocket not connected');
        return false;
    }
    
    try {
        const message = JSON.stringify({ type, ...payload });
        _socket.send(message);
        return true;
    } catch (error) {
        console.error('Error sending WebSocket message:', error);
        return false;
    }
}

/**
 * Sends player position update
 * @param {object} position - Player position {x, y, z}
 * @param {object} rotation - Player rotation {x, y, z}
 */
export function sendPlayerPosition(position, rotation) {
    return sendMessage('player_position', {
        playerId: _playerId,
        position,
        rotation,
        timestamp: Date.now()
    });
}

/**
 * Sends player shot event
 * @param {object} position - Shot origin
 * @param {object} direction - Shot direction
 */
export function sendPlayerShot(position, direction) {
    return sendMessage('player_shot', {
        playerId: _playerId,
        position,
        direction,
        timestamp: Date.now()
    });
}

/**
 * Joins a game room
 * @param {string} roomId - Room ID to join
 * @param {string} playerName - Player name
 */
export function joinRoom(roomId, playerName) {
    return sendMessage('join_room', {
        roomId,
        playerName
    });
}

/**
 * Closes the WebSocket connection
 */
export function closeWebSocket() {
    if (_socket) {
        _socket.close();
        _socket = null;
        _isConnected = false;
        _playerId = null;
    }
}

/**
 * Gets connection status
 * @returns {boolean} True if connected
 */
export function isConnected() {
    return _isConnected;
}

/**
 * Gets current player ID
 * @returns {string|null} Player ID or null if not assigned
 */
export function getPlayerId() {
    return _playerId;
}