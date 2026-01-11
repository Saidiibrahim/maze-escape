# WebSocket Message Contracts

Protocol Version: 1.0.0

Rate Limits: ≤10 messages/second per player; oversized payloads (>1KB) rejected.

## Client → Server

### join_room
```json
{
  "type": "join_room",
  "roomId": "alpha_123",
  "playerName": "Ibra"
}
```
- roomId: 1–50, /^[a-zA-Z0-9_-]+$/
- playerName: 1–30, sanitized

### leave_room
```json
{ "type": "leave_room" }
```

### player_position
```json
{
  "type": "player_position",
  "position": { "x": 0, "y": 10, "z": 0 },
  "rotation": { "x": 0, "y": 1.5, "z": 0 },
  "timestamp": 1690000000000
}
```

### player_shot
```json
{
  "type": "player_shot",
  "position": { "x": 0, "y": 10, "z": 0 },
  "direction": { "x": 0, "y": 0, "z": -1 },
  "timestamp": 1690000000000
}
```

### ping
```json
{ "type": "ping" }
```

## Server → Client

### connected
```json
{
  "type": "connected",
  "playerId": "player_169...",
  "serverVersion": "1.0.0"
}
```

### assign_id
```json
{ "type": "assign_id", "playerId": "player_...", "roomId": "alpha_123" }
```

### error
```json
{ "type": "error", "message": "Room is full" }
```

### game_state
```json
{
  "type": "game_state",
  "roomId": "alpha_123",
  "players": [
    { "playerId": "player_a", "playerName": "A", "position": {"x":0,"y":10,"z":0}, "rotation": {"x":0,"y":0,"z":0} }
  ],
  "playerCount": 1
}
```

### player_joined
```json
{ "type": "player_joined", "playerId": "player_b", "playerName": "Bee", "position": {"x":0,"y":10,"z":0} }
```

### player_left
```json
{ "type": "player_left", "playerId": "player_b", "playerName": "Bee" }
```

### player_position (broadcast)
```json
{
  "type": "player_position",
  "playerId": "player_a",
  "position": { "x": 1, "y": 10, "z": 2 },
  "rotation": { "x": 0, "y": 1.57, "z": 0 },
  "timestamp": 1690000000100
}
```

### player_shot (broadcast)
```json
{
  "type": "player_shot",
  "playerId": "player_a",
  "position": { "x": 0, "y": 10, "z": 0 },
  "direction": { "x": 0, "y": 0, "z": -1 },
  "timestamp": 1690000000200
}
```

### pong
```json
{ "type": "pong" }
```

## Validation & Safety
- Unknown message types dropped with error.
- Extra unknown fields ignored.
- All numeric fields must be finite numbers; NaN is rejected.
- Anti-cheat: unreasonable position deltas rejected on server.

## Versioning
- Additive fields → MINOR.
- Breaking schema changes → MAJOR with dual-compat window (documented in `MULTIPLAYER.md`).
