const WebSocket = require('ws');
const GameServer = require('../../src/GameServer');
const baseConfig = require('../../src/config');

const config = { ...baseConfig, port: 8086, maxPlayersPerRoom: 2, maxConnectionsPerIP: 100 };
const wsOpts = { headers: { origin: 'http://localhost:8000' } };

describe('Integration: room full path', () => {
    let server;
    beforeAll(() => { server = new GameServer(config); server.start(config.port); });
    afterAll(() => server && server.stop());

    test('N+1 join rejected when maxPlayersPerRoom reached', async () => {
        const ws1 = new WebSocket(`ws://localhost:${config.port}`, wsOpts);
        const ws2 = new WebSocket(`ws://localhost:${config.port}`, wsOpts);
        const ws3 = new WebSocket(`ws://localhost:${config.port}`, wsOpts);

        await new Promise(res => ws1.on('message', (d) => { const m = JSON.parse(d); if (m.type === 'connected') { ws1.send(JSON.stringify({ type: 'join_room', roomId: 'F', playerName: 'P1' })); res(); } }));
        await new Promise(res => ws2.on('message', (d) => { const m = JSON.parse(d); if (m.type === 'connected') { ws2.send(JSON.stringify({ type: 'join_room', roomId: 'F', playerName: 'P2' })); res(); } }));

        const gotError = await new Promise((resolve) => {
            let connected = false;
            ws3.on('message', (d) => {
                const m = JSON.parse(d);
                if (m.type === 'connected' && !connected) { connected = true; ws3.send(JSON.stringify({ type: 'join_room', roomId: 'F', playerName: 'P3' })); }
                if (m.type === 'error') { resolve(true); }
            });
            setTimeout(() => resolve(false), 1000);
        });

        ws1.close(); ws2.close(); ws3.close();
        expect(gotError).toBe(true);
    });
});


