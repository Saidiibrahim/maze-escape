const WebSocket = require('ws');
const GameServer = require('../../src/GameServer');
const baseConfig = require('../../src/config');

const config = { ...baseConfig, port: 8088, messages: { maxSize: 256 }, maxConnectionsPerIP: 100 };
const wsOpts = { headers: { origin: 'http://localhost:8000' } };

describe('Integration: oversize payload rejected (>maxSize)', () => {
    let server;
    beforeAll(() => { server = new GameServer(config); server.start(config.port); });
    afterAll(() => server && server.stop());

    test('server closes with code 1009 for oversize', (done) => {
        const ws = new WebSocket(`ws://localhost:${config.port}`, wsOpts);
        let connected = false;

        ws.on('message', (raw) => {
            const m = JSON.parse(raw);
            if (m.type === 'connected' && !connected) {
                connected = true;
                // Craft large message beyond 256 bytes
                const big = { type: 'player_position', position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } };
                big.padding = 'x'.repeat(300);
                ws.send(JSON.stringify(big));
            }
        });

        ws.on('close', (code) => {
            expect(code).toBe(1009);
            done();
        });
    });
});


