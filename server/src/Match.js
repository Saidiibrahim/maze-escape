// server/src/Match.js
// Minimal Match model stub per data-model.md

class Match {
    constructor(roomId) {
        this.roomId = roomId;
        this.status = 'lobby'; // 'lobby' | 'in_progress' | 'ended'
        this.startTime = undefined;
        this.endTime = undefined;
        this.results = undefined; // Array<{ playerId, score }>
    }
}

module.exports = Match;


