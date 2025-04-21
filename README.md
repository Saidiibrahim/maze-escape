# Maze Escape - Three.js FPS

This is a first-person shooter game built with [Three.js](https://threejs.org/). Navigate a randomly generated maze, shoot targets and enemies, and find the exit!

## How to Run

1. Download or clone the project.
2. Ensure you have a local HTTP server that can serve the files. If you have Node.js, you can use:
   ```bash
   npx http-server
   ```
   Alternatively, with Python 3:
   ```bash
   python -m http.server
   ```
3. Open your browser and navigate to the local address provided by your server (e.g., `http://localhost:8080` or `http://127.0.0.1:8000`).
4. Click the start screen to lock the pointer and begin.

## Gameplay

- **Movement:** Use **WASD** keys to move.
- **Look:** Use the **Mouse** to look around.
- **Shoot:** **Click** the left mouse button to shoot.
- **Objective:** Shoot targets (boxes) to increase your score. Avoid or shoot the red enemy spheres that chase you. Find the green exit cylinder to win.
- **Health:** You start with 100 health. Enemies damage you on contact. If health reaches 0, you die.
- **Minimap:** A top-down view of the maze is shown in the bottom-right corner, including your position/direction (yellow cone) and enemies (red dots).

## Features

- **Random Maze Generation:** A new maze layout is created each time you play.
- **Pointer Lock Controls:** Standard first-person shooter controls.
- **Physics & Collision:** Basic collision detection with maze walls for the player and enemies.
- **Shooting Mechanics:** Raycasting for bullet hits against targets and enemies.
- **Enemy AI:** Simple chasing behavior when the player is nearby.
- **Health & Scoring System:** Track player health and score based on hits.
- **GLTF Model:** Uses a GLTF model for the player's weapon.
- **Texturing & Skybox:** Textured ground, walls, and a skybox for immersion.
- **Minimap:** Real-time top-down view of the maze.
- **Sound Effects:** Includes sounds for shooting, footsteps, enemy movement, damage, and background music.
- **Win/Loss Conditions:** Reach the exit to win, lose all health to die.