// server/src/MessageHandler.js
// Message processing with validation and security checks

class MessageHandler {
    constructor(gameServer) {
        this.gameServer = gameServer;
        this.messageTypes = new Set([
            'join_room',
            'leave_room',
            'player_position',
            'player_shot',
            'ping'
        ]);
    }
    
    /**
     * Processes incoming message from player
     * @param {Player} player - Player who sent the message
     * @param {object} data - Parsed message data
     */
    async processMessage(player, data) {
        // Validate message structure
        if (!data || typeof data !== 'object') {
            console.warn(`Invalid message structure from player ${player.id}`);
            return;
        }
        
        // Check message type
        if (!data.type || !this.messageTypes.has(data.type)) {
            console.warn(`Unknown message type from player ${player.id}: ${data.type}`);
            player.send({
                type: 'error',
                message: 'Unknown message type'
            });
            return;
        }
        
        // Route to appropriate handler
        try {
            switch (data.type) {
                case 'join_room':
                    await this.handleJoinRoom(player, data);
                    break;
                case 'leave_room':
                    await this.handleLeaveRoom(player);
                    break;
                case 'player_position':
                    await this.handlePlayerPosition(player, data);
                    break;
                case 'player_shot':
                    await this.handlePlayerShot(player, data);
                    break;
                case 'ping':
                    await this.handlePing(player);
                    break;
            }
        } catch (error) {
            console.error(`Error handling ${data.type} from player ${player.id}:`, error);
            player.send({
                type: 'error',
                message: 'Failed to process message'
            });
        }
    }
    
    /**
     * Handles room join request
     * @param {Player} player - Player joining
     * @param {object} data - Join data
     */
    async handleJoinRoom(player, data) {
        // Validate input
        const roomId = this.sanitizeRoomId(data.roomId);
        const playerName = this.sanitizePlayerName(data.playerName);
        
        if (!roomId) {
            player.send({
                type: 'error',
                message: 'Invalid room ID. Must be 1-50 characters, alphanumeric with hyphens/underscores only.'
            });
            return;
        }
        
        if (!playerName) {
            player.send({
                type: 'error',
                message: 'Invalid player name. Must be 1-30 characters.'
            });
            return;
        }
        
        // Leave current room if in one
        if (player.roomId) {
            await this.handleLeaveRoom(player);
        }
        
        // Get or create room
        let room = this.gameServer.rooms.get(roomId);
        if (!room) {
            // Check room limit
            if (this.gameServer.rooms.size >= this.gameServer.config.maxRooms) {
                player.send({
                    type: 'error',
                    message: 'Server room limit reached'
                });
                return;
            }
            
            room = this.gameServer.createRoom(roomId);
        }
        
        // Try to add player to room
        const result = room.addPlayer(player, playerName);
        if (!result.success) {
            player.send({
                type: 'error',
                message: result.reason
            });
            return;
        }
        
        // Send success response with player ID
        player.send({
            type: 'assign_id',
            playerId: player.id,
            roomId: roomId
        });
        
        // Send current game state to new player
        const gameState = room.getState();
        player.send({
            type: 'game_state',
            ...gameState
        });
        
        // Broadcast player joined to others in room
        room.broadcast({
            type: 'player_joined',
            playerId: player.id,
            playerName: playerName,
            position: player.position
        }, player.id);
        
        console.log(`Player ${player.id} (${playerName}) joined room ${roomId}`);
    }
    
    /**
     * Handles room leave request
     * @param {Player} player - Player leaving
     */
    async handleLeaveRoom(player) {
        if (!player.roomId) {
            return;
        }
        
        const room = this.gameServer.rooms.get(player.roomId);
        if (!room) {
            return;
        }
        
        const roomId = player.roomId;
        const remainingPlayers = room.removePlayer(player.id);
        
        // Broadcast player left to remaining players
        if (remainingPlayers.length > 0) {
            room.broadcast({
                type: 'player_left',
                playerId: player.id,
                playerName: player.name
            });
        }
        
        console.log(`Player ${player.id} left room ${roomId}`);
        
        // Clean up empty room
        if (room.shouldCleanup(0)) {
            this.gameServer.removeRoom(roomId);
        }
    }
    
    /**
     * Handles player position update
     * @param {Player} player - Player updating position
     * @param {object} data - Position data
     */
    async handlePlayerPosition(player, data) {
        // Check if player is in a room
        if (!player.roomId) {
            return;
        }
        
        const room = this.gameServer.rooms.get(player.roomId);
        if (!room) {
            return;
        }
        
        // Validate and update position
        if (!player.updatePosition(data.position, data.rotation)) {
            console.warn(`Invalid position data from player ${player.id}`);
            return;
        }
        
        // Update room state
        room.updatePlayerState(player.id, data.position, data.rotation);
        
        // Broadcast to other players in room
        room.broadcast({
            type: 'player_position',
            playerId: player.id,
            position: data.position,
            rotation: data.rotation,
            timestamp: data.timestamp || Date.now()
        }, player.id);
    }
    
    /**
     * Handles player shot event
     * @param {Player} player - Player shooting
     * @param {object} data - Shot data
     */
    async handlePlayerShot(player, data) {
        // Check if player is in a room
        if (!player.roomId) {
            return;
        }
        
        const room = this.gameServer.rooms.get(player.roomId);
        if (!room) {
            return;
        }
        
        // Validate shot data
        if (!this.isValidShotData(data)) {
            console.warn(`Invalid shot data from player ${player.id}`);
            return;
        }
        
        // Broadcast to other players in room
        room.broadcast({
            type: 'player_shot',
            playerId: player.id,
            position: data.position,
            direction: data.direction,
            timestamp: data.timestamp || Date.now()
        }, player.id);
    }
    
    /**
     * Handles ping message (heartbeat)
     * @param {Player} player - Player sending ping
     */
    async handlePing(player) {
        player.heartbeat();
        player.send({ type: 'pong' });
    }
    
    /**
     * Sanitizes room ID
     * @param {string} roomId - Room ID to sanitize
     * @returns {string|null} - Sanitized room ID or null if invalid
     */
    sanitizeRoomId(roomId) {
        if (typeof roomId !== 'string') return null;
        
        // Trim and check length
        roomId = roomId.trim();
        if (roomId.length < 1 || roomId.length > 50) return null;
        
        // Check format (alphanumeric, hyphens, underscores)
        const validPattern = /^[a-zA-Z0-9_-]+$/;
        if (!validPattern.test(roomId)) return null;
        
        return roomId;
    }
    
    /**
     * Sanitizes player name
     * @param {string} playerName - Player name to sanitize
     * @returns {string|null} - Sanitized name or null if invalid
     */
    sanitizePlayerName(playerName) {
        if (typeof playerName !== 'string') return null;
        
        // Remove HTML tags and dangerous characters
        playerName = playerName
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/[<>'"&]/g, '') // Remove dangerous characters
            .replace(/\s+/g, ' ')    // Normalize whitespace
            .trim();
        
        // Check length
        if (playerName.length < 1 || playerName.length > 30) return null;
        
        return playerName;
    }
    
    /**
     * Validates shot data structure
     * @param {object} data - Shot data to validate
     * @returns {boolean} - Whether data is valid
     */
    isValidShotData(data) {
        return data &&
               data.position &&
               typeof data.position.x === 'number' &&
               typeof data.position.y === 'number' &&
               typeof data.position.z === 'number' &&
               data.direction &&
               typeof data.direction.x === 'number' &&
               typeof data.direction.y === 'number' &&
               typeof data.direction.z === 'number' &&
               !isNaN(data.position.x) && !isNaN(data.position.y) && !isNaN(data.position.z) &&
               !isNaN(data.direction.x) && !isNaN(data.direction.y) && !isNaN(data.direction.z);
    }
}

module.exports = MessageHandler;