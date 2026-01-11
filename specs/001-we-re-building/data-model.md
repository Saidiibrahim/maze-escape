# Data Model: Maze Escape (Phase 1)

## Entities

### Player
- id: string (server-assigned `player_...`)
- name: string (1–30)
- roomId: string
- position: { x:number, y:number, z:number }
- rotation: { x:number, y:number, z:number }
- isAlive: boolean (heartbeat state)
- lastHeartbeat: number (ms epoch)
- joinedAt: number (ms epoch)
- violations: number (rate limit)

Public shape (shared to clients):
- playerId, playerName, position, rotation

### Room
- id: string
- maxPlayers: number (default 10)
- players: Map<playerId, Player>
- createdAt: number
- lastActivity: number
- state.players: Map<playerId, { playerId, playerName, position, rotation }>

Transitions:
- lobby → in_progress → ended (MVP: implicit start/stop; explicit states later)

### Match
- roomId: string
- status: "lobby" | "in_progress" | "ended"
- startTime?: number
- endTime?: number
- results?: Array<{ playerId, score }>

### Maze
- rows: number (10)
- cols: number (10)
- cellSize: number (100)
- wallHeight: number (50)
- wallThickness: number (5)
- seed: string (derived from roomId)
- exitPosition: THREE.Vector3-like { x, y, z }

### Score/Progress
- perPlayer: Map<playerId, number> (MVP: +1 per target)
- winCondition: reach exit within `EXIT_RADIUS`
- loseCondition: health ≤ 0

## Validation Rules
- playerName: trimmed, no HTML/special chars, 1–30 chars
- roomId: 1–50 chars, /^[a-zA-Z0-9_-]+$/
- message sizes ≤ 1KB

## Relationships
- Room has many Players
- Match belongs to Room
- Maze derived per Room (deterministic by `roomId`)

## Notes
- Server is authoritative for room membership and broadcast; clients are untrusted and send intents.
