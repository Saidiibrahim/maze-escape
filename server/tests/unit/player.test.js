const Player = require('../../src/Player');

describe('Player model conformance', () => {
    test('public shape fields exist', () => {
        const p = new Player({ readyState: 1, send(){} }, 'player_1', '127.0.0.1');
        const data = p.getPublicData();
        expect(Object.keys(data).sort()).toEqual(['playerId','playerName','position','rotation'].sort());
    });
});


