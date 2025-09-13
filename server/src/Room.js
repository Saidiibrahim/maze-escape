// server/src/Room.js
// Room management with player limits and state tracking

class Room {
    constructor(id, maxPlayers = 10) {
        this.id = id;
        this.players = new Map();
        this.maxPlayers = maxPlayers;
        this.createdAt = Date.now();
        this.lastActivity = Date.now();
        this.state = {
            players: new Map() // playerId -> player state
        };
    }
    
    /**
     * Adds a player to the room
     * @param {Player} player - Player instance to add
     * @param {string} playerName - Player's display name
     * @returns {object} - Result {success, reason}
     */
    addPlayer(player, playerName) {
        // Check if room is full
        if (this.players.size >= this.maxPlayers) {
            return { success: false, reason: 'Room is full' };
        }
        
        // Check if player is already in room
        if (this.players.has(player.id)) {
            return { success: false, reason: 'Player already in room' };
        }
        
        // Add player to room
        player.roomId = this.id;
        player.name = playerName;
        this.players.set(player.id, player);
        
        // Update room state
        this.state.players.set(player.id, {
            playerId: player.id,
            playerName: playerName,
            position: player.position,
            rotation: player.rotation
        });
        
        this.updateActivity();
        
        return { success: true };
    }
    
    /**
     * Removes a player from the room
     * @param {string} playerId - ID of player to remove
     * @returns {Array} - List of remaining player IDs
     */
    removePlayer(playerId) {
        const player = this.players.get(playerId);
        if (player) {
            player.roomId = null;
            this.players.delete(playerId);
            this.state.players.delete(playerId);
            this.updateActivity();
        }
        
        return Array.from(this.players.keys());
    }
    
    /**
     * Broadcasts a message to all players in the room
     * @param {object} message - Message to broadcast
     * @param {string} excludePlayerId - Optional player ID to exclude
     */
    broadcast(message, excludePlayerId = null) {
        const messageStr = JSON.stringify(message);
        let successCount = 0;
        
        this.players.forEach((player, playerId) => {
            if (playerId !== excludePlayerId) {
                try {
                    if (player.ws.readyState === player.ws.OPEN) {
                        player.ws.send(messageStr);
                        successCount++;
                    }
                } catch (error) {
                    console.error(`Error broadcasting to player ${playerId}:`, error);
                }
            }
        });
        
        this.updateActivity();
        return successCount;
    }
    
    /**
     * Updates a player's position in the room state
     * @param {string} playerId - Player ID
     * @param {object} position - New position
     * @param {object} rotation - New rotation
     */
    updatePlayerState(playerId, position, rotation) {
        const playerState = this.state.players.get(playerId);
        if (playerState) {
            playerState.position = position;
            playerState.rotation = rotation;
            this.updateActivity();
        }
    }
    
    /**
     * Gets the current room state for new joiners
     * @returns {object} - Room state
     */
    getState() {
        const players = [];
        this.state.players.forEach(playerState => {
            players.push({
                playerId: playerState.playerId,
                playerName: playerState.playerName,
                position: playerState.position,
                rotation: playerState.rotation
            });
        });
        
        return {
            roomId: this.id,
            players: players,
            playerCount: this.players.size
        };
    }
    
    /**
     * Gets list of all players in room
     * @returns {Array} - Array of player data
     */
    getPlayers() {
        const players = [];
        this.players.forEach(player => {
            players.push(player.getPublicData());
        });
        return players;
    }
    
    /**
     * Updates room's last activity timestamp
     */
    updateActivity() {
        this.lastActivity = Date.now();
    }
    
    /**
     * Checks if room should be cleaned up
     * @param {number} idleTimeout - Idle timeout in milliseconds
     * @returns {boolean} - Whether room should be cleaned up
     */
    shouldCleanup(idleTimeout) {
        return this.players.size === 0 && 
               (Date.now() - this.lastActivity) > idleTimeout;
    }
    
    /**
     * Gets room information
     * @returns {object} - Room info
     */
    getInfo() {
        return {
            id: this.id,
            playerCount: this.players.size,
            maxPlayers: this.maxPlayers,
            createdAt: this.createdAt,
            lastActivity: this.lastActivity
        };
    }
    
    /**
     * Checks if room has capacity for more players
     * @returns {boolean} - Whether room has space
     */
    hasSpace() {
        return this.players.size < this.maxPlayers;
    }
}

module.exports = Room;