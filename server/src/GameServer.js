// server/src/GameServer.js
// Core WebSocket server with connection management

const WebSocket = require('ws');
const Player = require('./Player');
const Room = require('./Room');
const MessageHandler = require('./MessageHandler');
const RateLimiter = require('./RateLimiter');

class GameServer {
    constructor(config) {
        this.config = config;
        this.wss = null;
        this.rooms = new Map();
        this.players = new Map();
        this.connectionCount = 0;
        this.ipConnections = new Map(); // Track connections per IP
        this.rateLimiter = new RateLimiter(config.rateLimit);
        this.messageHandler = new MessageHandler(this);
        this.heartbeatInterval = null;
        this.cleanupInterval = null;
    }
    
    /**
     * Starts the WebSocket server
     * @param {number} port - Port to listen on
     */
    start(port = this.config.port) {
        // Create WebSocket server
        this.wss = new WebSocket.Server({
            port: port,
            perMessageDeflate: false, // Disable compression for lower latency
            maxPayload: this.config.messages.maxSize,
            verifyClient: (info) => this.verifyClient(info)
        });
        
        // Set up connection handler
        this.wss.on('connection', (ws, request) => this.handleConnection(ws, request));
        
        // Start heartbeat interval
        this.heartbeatInterval = setInterval(() => this.heartbeatCheck(), this.config.heartbeat.interval);
        
        // Start cleanup interval
        this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Every minute
        
        console.log(`WebSocket server started on port ${port}`);
    }
    
    /**
     * Verifies client connection before accepting
     * @param {object} info - Connection info
     * @returns {boolean} - Whether to accept connection
     */
    verifyClient(info) {
        // Check total connection limit
        if (this.connectionCount >= this.config.maxConnections) {
            console.warn('Connection rejected: Server full');
            return false;
        }
        
        // Extract IP address
        const ip = info.req.socket.remoteAddress;
        
        // Check per-IP connection limit
        const ipCount = this.ipConnections.get(ip) || 0;
        if (ipCount >= this.config.maxConnectionsPerIP) {
            console.warn(`Connection rejected: Too many connections from ${ip}`);
            return false;
        }
        
        // Check origin if configured
        if (this.config.cors.allowedOrigins.length > 0) {
            const origin = info.origin || info.req.headers.origin;
            if (!origin || !this.config.cors.allowedOrigins.includes(origin)) {
                console.warn(`Connection rejected: Invalid origin ${origin}`);
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Handles new WebSocket connection
     * @param {WebSocket} ws - WebSocket connection
     * @param {object} request - HTTP request
     */
    handleConnection(ws, request) {
        const ip = request.socket.remoteAddress;
        const playerId = this.generatePlayerId();
        
        // Create player instance
        const player = new Player(ws, playerId, ip);
        this.players.set(playerId, player);
        
        // Update connection tracking
        this.connectionCount++;
        this.ipConnections.set(ip, (this.ipConnections.get(ip) || 0) + 1);
        
        console.log(`Player ${playerId} connected from ${ip}`);
        
        // Set up WebSocket event handlers
        ws.on('message', (data) => this.handleMessage(player, data));
        ws.on('close', () => this.handleDisconnect(player));
        ws.on('error', (error) => this.handleError(player, error));
        ws.on('pong', () => player.heartbeat());
        
        // Send welcome message
        player.send({
            type: 'connected',
            playerId: playerId,
            serverVersion: '1.0.0'
        });
    }
    
    /**
     * Handles incoming message from player
     * @param {Player} player - Player who sent message
     * @param {Buffer} rawData - Raw message data
     */
    async handleMessage(player, rawData) {
        // Check message size
        if (rawData.length > this.config.messages.maxSize) {
            console.warn(`Message too large from player ${player.id}: ${rawData.length} bytes`);
            player.ws.close(1009, 'Message too large');
            return;
        }
        
        // Check rate limit
        const rateCheck = this.rateLimiter.checkLimit(player);
        if (!rateCheck.allowed) {
            player.send({
                type: 'error',
                message: rateCheck.reason
            });
            
            // Close connection if banned
            if (this.rateLimiter.isBanned(player.id)) {
                player.ws.close(1008, rateCheck.reason);
            }
            return;
        }
        
        // Parse message
        let data;
        try {
            // Ensure it's a string (not binary frame)
            if (typeof rawData !== 'string') {
                rawData = rawData.toString();
            }
            data = JSON.parse(rawData);
        } catch (error) {
            console.warn(`Invalid JSON from player ${player.id}`);
            player.send({
                type: 'error',
                message: 'Invalid message format'
            });
            return;
        }
        
        // Process message
        await this.messageHandler.processMessage(player, data);
    }
    
    /**
     * Handles player disconnection
     * @param {Player} player - Disconnecting player
     */
    handleDisconnect(player) {
        console.log(`Player ${player.id} disconnected`);
        
        // Leave room if in one
        if (player.roomId) {
            this.messageHandler.handleLeaveRoom(player);
        }
        
        // Update connection tracking
        this.connectionCount--;
        const ipCount = this.ipConnections.get(player.ipAddress) || 0;
        if (ipCount > 1) {
            this.ipConnections.set(player.ipAddress, ipCount - 1);
        } else {
            this.ipConnections.delete(player.ipAddress);
        }
        
        // Remove player
        this.players.delete(player.id);
    }
    
    /**
     * Handles WebSocket error
     * @param {Player} player - Player with error
     * @param {Error} error - Error object
     */
    handleError(player, error) {
        console.error(`WebSocket error for player ${player.id}:`, error);
    }
    
    /**
     * Performs heartbeat check on all connections
     */
    heartbeatCheck() {
        const timeout = this.config.heartbeat.timeout;
        const now = Date.now();
        
        this.players.forEach((player, playerId) => {
            if (!player.isAlive) {
                // Connection is dead, terminate it
                console.log(`Terminating stale connection for player ${playerId}`);
                player.ws.terminate();
                return;
            }
            
            // Check if connection is stale
            if (player.isStale(timeout)) {
                console.warn(`Player ${playerId} connection appears stale`);
            }
            
            // Mark as dead until we get pong
            player.isAlive = false;
            player.ws.ping();
        });
    }
    
    /**
     * Creates a new room
     * @param {string} roomId - Room ID
     * @returns {Room} - Created room
     */
    createRoom(roomId) {
        const room = new Room(roomId, this.config.maxPlayersPerRoom);
        this.rooms.set(roomId, room);
        console.log(`Room ${roomId} created`);
        return room;
    }
    
    /**
     * Removes a room
     * @param {string} roomId - Room ID to remove
     */
    removeRoom(roomId) {
        this.rooms.delete(roomId);
        console.log(`Room ${roomId} removed`);
    }
    
    /**
     * Performs periodic cleanup tasks
     */
    cleanup() {
        // Clean up empty rooms
        const idleTimeout = this.config.rooms.idleTimeout;
        this.rooms.forEach((room, roomId) => {
            if (room.shouldCleanup(idleTimeout)) {
                this.removeRoom(roomId);
            }
        });
        
        // Clean up rate limiter
        this.rateLimiter.cleanup();
        
        // Log server stats
        console.log(`Server stats: ${this.connectionCount} players, ${this.rooms.size} rooms`);
    }
    
    /**
     * Generates unique player ID
     * @returns {string} - Player ID
     */
    generatePlayerId() {
        return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Stops the server gracefully
     */
    stop() {
        console.log('Stopping server...');
        
        // Clear intervals
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        
        // Close all connections
        this.players.forEach(player => {
            player.ws.close(1000, 'Server shutting down');
        });
        
        // Close server
        if (this.wss) {
            this.wss.close(() => {
                console.log('Server stopped');
            });
        }
    }
    
    /**
     * Gets server statistics
     * @returns {object} - Server stats
     */
    getStats() {
        const roomStats = [];
        this.rooms.forEach(room => {
            roomStats.push(room.getInfo());
        });
        
        return {
            connectionCount: this.connectionCount,
            roomCount: this.rooms.size,
            rooms: roomStats,
            rateLimiter: this.rateLimiter.getStats(),
            uptime: process.uptime()
        };
    }
}

module.exports = GameServer;