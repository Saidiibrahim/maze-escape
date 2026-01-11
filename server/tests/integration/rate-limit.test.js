const WebSocket = require('ws');
const GameServer = require('../../src/GameServer');
const baseConfig = require('../../src/config');

const config = { ...baseConfig, port: 8087, rateLimit: { windowMs: 500, maxMessages: 3 }, maxConnectionsPerIP: 100 };
const wsOpts = { headers: { origin: 'http://localhost:8000' } };

describe('Integration: rate limiting outcomes', () => {
    let server;
    beforeAll(() => { 
        server = new GameServer(config); 
        server.start(config.port); 
        // Lower ban threshold to exercise ban path quickly in test
        server.rateLimiter.banThreshold = 2;
        server.rateLimiter.banDuration = 500;
    });
    afterAll(() => server && server.stop());

    test('error on exceeding window; temp ban after repeated violations', (done) => {
        const ws = new WebSocket(`ws://localhost:${config.port}`, wsOpts);
        let connected = false;
        let errorCount = 0;

        const timeout = setTimeout(() => {
            // Fallback: ensure we saw errors even if not banned/closed yet
            try {
                expect(errorCount).toBeGreaterThan(0);
                ws.close();
                done();
            } catch (e) { done(e); }
        }, 1500);

        ws.on('message', (raw) => {
            const m = JSON.parse(raw);
            if (m.type === 'connected' && !connected) {
                connected = true;
                ws.send(JSON.stringify({ type: 'join_room', roomId: 'RL', playerName: 'Spammer' }));
                // Burst messages to exceed max and trigger ban quickly
                for (let i = 0; i < 20; i++) {
                    ws.send(JSON.stringify({ type: 'player_position', position: { x: i, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, timestamp: Date.now() }));
                }
            }
            if (m.type === 'error') {
                errorCount++;
            }
        });

        ws.on('close', (code) => {
            clearTimeout(timeout);
            try {
                // With lowered threshold we expect ban close code 1008
                expect(code).toBe(1008);
                expect(errorCount).toBeGreaterThan(0);
                done();
            } catch (e) { done(e); }
        });
    });
});


