# Multiplayer Features

This document describes the multiplayer features added to the maze escape game.

## Overview

The multiplayer system allows multiple players to play together in the same maze. Players can see each other's movements and interact in real-time through WebSocket connections.

## Architecture

### Core Components

1. **WebSocket Connection** (`js/multiplayer/websocket.js`)
   - Handles WebSocket communication with the server
   - Manages connection state and message routing
   - Provides functions for sending player updates

2. **Multiplayer Manager** (`js/multiplayer/manager.js`)
   - Orchestrates multiplayer functionality
   - Manages remote players and game state synchronization
   - Integrates with the main game loop

3. **Remote Player System** (`js/multiplayer/remotePlayer.js`)
   - Creates and manages remote player entities
   - Handles visual representation of other players
   - Manages name tags and player markers

4. **Multiplayer UI** (`js/ui/multiplayerUI.js`)
   - Provides connection interface
   - Shows connection status and player count
   - Allows server configuration

## How to Use

### In-Game Controls

- **Press 'M'** to toggle the multiplayer panel
- The panel appears in the top-right corner when visible

### Connecting to a Server

1. Press 'M' to open the multiplayer panel
2. Enter the WebSocket server URL (e.g., `ws://localhost:8080`)
3. Enter a Room ID to join a specific game room
4. Enter your Player Name
5. Click "Connect" to join the multiplayer session

### Visual Indicators

- **Green dot**: Connected to server
- **Red dot**: Disconnected from server
- **Player count**: Shows number of connected players
- **Remote players**: Appear as green capsules with name tags

## Server Requirements

The multiplayer system requires a WebSocket server that handles:

- Player connections and disconnections
- Room-based game sessions
- Position synchronization messages
- Shot event broadcasting

### Expected Message Format

```javascript
// Client to Server
{
  type: "player_position",
  playerId: "player123",
  position: { x: 10, y: 10, z: 20 },
  rotation: { x: 0, y: 1.5, z: 0 },
  timestamp: 1234567890
}

// Server to Client
{
  type: "player_joined",
  playerId: "player456",
  playerName: "Player Name",
  position: { x: 0, y: 10, z: 0 }
}
```

## Integration with Game Systems

The multiplayer system integrates with:

- **Player movement**: Position updates are sent automatically
- **Shooting system**: Shot events are synchronized
- **Minimap**: Remote players appear as markers
- **Game loop**: Multiplayer updates happen each frame

## Features

### Current Features
- Real-time position synchronization
- Player join/leave notifications
- Visual representation of remote players
- Name tags for player identification
- Connection status indicators
- Room-based multiplayer

### Future Enhancements
- Synchronized shooting effects
- Shared target system
- Chat functionality
- Spectator mode
- Server browser

## Testing

Use `test-multiplayer.html` to verify that all multiplayer modules load correctly and the UI initializes properly.

## Code Structure

```
js/multiplayer/
├── websocket.js      # WebSocket connection management
├── manager.js        # Multiplayer coordination
└── remotePlayer.js   # Remote player entities

js/ui/
└── multiplayerUI.js  # User interface components
```

The multiplayer system follows the existing codebase patterns:
- Modular architecture with private state
- Callback-based communication
- Integration with Three.js systems
- Consistent with existing UI patterns