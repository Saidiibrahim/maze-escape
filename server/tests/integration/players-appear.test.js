const WebSocket = require('ws');
const GameServer = require('../../src/GameServer');
const baseConfig = require('../../src/config');

const config = { ...baseConfig, port: 8084, maxConnectionsPerIP: 100 };
const wsOpts = { headers: { origin: 'http://localhost:8000' } };

describe('Integration: two players see each other', () => {
    let server;

    beforeAll(() => {
        server = new GameServer(config);
        server.start(config.port);
    });

    afterAll(() => server && server.stop());

    test('player_joined seen by existing player', (done) => {
        const ws1 = new WebSocket(`ws://localhost:${config.port}`, wsOpts);
        const ws2 = new WebSocket(`ws://localhost:${config.port}`, wsOpts);

        let r1 = false, r2 = false, saw = false;
        const tryJoin = () => { if (r1 && r2) { ws1.send(JSON.stringify({ type: 'join_room', roomId: 'A', playerName: 'P1' })); setTimeout(() => ws2.send(JSON.stringify({ type: 'join_room', roomId: 'A', playerName: 'P2' })), 100); } };

        ws1.on('message', (raw) => {
            const m = JSON.parse(raw);
            if (m.type === 'connected' && !r1) { r1 = true; tryJoin(); }
            if (m.type === 'player_joined' && !saw) { saw = true; ws1.close(); ws2.close(); done(); }
        });

        ws2.on('message', (raw) => {
            const m = JSON.parse(raw);
            if (m.type === 'connected' && !r2) { r2 = true; tryJoin(); }
        });
    });
});


