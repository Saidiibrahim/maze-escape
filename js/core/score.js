// js/core/score.js
// Simple per-player score manager

const scores = new Map();

export function increment(playerId) {
    const current = scores.get(playerId) || 0;
    const next = current + 1;
    scores.set(playerId, next);
    return next;
}

export function getScore(playerId) {
    return scores.get(playerId) || 0;
}

export function reset() {
    scores.clear();
}


