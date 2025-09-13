# Maze Escape Multiplayer Server

WebSocket server for the Maze Escape multiplayer game. Handles real-time player synchronization, room management, and game state coordination.

## Features

- **Room-based multiplayer** - Players join specific rooms to play together
- **Real-time synchronization** - Position and action updates broadcast to room members
- **Connection management** - Heartbeat monitoring and automatic cleanup
- **Security features** - Rate limiting, input validation, connection limits
- **Scalable architecture** - Efficient message routing and state management

## Quick Start

### Prerequisites

- Node.js 14.0.0 or higher
- npm (comes with Node.js)

### Installation

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

The server will start on `ws://localhost:8080` by default.

### Development Mode

To run with auto-restart on file changes:
```bash
npm run dev
```

## Configuration

The server can be configured through environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8080 | WebSocket server port |
| `HOST` | localhost | Server host address |
| `MAX_CONNECTIONS` | 1000 | Maximum total connections |
| `MAX_ROOMS` | 100 | Maximum number of rooms |
| `MAX_PLAYERS_PER_ROOM` | 10 | Maximum players per room |
| `MAX_CONNECTIONS_PER_IP` | 5 | Connection limit per IP |
| `HEARTBEAT_INTERVAL` | 30000 | Heartbeat check interval (ms) |
| `HEARTBEAT_TIMEOUT` | 60000 | Connection timeout (ms) |
| `RATE_LIMIT_WINDOW` | 1000 | Rate limit time window (ms) |
| `RATE_LIMIT_MAX` | 10 | Max messages per window |
| `MAX_MESSAGE_SIZE` | 1024 | Maximum message size (bytes) |
| `ROOM_IDLE_TIMEOUT` | 300000 | Empty room cleanup time (ms) |
| `ALLOWED_ORIGINS` | (see below) | Comma-separated allowed origins |

Default allowed origins: `http://localhost:8000,http://localhost:8080`

### Using Environment Variables

Create a `.env` file in the server directory:
```env
PORT=3000
MAX_PLAYERS_PER_ROOM=20
ALLOWED_ORIGINS=http://localhost:8000,https://yourgame.com
```

## Testing Connection

### From the Game

1. Start the game's HTTP server (from main directory):
```bash
python -m http.server
```

2. Open the game in your browser: `http://localhost:8000`

3. Press 'M' to open multiplayer panel

4. Enter server URL: `ws://localhost:8080`

5. Enter a room ID and player name

6. Click "Connect"

### Manual Testing

You can test the server using a WebSocket client:

```javascript
// In browser console or Node.js
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
    console.log('Connected');
    // Join a room
    ws.send(JSON.stringify({
        type: 'join_room',
        roomId: 'test-room',
        playerName: 'TestPlayer'
    }));
};

ws.onmessage = (event) => {
    console.log('Received:', JSON.parse(event.data));
};
```

## Message Protocol

### Client to Server

**Join Room**
```json
{
    "type": "join_room",
    "roomId": "room-123",
    "playerName": "Player1"
}
```

**Update Position**
```json
{
    "type": "player_position",
    "position": { "x": 10, "y": 0, "z": 20 },
    "rotation": { "x": 0, "y": 1.5, "z": 0 }
}
```

**Fire Shot**
```json
{
    "type": "player_shot",
    "position": { "x": 10, "y": 0, "z": 20 },
    "direction": { "x": 0, "y": 0, "z": 1 }
}
```

### Server to Client

**ID Assignment**
```json
{
    "type": "assign_id",
    "playerId": "player_123456",
    "roomId": "room-123"
}
```

**Game State** (sent on join)
```json
{
    "type": "game_state",
    "roomId": "room-123",
    "players": [
        {
            "playerId": "player_123",
            "playerName": "Player1",
            "position": { "x": 0, "y": 0, "z": 0 },
            "rotation": { "x": 0, "y": 0, "z": 0 }
        }
    ]
}
```

**Player Joined**
```json
{
    "type": "player_joined",
    "playerId": "player_456",
    "playerName": "Player2",
    "position": { "x": 0, "y": 0, "z": 0 }
}
```

## Security Features

1. **Connection Limits**
   - Total connection limit
   - Per-IP connection limit
   - Per-room player limit

2. **Rate Limiting**
   - Message frequency limits
   - Automatic temporary bans for violations
   - Exponential backoff penalties

3. **Input Validation**
   - Message size limits (1KB default)
   - Type whitelisting
   - HTML/XSS prevention
   - Data structure validation

4. **Connection Health**
   - Heartbeat/ping-pong mechanism
   - Automatic stale connection cleanup
   - Graceful disconnection handling

## Monitoring

The server logs important events and statistics:

- Player connections/disconnections
- Room creation/deletion
- Rate limit violations
- Server statistics (every minute)

## Troubleshooting

### "Connection failed" error

1. **Check server is running**: Look for "Server is running!" message
2. **Check firewall**: Ensure port 8080 is not blocked
3. **Check URL**: Must be `ws://` not `http://`
4. **Check browser console**: Look for specific error messages

### Players can't see each other

1. **Same room ID**: Ensure players enter exact same room ID
2. **Connection status**: Green dot should show in multiplayer panel
3. **Position updates**: Check browser console for position messages

### Server crashes

1. **Check logs**: Look for error messages before crash
2. **Memory usage**: Monitor with `top` or Task Manager
3. **Port conflicts**: Ensure port 8080 is available

## Production Deployment

For production use:

1. Use `wss://` (WebSocket Secure) with SSL certificates
2. Set appropriate environment variables
3. Use a process manager like PM2
4. Configure reverse proxy (nginx/Apache)
5. Set up monitoring and logging
6. Implement backup and recovery

Example with PM2:
```bash
npm install -g pm2
pm2 start src/server.js --name maze-server
pm2 save
pm2 startup
```

## Development

### Running Tests
```bash
npm test
```

### Project Structure
```
server/
├── src/
│   ├── server.js          # Entry point
│   ├── GameServer.js      # Main server class
│   ├── Room.js            # Room management
│   ├── Player.js          # Player state
│   ├── MessageHandler.js  # Message processing
│   ├── RateLimiter.js     # Rate limiting
│   └── config.js          # Configuration
├── tests/                 # Test files
├── package.json
└── README.md
```

## License

Same as main project