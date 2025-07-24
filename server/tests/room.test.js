// server/tests/room.test.js
// Room management and message routing tests

const WebSocket = require('ws');
const GameServer = require('../src/GameServer');
const config = require('../src/config');

const testConfig = {
    ...config,
    port: 8082
};

describe('Room Management', () => {
    let gameServer;
    let ws1, ws2;
    
    beforeEach((done) => {
        gameServer = new GameServer(testConfig);
        gameServer.start(testConfig.port);
        setTimeout(done, 100); // Give server time to start
    });
    
    afterEach(() => {
        if (ws1 && ws1.readyState === WebSocket.OPEN) ws1.close();
        if (ws2 && ws2.readyState === WebSocket.OPEN) ws2.close();
        if (gameServer) gameServer.stop();
    });
    
    test('player can join room', (done) => {
        ws1 = new WebSocket(`ws://localhost:${testConfig.port}`);
        
        const messages = [];
        ws1.on('message', (data) => {
            messages.push(JSON.parse(data));
            
            if (messages.length === 1) {
                // Send join room
                ws1.send(JSON.stringify({
                    type: 'join_room',
                    roomId: 'test-room',
                    playerName: 'Player1'
                }));
            } else if (messages.length === 3) {
                // Check messages received
                expect(messages[1].type).toBe('assign_id');
                expect(messages[1].roomId).toBe('test-room');
                expect(messages[2].type).toBe('game_state');
                done();
            }
        });
    });
    
    test('second player receives join notification', (done) => {
        ws1 = new WebSocket(`ws://localhost:${testConfig.port}`);
        ws2 = new WebSocket(`ws://localhost:${testConfig.port}`);
        
        let player1Ready = false;
        let player2Ready = false;
        
        // Player 1 setup
        ws1.on('message', (data) => {
            const message = JSON.parse(data);
            if (message.type === 'connected' && !player1Ready) {
                player1Ready = true;
                ws1.send(JSON.stringify({
                    type: 'join_room',
                    roomId: 'test-room',
                    playerName: 'Player1'
                }));
            }
        });
        
        // Player 2 setup
        ws2.on('message', (data) => {
            const message = JSON.parse(data);
            
            if (message.type === 'connected' && !player2Ready) {
                player2Ready = true;
                // Wait for player 1 to join first
                setTimeout(() => {
                    ws2.send(JSON.stringify({
                        type: 'join_room',
                        roomId: 'test-room',
                        playerName: 'Player2'
                    }));
                }, 100);
            }
        });
        
        // Player 1 should receive player_joined notification
        ws1.on('message', (data) => {
            const message = JSON.parse(data);
            if (message.type === 'player_joined') {
                expect(message.playerName).toBe('Player2');
                done();
            }
        });
    });
    
    test('messages stay within room', (done) => {
        ws1 = new WebSocket(`ws://localhost:${testConfig.port}`);
        ws2 = new WebSocket(`ws://localhost:${testConfig.port}`);
        
        let player1Id, player2Id;
        
        // Track all messages
        const room1Messages = [];
        const room2Messages = [];
        
        ws1.on('message', (data) => {
            const message = JSON.parse(data);
            room1Messages.push(message);
            
            if (message.type === 'connected') {
                ws1.send(JSON.stringify({
                    type: 'join_room',
                    roomId: 'room-1',
                    playerName: 'Player1'
                }));
            } else if (message.type === 'assign_id') {
                player1Id = message.playerId;
            }
        });
        
        ws2.on('message', (data) => {
            const message = JSON.parse(data);
            room2Messages.push(message);
            
            if (message.type === 'connected') {
                ws2.send(JSON.stringify({
                    type: 'join_room',
                    roomId: 'room-2', // Different room
                    playerName: 'Player2'
                }));
            } else if (message.type === 'assign_id') {
                player2Id = message.playerId;
                
                // Send position update from player 2
                ws2.send(JSON.stringify({
                    type: 'player_position',
                    position: { x: 10, y: 0, z: 20 },
                    rotation: { x: 0, y: 0, z: 0 }
                }));
                
                // Check after delay
                setTimeout(() => {
                    // Player 1 should NOT receive player 2's position
                    const positionMessages = room1Messages.filter(m => 
                        m.type === 'player_position' && m.playerId === player2Id
                    );
                    expect(positionMessages.length).toBe(0);
                    done();
                }, 200);
            }
        });
    });
    
    test('room cleanup when empty', (done) => {
        ws1 = new WebSocket(`ws://localhost:${testConfig.port}`);
        
        ws1.on('message', (data) => {
            const message = JSON.parse(data);
            
            if (message.type === 'connected') {
                ws1.send(JSON.stringify({
                    type: 'join_room',
                    roomId: 'temp-room',
                    playerName: 'Player1'
                }));
            } else if (message.type === 'assign_id') {
                // Check room exists
                expect(gameServer.rooms.has('temp-room')).toBe(true);
                
                // Leave room
                ws1.close();
                
                // Check room is cleaned up
                setTimeout(() => {
                    expect(gameServer.rooms.has('temp-room')).toBe(false);
                    done();
                }, 100);
            }
        });
    });
});