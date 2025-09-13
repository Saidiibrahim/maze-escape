// server/src/server.js
// Entry point for the WebSocket server

const GameServer = require('./GameServer');
const config = require('./config');
const fs = require('fs');
const path = require('path');

// Load environment variables if .env file exists
try {
    require('dotenv').config();
} catch (e) {
    // dotenv not installed or .env file doesn't exist
}

// Create server instance
const gameServer = new GameServer(config);

/**
 * Starts the server with error handling
 */
function startServer() {
    try {
        const port = config.port;
        const host = config.host;
        
        console.log('=================================');
        console.log('Maze Escape Multiplayer Server');
        console.log('=================================');
        console.log(`Starting server on ${host}:${port}...`);
        console.log(`Max connections: ${config.maxConnections}`);
        console.log(`Max rooms: ${config.maxRooms}`);
        console.log(`Max players per room: ${config.maxPlayersPerRoom}`);
        console.log('=================================');
        
        gameServer.start(port);
        
        console.log(`Server is running!`);
        console.log(`Players can connect to: ws://${host}:${port}`);
        console.log('Press Ctrl+C to stop the server');
        console.log('=================================');
        
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

/**
 * Handles graceful shutdown
 */
function handleShutdown(signal) {
    console.log(`\nReceived ${signal}, shutting down gracefully...`);
    
    // Get final stats
    const stats = gameServer.getStats();
    console.log('Final server statistics:', stats);
    
    // Stop the server
    gameServer.stop();
    
    // Exit after a delay to ensure cleanup
    setTimeout(() => {
        console.log('Shutdown complete');
        process.exit(0);
    }, 1000);
}

/**
 * Sets up process event handlers
 */
function setupProcessHandlers() {
    // Handle shutdown signals
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        console.error('Uncaught exception:', error);
        handleShutdown('uncaughtException');
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        console.error('Unhandled rejection at:', promise, 'reason:', reason);
    });
}

// Main execution
setupProcessHandlers();
startServer();