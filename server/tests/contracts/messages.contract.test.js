// Contract tests for WebSocket messages based on specs/001-we-re-building/contracts/messages.md
const WebSocket = require('ws');
const GameServer = require('../../src/GameServer');
const baseConfig = require('../../src/config');

const config = { ...baseConfig, port: 8083, maxConnectionsPerIP: 100 };
const wsOpts = { headers: { origin: 'http://localhost:8000' } };

describe('Contracts: messages', () => {
    let server;

    beforeAll(() => {
        server = new GameServer(config);
        server.start(config.port);
    });

    afterAll(() => {
        if (server) server.stop();
    });

    test('join_room schema accepted; invalid rejected', (done) => {
        const ws = new WebSocket(`ws://localhost:${config.port}`, wsOpts);
        let gotConnected = false;

        ws.on('message', (raw) => {
            const msg = JSON.parse(raw);
            if (msg.type === 'connected' && !gotConnected) {
                gotConnected = true;
                ws.send(JSON.stringify({ type: 'join_room', roomId: 'alpha_123', playerName: 'Ibra' }));
                ws.send(JSON.stringify({ type: 'join_room', roomId: '***', playerName: '' }));
            } else if (msg.type === 'assign_id') {
                expect(msg.playerId).toBeDefined();
                expect(msg.roomId).toBe('alpha_123');
            } else if (msg.type === 'error') {
                expect(msg.message).toBeDefined();
                ws.close();
                done();
            }
        });
    });

    test('player_position validated and broadcast with timestamp', (done) => {
        const ws1 = new WebSocket(`ws://localhost:${config.port}`, wsOpts);
        const ws2 = new WebSocket(`ws://localhost:${config.port}`, wsOpts);
        let ws1Ready = false; let ws2Ready = false; let ws2Saw = false;

        function tryJoin() {
            if (ws1Ready && ws2Ready) {
                ws1.send(JSON.stringify({ type: 'join_room', roomId: 'roomP', playerName: 'P1' }));
                ws2.send(JSON.stringify({ type: 'join_room', roomId: 'roomP', playerName: 'P2' }));
            }
        }

        ws1.on('message', (raw) => {
            const m = JSON.parse(raw);
            if (m.type === 'connected' && !ws1Ready) { ws1Ready = true; tryJoin(); }
            if (m.type === 'game_state') {
                // send valid position then invalid
                ws1.send(JSON.stringify({ type: 'player_position', position: { x: 0, y: 10, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, timestamp: Date.now() }));
                ws1.send(JSON.stringify({ type: 'player_position', position: { x: 'NaN', y: 10, z: 0 }, rotation: { x: 0, y: 0, z: 0 } }));
            }
        });

        ws2.on('message', (raw) => {
            const m = JSON.parse(raw);
            if (m.type === 'connected' && !ws2Ready) { ws2Ready = true; tryJoin(); }
            if (m.type === 'player_position' && !ws2Saw) {
                expect(m.timestamp).toBeDefined();
                ws2Saw = true;
                ws1.close(); ws2.close();
                done();
            }
        });
    });

    test('player_shot validated and broadcast with timestamp; ping/pong', (done) => {
        const ws1 = new WebSocket(`ws://localhost:${config.port}`, wsOpts);
        const ws2 = new WebSocket(`ws://localhost:${config.port}`, wsOpts);
        let ws1Ready = false; let ws2Ready = false; let sawShot = false; let sawPong = false;

        const finish = () => { if (sawShot && sawPong) { ws1.close(); ws2.close(); done(); } };

        function tryJoin() {
            if (ws1Ready && ws2Ready) {
                ws1.send(JSON.stringify({ type: 'join_room', roomId: 'roomS', playerName: 'P1' }));
                ws2.send(JSON.stringify({ type: 'join_room', roomId: 'roomS', playerName: 'P2' }));
            }
        }

        ws1.on('message', (raw) => {
            const m = JSON.parse(raw);
            if (m.type === 'connected' && !ws1Ready) { ws1Ready = true; tryJoin(); }
            if (m.type === 'game_state') {
                ws1.send(JSON.stringify({ type: 'player_shot', position: { x: 0, y: 10, z: 0 }, direction: { x: 0, y: 0, z: -1 }, timestamp: Date.now() }));
                ws1.send(JSON.stringify({ type: 'player_shot', position: { x: 'NaN', y: 10, z: 0 }, direction: { x: 0, y: 0, z: -1 } }));
                ws1.send(JSON.stringify({ type: 'ping' }));
            }
            if (m.type === 'pong') { sawPong = true; finish(); }
        });

        ws2.on('message', (raw) => {
            const m = JSON.parse(raw);
            if (m.type === 'connected' && !ws2Ready) { ws2Ready = true; tryJoin(); }
            if (m.type === 'player_shot' && !sawShot) { sawShot = true; finish(); }
        });
    });
});


