# Three.js First Person Shooter

This is a simple 3D first-person shooter game built with [Three.js](https://threejs.org/) using PointerLockControls.

## How to Run

1. Download or clone the project.
2. Start a local HTTP server in the project directory. For example:
   ```bash
   npx http-server
   ```
   or
   ```bash
   python -m http.server 8000
   ```
3. Open your browser and navigate to `http://localhost:8080` (or the port you're using).
4. Click on the screen to lock the pointer and start playing.
   - Move with WASD or arrow keys.
   - Shoot by clicking.

## Features

- Pointer lock controls for FPS movement.
- Shooting bullets.
- Simple target boxes to shoot at.
- Basic collision detection.