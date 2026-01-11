const Room = require('../../src/Room');

describe('Room model conformance', () => {
    test('capacity logic and getState/broadcast', () => {
        const room = new Room('r', 1);
        const mkWs = () => ({ OPEN: 1, readyState: 1, send: jest.fn() });
        const p1 = { id: 'a', ws: mkWs(), position: {x:0,y:0,z:0}, rotation:{x:0,y:0,z:0} };
        const p2 = { id: 'b', ws: mkWs(), position: {x:0,y:0,z:0}, rotation:{x:0,y:0,z:0} };
        expect(room.addPlayer(p1, 'A').success).toBe(true);
        expect(room.addPlayer(p2, 'B').success).toBe(false);
        const state = room.getState();
        expect(state.roomId).toBe('r');
        expect(state.playerCount).toBe(1);
        const sent = room.broadcast({ type: 'ping' });
        expect(sent).toBe(1);
        const remaining = room.removePlayer('a');
        expect(remaining.length).toBe(0);
    });
});


