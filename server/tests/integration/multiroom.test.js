const WebSocket = require('ws');
const GameServer = require('../../src/GameServer');
const baseConfig = require('../../src/config');

const config = { ...baseConfig, port: 8085, maxConnectionsPerIP: 100 };
const wsOpts = { headers: { origin: 'http://localhost:8000' } };

describe('Integration: multi-room isolation', () => {
    let server;
    beforeAll(() => { server = new GameServer(config); server.start(config.port); });
    afterAll(() => server && server.stop());

    test('broadcasts do not cross rooms', (done) => {
        const a1 = new WebSocket(`ws://localhost:${config.port}`, wsOpts);
        const b1 = new WebSocket(`ws://localhost:${config.port}`, wsOpts);

        let aReady = false, bReady = false, aAssigned = false;
        const aMsgs = [];

        const tryJoin = () => {
            if (aReady && bReady) {
                a1.send(JSON.stringify({ type: 'join_room', roomId: 'R1', playerName: 'A1' }));
                b1.send(JSON.stringify({ type: 'join_room', roomId: 'R2', playerName: 'B1' }));
            }
        };

        a1.on('message', (raw) => {
            const m = JSON.parse(raw); aMsgs.push(m);
            if (m.type === 'connected' && !aReady) { aReady = true; tryJoin(); }
            if (m.type === 'assign_id' && !aAssigned) { aAssigned = true; setTimeout(() => {
                // send shot in room R2, ensure A (R1) does not see it
                b1.send(JSON.stringify({ type: 'player_shot', position: { x: 0, y: 0, z: 0 }, direction: { x: 0, y: 0, z: -1 }, timestamp: Date.now() }));
                setTimeout(() => {
                    expect(aMsgs.find(m2 => m2.type === 'player_shot')).toBeUndefined();
                    a1.close(); b1.close(); done();
                }, 200);
            }, 100); }
        });

        b1.on('message', (raw) => {
            const m = JSON.parse(raw);
            if (m.type === 'connected' && !bReady) { bReady = true; tryJoin(); }
        });
    });
});


