// server/src/RateLimiter.js
// Rate limiting with exponential backoff and penalty tracking

class RateLimiter {
    constructor(config) {
        this.windowMs = config.windowMs || 1000;
        this.maxMessages = config.maxMessages || 10;
        this.penalties = new Map(); // playerId -> penalty info
        this.banThreshold = 10; // violations before temp ban
        this.banDuration = 60000; // 1 minute ban
    }
    
    /**
     * Checks if a player has exceeded rate limits
     * @param {Player} player - Player to check
     * @returns {object} - {allowed: boolean, reason: string}
     */
    checkLimit(player) {
        const now = Date.now();
        
        // Check if player is temporarily banned
        if (this.isBanned(player.id)) {
            return { 
                allowed: false, 
                reason: 'Temporarily banned for rate limit violations' 
            };
        }
        
        // Reset window if expired
        if (now - player.messageWindow > this.windowMs) {
            player.resetMessageCount(now);
        }
        
        // Check message count
        if (player.messageCount >= this.maxMessages) {
            this.penalize(player);
            return { 
                allowed: false, 
                reason: `Rate limit exceeded: ${this.maxMessages} messages per ${this.windowMs}ms` 
            };
        }
        
        // Increment message count
        player.messageCount++;
        return { allowed: true };
    }
    
    /**
     * Applies penalty to a player for rate limit violation
     * @param {Player} player - Player to penalize
     */
    penalize(player) {
        player.recordViolation();
        
        let penalty = this.penalties.get(player.id);
        if (!penalty) {
            penalty = {
                violations: 0,
                lastViolation: Date.now(),
                bannedUntil: 0
            };
            this.penalties.set(player.id, penalty);
        }
        
        penalty.violations++;
        penalty.lastViolation = Date.now();
        
        // Apply temporary ban if threshold exceeded
        if (penalty.violations >= this.banThreshold) {
            penalty.bannedUntil = Date.now() + this.banDuration;
            console.warn(`Player ${player.id} temporarily banned for excessive rate limit violations`);
        }
    }
    
    /**
     * Checks if a player is currently banned
     * @param {string} playerId - Player ID to check
     * @returns {boolean} - Whether player is banned
     */
    isBanned(playerId) {
        const penalty = this.penalties.get(playerId);
        if (!penalty) return false;
        
        if (penalty.bannedUntil > Date.now()) {
            return true;
        }
        
        // Clean up expired ban
        if (penalty.bannedUntil > 0 && penalty.bannedUntil <= Date.now()) {
            penalty.violations = Math.floor(penalty.violations / 2); // Reduce violations
            penalty.bannedUntil = 0;
        }
        
        return false;
    }
    
    /**
     * Gets remaining ban time for a player
     * @param {string} playerId - Player ID
     * @returns {number} - Milliseconds until ban expires (0 if not banned)
     */
    getBanTimeRemaining(playerId) {
        const penalty = this.penalties.get(playerId);
        if (!penalty || penalty.bannedUntil <= Date.now()) {
            return 0;
        }
        return penalty.bannedUntil - Date.now();
    }
    
    /**
     * Cleans up old penalty records
     */
    cleanup() {
        const now = Date.now();
        const cleanupThreshold = 3600000; // 1 hour
        
        this.penalties.forEach((penalty, playerId) => {
            // Remove old records with no recent violations
            if (now - penalty.lastViolation > cleanupThreshold && penalty.bannedUntil < now) {
                this.penalties.delete(playerId);
            }
        });
    }
    
    /**
     * Gets rate limiter statistics
     * @returns {object} - Statistics
     */
    getStats() {
        let activeBans = 0;
        let totalPenalties = this.penalties.size;
        
        this.penalties.forEach(penalty => {
            if (penalty.bannedUntil > Date.now()) {
                activeBans++;
            }
        });
        
        return {
            totalPenalties,
            activeBans,
            windowMs: this.windowMs,
            maxMessages: this.maxMessages
        };
    }
}

module.exports = RateLimiter;