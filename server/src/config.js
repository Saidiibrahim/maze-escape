// server/src/config.js
// Centralized configuration for the WebSocket server

module.exports = {
    // Server settings
    port: process.env.PORT || 8080,
    host: process.env.HOST || 'localhost',
    
    // Connection limits
    maxConnections: parseInt(process.env.MAX_CONNECTIONS) || 1000,
    maxRooms: parseInt(process.env.MAX_ROOMS) || 100,
    maxPlayersPerRoom: parseInt(process.env.MAX_PLAYERS_PER_ROOM) || 10,
    maxConnectionsPerIP: parseInt(process.env.MAX_CONNECTIONS_PER_IP) || 5,
    
    // Heartbeat configuration
    heartbeat: {
        interval: parseInt(process.env.HEARTBEAT_INTERVAL) || 30000, // 30 seconds
        timeout: parseInt(process.env.HEARTBEAT_TIMEOUT) || 60000   // 60 seconds
    },
    
    // Rate limiting
    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 1000,  // 1 second
        maxMessages: parseInt(process.env.RATE_LIMIT_MAX) || 10     // 10 messages per window
    },
    
    // Message configuration
    messages: {
        maxSize: parseInt(process.env.MAX_MESSAGE_SIZE) || 1024     // 1KB
    },
    
    // Room configuration
    rooms: {
        idleTimeout: parseInt(process.env.ROOM_IDLE_TIMEOUT) || 300000  // 5 minutes
    },
    
    // CORS configuration
    cors: {
        allowedOrigins: process.env.ALLOWED_ORIGINS ? 
            process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:8000', 'http://localhost:8080']
    }
};