// server/src/Player.js
// Player state management and connection tracking

class Player {
    constructor(ws, id, ipAddress) {
        this.ws = ws;
        this.id = id;
        this.ipAddress = ipAddress;
        this.roomId = null;
        this.name = null;
        this.isAlive = true;
        this.lastHeartbeat = Date.now();
        this.messageCount = 0;
        this.messageWindow = Date.now();
        this.position = { x: 0, y: 0, z: 0 };
        this.rotation = { x: 0, y: 0, z: 0 };
        this.joinedAt = Date.now();
        this.violations = 0; // Track rate limit violations
    }
    
    /**
     * Safely sends a message to the player
     * @param {object} message - Message object to send
     * @returns {boolean} - Success status
     */
    send(message) {
        try {
            if (this.ws.readyState === this.ws.OPEN) {
                this.ws.send(JSON.stringify(message));
                return true;
            }
            return false;
        } catch (error) {
            console.error(`Error sending message to player ${this.id}:`, error);
            return false;
        }
    }
    
    /**
     * Updates player position with validation
     * @param {object} position - New position {x, y, z}
     * @param {object} rotation - New rotation {x, y, z}
     * @returns {boolean} - Whether update was valid
     */
    updatePosition(position, rotation) {
        // Validate position structure
        if (!this.isValidPosition(position) || !this.isValidRotation(rotation)) {
            return false;
        }
        
        // Check for unreasonable position changes (anti-cheat)
        const maxSpeed = 100; // units per update
        const distance = this.calculateDistance(this.position, position);
        if (distance > maxSpeed) {
            console.warn(`Player ${this.id} moved too fast: ${distance} units`);
            return false;
        }
        
        this.position = { ...position };
        this.rotation = { ...rotation };
        return true;
    }
    
    /**
     * Validates position object structure
     * @param {object} position - Position to validate
     * @returns {boolean} - Whether position is valid
     */
    isValidPosition(position) {
        return position &&
               typeof position.x === 'number' &&
               typeof position.y === 'number' &&
               typeof position.z === 'number' &&
               !isNaN(position.x) &&
               !isNaN(position.y) &&
               !isNaN(position.z) &&
               Math.abs(position.x) < 10000 &&
               Math.abs(position.y) < 10000 &&
               Math.abs(position.z) < 10000;
    }
    
    /**
     * Validates rotation object structure
     * @param {object} rotation - Rotation to validate
     * @returns {boolean} - Whether rotation is valid
     */
    isValidRotation(rotation) {
        return rotation &&
               typeof rotation.x === 'number' &&
               typeof rotation.y === 'number' &&
               typeof rotation.z === 'number' &&
               !isNaN(rotation.x) &&
               !isNaN(rotation.y) &&
               !isNaN(rotation.z);
    }
    
    /**
     * Calculates distance between two positions
     * @param {object} pos1 - First position
     * @param {object} pos2 - Second position
     * @returns {number} - Distance
     */
    calculateDistance(pos1, pos2) {
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const dz = pos2.z - pos1.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    /**
     * Resets message count for rate limiting
     * @param {number} currentTime - Current timestamp
     */
    resetMessageCount(currentTime) {
        this.messageCount = 0;
        this.messageWindow = currentTime;
    }
    
    /**
     * Records a rate limit violation
     */
    recordViolation() {
        this.violations++;
        console.warn(`Player ${this.id} has ${this.violations} rate limit violations`);
    }
    
    /**
     * Gets player data for game state
     * @returns {object} - Public player data
     */
    getPublicData() {
        return {
            playerId: this.id,
            playerName: this.name,
            position: this.position,
            rotation: this.rotation
        };
    }
    
    /**
     * Marks player as alive (heartbeat received)
     */
    heartbeat() {
        this.isAlive = true;
        this.lastHeartbeat = Date.now();
    }
    
    /**
     * Checks if player connection is stale
     * @param {number} timeout - Timeout in milliseconds
     * @returns {boolean} - Whether connection is stale
     */
    isStale(timeout) {
        return Date.now() - this.lastHeartbeat > timeout;
    }
}

module.exports = Player;