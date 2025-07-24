// server/tests/server.test.js
// Basic server functionality tests

const WebSocket = require('ws');
const GameServer = require('../src/GameServer');
const config = require('../src/config');

// Test configuration
const testConfig = {
    ...config,
    port: 8081, // Use different port for tests
    maxConnections: 10,
    maxRooms: 5
};

describe('GameServer', () => {
    let gameServer;
    
    beforeEach(() => {
        gameServer = new GameServer(testConfig);
    });
    
    afterEach(() => {
        if (gameServer) {
            gameServer.stop();
        }
    });
    
    test('server starts on specified port', (done) => {
        gameServer.start(testConfig.port);
        
        // Try to connect
        const ws = new WebSocket(`ws://localhost:${testConfig.port}`);
        
        ws.on('open', () => {
            expect(ws.readyState).toBe(WebSocket.OPEN);
            ws.close();
            done();
        });
        
        ws.on('error', (error) => {
            done(error);
        });
    });
    
    test('server sends welcome message on connection', (done) => {
        gameServer.start(testConfig.port);
        
        const ws = new WebSocket(`ws://localhost:${testConfig.port}`);
        
        ws.on('message', (data) => {
            const message = JSON.parse(data);
            expect(message.type).toBe('connected');
            expect(message.playerId).toBeDefined();
            expect(message.serverVersion).toBe('1.0.0');
            ws.close();
            done();
        });
    });
    
    test('server enforces connection limit', async () => {
        gameServer.start(testConfig.port);
        
        const connections = [];
        
        // Fill up to connection limit
        for (let i = 0; i < testConfig.maxConnections; i++) {
            const ws = new WebSocket(`ws://localhost:${testConfig.port}`);
            connections.push(ws);
            await new Promise(resolve => ws.on('open', resolve));
        }
        
        // Try one more connection
        const extraWs = new WebSocket(`ws://localhost:${testConfig.port}`);
        
        await new Promise((resolve) => {
            extraWs.on('error', (error) => {
                expect(error.message).toContain('Unexpected server response');
                resolve();
            });
            
            extraWs.on('close', () => {
                resolve();
            });
        });
        
        // Clean up
        connections.forEach(ws => ws.close());
    });
    
    test('server removes player on disconnect', (done) => {
        gameServer.start(testConfig.port);
        
        const ws = new WebSocket(`ws://localhost:${testConfig.port}`);
        let playerId;
        
        ws.on('message', (data) => {
            const message = JSON.parse(data);
            if (message.type === 'connected') {
                playerId = message.playerId;
                
                // Check player exists
                expect(gameServer.players.has(playerId)).toBe(true);
                
                // Close connection
                ws.close();
            }
        });
        
        ws.on('close', () => {
            // Give server time to process disconnect
            setTimeout(() => {
                expect(gameServer.players.has(playerId)).toBe(false);
                done();
            }, 100);
        });
    });
});