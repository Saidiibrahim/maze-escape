# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Setup

This is a client-side Three.js game that requires a local HTTP server to run due to CORS restrictions with module imports.

### Running the Game
```bash
# Using Node.js (if available)
npx http-server

# Using Python 3
python -m http.server
```

Access via browser at `http://localhost:8080` (or port shown by server).

### File Structure
- **Entry Points**: `index.html` (landing page), `game.html` (game)
- **Main Script**: `js/main.js` - initializes game on DOM ready
- **Core Game Logic**: `js/core/game.js` - main game loop and coordination

## Architecture Overview

### Modular Design Pattern
The codebase uses a clean modular architecture with private state encapsulation:

**Core Systems** (`js/core/`):
- `game.js` - Main game orchestrator, handles initialization, game loop, and state management
- `constants.js` - Centralized configuration (speeds, dimensions, layer constants)

**Entity Management** (`js/entities/`):
- Uses manager pattern for spawning, updating, and cleanup
- `player.js` - Movement, health, collision detection with camera-relative controls
- `enemy.js` - Simple AI with chasing behavior when player is nearby
- `bullet.js` - Projectile system with raycasting hit detection
- `target.js` - Spawns destructible targets throughout maze

**World Generation** (`js/world/`):
- `maze.js` - Procedural maze generation using recursive backtracking algorithm
- `environment.js` - Scene setup, lighting, skybox, and texture loading

**Utilities** (`js/utils/`):
- `audio.js` - Centralized audio management with enum-based sound keys
- `collision.js` - Wall collision detection utilities
- `input.js` - PointerLock controls and input handling

**UI Systems** (`js/ui/`):
- `hud.js` - Score and health display management
- `minimap.js` - Real-time top-down maze view with layer-based rendering

### Communication Pattern
Systems communicate via callback functions passed during initialization, enabling loose coupling:
```javascript
initPlayer(camera, scene, healthElement, instructionsElement, {
    collisionWalls: walls,
    onDeath: handlePlayerDeath
});
```

### Three.js Integration
- Uses Three.js layers for selective rendering (main scene vs minimap)
- PointerLock controls for FPS movement
- Raycasting for bullet collision detection
- GLTF model loading for weapon
- Texture loading for walls/ground/skybox

### Game Loop Architecture
The main animate loop in `game.js` follows this pattern:
1. Input processing (movement state)
2. Entity updates (player, enemies, bullets)
3. Collision detection
4. Game state evaluation (win/lose conditions)
5. Rendering (main scene + minimap)

### Audio System
Centralized audio management using enum keys (`SOUND_KEYS`) for:
- Background music (looped)
- Player footsteps (movement-based)
- Shooting sounds
- Enemy movement sounds
- Damage/death audio

## Development Notes

### Adding New Features
- **New Entities**: Follow the manager pattern in existing entity files
- **Audio**: Add new sound keys to `SOUND_KEYS` enum in `audio.js`
- **UI Elements**: Extend HUD system in `js/ui/hud.js`
- **Maze Modifications**: Maze generation logic is in `maze.js` with configurable constants

### Key Dependencies
- Three.js v0.152.2 (loaded via CDN with import maps)
- PointerLockControls for FPS camera movement
- GLTFLoader for 3D model assets

### Common Patterns
- Private variables prefixed with `_` in modules
- Callback-based inter-system communication
- Layer system for rendering optimization
- Manager pattern for entity lifecycle management