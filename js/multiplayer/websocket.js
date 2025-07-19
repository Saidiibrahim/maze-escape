// js/multiplayer/websocket.js
// Simple WebSocket connection manager for multiplayer functionality

let _socket = null;
let _isConnected = false;
let _playerId = null;
let _callbacks = {};

/**
 * Validates WebSocket URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if URL is valid
 */
function isValidWebSocketUrl(url) {
    try {
        const parsedUrl = new URL(url);
        
        // Only allow ws: and wss: protocols
        if (!['ws:', 'wss:'].includes(parsedUrl.protocol)) {
            return false;
        }
        
        // Validate hostname (basic check for malformed URLs)
        if (!parsedUrl.hostname) {
            return false;
        }
        
        // Prevent obviously malicious patterns
        const hostname = parsedUrl.hostname.toLowerCase();
        const suspiciousPatterns = [
            'javascript:',
            'data:',
            'file:',
            'blob:'
        ];
        
        if (suspiciousPatterns.some(pattern => hostname.includes(pattern))) {
            return false;
        }
        
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Initializes WebSocket connection
 * @param {string} url - WebSocket server URL
 * @param {object} callbacks - Event callbacks
 */
export function initWebSocket(url, callbacks = {}) {
    _callbacks = callbacks;
    
    // Validate URL before attempting connection
    if (!isValidWebSocketUrl(url)) {
        const error = new Error('Invalid WebSocket URL. Only ws:// and wss:// protocols are allowed.');
        console.error('WebSocket URL validation failed:', error);
        if (_callbacks.onError) _callbacks.onError(error);
        return;
    }
    
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
 * Sanitizes input strings to prevent XSS
 * @param {string} input - Input string to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized string
 */
function sanitizeInput(input, maxLength = 50) {
    if (typeof input !== 'string') {
        return '';
    }
    
    // Remove HTML tags and dangerous characters
    const sanitized = input
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/[<>'"&]/g, '') // Remove dangerous characters
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
    
    // Limit length
    return sanitized.substring(0, maxLength);
}

/**
 * Validates room ID format
 * @param {string} roomId - Room ID to validate
 * @returns {boolean} True if valid
 */
function isValidRoomId(roomId) {
    // Allow alphanumeric, hyphens, and underscores only
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    return typeof roomId === 'string' && 
           roomId.length >= 1 && 
           roomId.length <= 50 && 
           validPattern.test(roomId);
}

/**
 * Validates player name format
 * @param {string} playerName - Player name to validate
 * @returns {boolean} True if valid
 */
function isValidPlayerName(playerName) {
    return typeof playerName === 'string' && 
           playerName.trim().length >= 1 && 
           playerName.trim().length <= 30;
}

/**
 * Joins a game room
 * @param {string} roomId - Room ID to join
 * @param {string} playerName - Player name
 */
export function joinRoom(roomId, playerName) {
    // Sanitize inputs
    const sanitizedRoomId = sanitizeInput(roomId, 50);
    const sanitizedPlayerName = sanitizeInput(playerName, 30);
    
    // Validate inputs
    if (!isValidRoomId(sanitizedRoomId)) {
        console.error('Invalid room ID. Must be 1-50 characters, alphanumeric with hyphens/underscores only.');
        return false;
    }
    
    if (!isValidPlayerName(sanitizedPlayerName)) {
        console.error('Invalid player name. Must be 1-30 characters.');
        return false;
    }
    
    return sendMessage('join_room', {
        roomId: sanitizedRoomId,
        playerName: sanitizedPlayerName
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