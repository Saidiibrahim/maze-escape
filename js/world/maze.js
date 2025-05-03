// js/world/maze.js
// Handles the generation of the maze geometry, walls, and exit.
import * as THREE from 'three';
import {
  MAZE_ROWS,
  MAZE_COLS,
  CELL_SIZE,
  WALL_HEIGHT,
  WALL_THICKNESS,
  MAIN_LAYER
} from '../core/constants.js';

/**
 * Generates the maze structure using recursive backtracking.
 * @param {number} rows - Number of rows in the maze.
 * @param {number} cols - Number of columns in the maze.
 * @returns {{verticalWalls: boolean[][], horizontalWalls: boolean[][]}} - Grid indicating wall presence.
 */
function generateMazeStructure(rows, cols) {
  const verticalWalls = Array.from({ length: rows }, () => Array(cols + 1).fill(true));
  const horizontalWalls = Array.from({ length: rows + 1 }, () => Array(cols).fill(true));
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const stack = [];
  let current = { r: 0, c: 0 };
  visited[0][0] = true;
  stack.push(current);

  while (stack.length) {
    const { r, c } = current;
    const neighbors = [];
    // Check potential neighbors (N, S, W, E)
    if (r > 0 && !visited[r - 1][c]) neighbors.push({ r: r - 1, c, dir: 'N' });
    if (r < rows - 1 && !visited[r + 1][c]) neighbors.push({ r: r + 1, c, dir: 'S' });
    if (c > 0 && !visited[r][c - 1]) neighbors.push({ r, c: c - 1, dir: 'W' });
    if (c < cols - 1 && !visited[r][c + 1]) neighbors.push({ r, c: c + 1, dir: 'E' });

    if (neighbors.length) {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      // Remove wall between current and next cell
      if (next.dir === 'N') horizontalWalls[r][c] = false;
      else if (next.dir === 'S') horizontalWalls[r + 1][c] = false;
      else if (next.dir === 'W') verticalWalls[r][c] = false;
      else if (next.dir === 'E') verticalWalls[r][c + 1] = false;

      visited[next.r][next.c] = true;
      stack.push(current);
      current = { r: next.r, c: next.c };
    } else {
      current = stack.pop(); // Backtrack
    }
  }
  return { verticalWalls, horizontalWalls };
}

/**
 * Creates and adds the maze walls, exit, and calculates spawn points.
 * @param {THREE.Scene} scene - The main scene to add objects to.
 * @param {THREE.Mesh[]} wallsArray - An array to store wall meshes for collision detection.
 * @param {THREE.Material} wallTextureMaterial - The material for vertical walls.
 * @param {THREE.Texture} wallTexture - The base texture for walls (used for cloning).
 * @returns {{spawnCells: {x: number, z: number}[], freeCellIndices: number[], exitPosition: THREE.Vector3}} - Calculated maze data.
 */
export function createMaze(scene, wallsArray, wallTextureMaterial, wallTexture) {
  const { verticalWalls, horizontalWalls } = generateMazeStructure(MAZE_ROWS, MAZE_COLS);
  const offsetX = -MAZE_COLS * CELL_SIZE / 2;
  const offsetZ = -MAZE_ROWS * CELL_SIZE / 2;

  // Calculate potential spawn cell centers
  const spawnCells = [];
  for (let r = 0; r < MAZE_ROWS; r++) {
    for (let c = 0; c < MAZE_COLS; c++) {
      spawnCells.push({
        x: offsetX + c * CELL_SIZE + CELL_SIZE / 2,
        z: offsetZ + r * CELL_SIZE + CELL_SIZE / 2
      });
    }
  }
  const freeCellIndices = Array.from({ length: spawnCells.length }, (_, i) => i);

  // --- Create Exit ---
  const exitIndex = (MAZE_ROWS - 1) * MAZE_COLS + (MAZE_COLS - 1); // Bottom-right cell
  const exitCell = spawnCells[exitIndex];
  const exitPosition = new THREE.Vector3(exitCell.x, 10, exitCell.z); // Store position logic
  const exitGeometry = new THREE.CylinderGeometry(10, 10, 5, 16);
  const exitMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const exitMesh = new THREE.Mesh(exitGeometry, exitMaterial);
  exitMesh.position.set(exitCell.x, 2.5, exitCell.z); // Place mesh
  scene.add(exitMesh);
  exitMesh.layers.set(MAIN_LAYER); // Visible on minimap

  // --- Create Vertical Walls ---
  const verticalWallGeometry = new THREE.BoxGeometry(WALL_THICKNESS, WALL_HEIGHT, CELL_SIZE);
  for (let r = 0; r < MAZE_ROWS; r++) {
    for (let c = 0; c <= MAZE_COLS; c++) {
      if (verticalWalls[r][c]) {
        const mesh = new THREE.Mesh(verticalWallGeometry, wallTextureMaterial);
        mesh.position.set(
          offsetX + c * CELL_SIZE,
          WALL_HEIGHT / 2,
          offsetZ + r * CELL_SIZE + CELL_SIZE / 2
        );
        scene.add(mesh);
        wallsArray.push(mesh);
        mesh.layers.set(MAIN_LAYER);
      }
    }
  }

  // --- Create Horizontal Walls ---
  const horizontalWallGeometry = new THREE.BoxGeometry(CELL_SIZE, WALL_HEIGHT, WALL_THICKNESS);
  // Clone and configure texture for horizontal walls specifically
  const horizontalWallTexture = wallTexture.clone();
  horizontalWallTexture.needsUpdate = true; // Important when cloning!
  horizontalWallTexture.repeat.set(CELL_SIZE / 50, WALL_HEIGHT / 50); // Adjust repeat based on dimensions
  const horizontalWallMaterial = new THREE.MeshStandardMaterial({ map: horizontalWallTexture });

  for (let r = 0; r <= MAZE_ROWS; r++) {
    for (let c = 0; c < MAZE_COLS; c++) {
      if (horizontalWalls[r][c]) {
        const mesh = new THREE.Mesh(horizontalWallGeometry, horizontalWallMaterial);
        mesh.position.set(
          offsetX + c * CELL_SIZE + CELL_SIZE / 2,
          WALL_HEIGHT / 2,
          offsetZ + r * CELL_SIZE
        );
        scene.add(mesh);
        wallsArray.push(mesh);
        mesh.layers.set(MAIN_LAYER);
      }
    }
  }

  return { spawnCells, freeCellIndices, exitPosition };
} 