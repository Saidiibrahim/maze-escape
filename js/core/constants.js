// js/core/constants.js
// Centralized configuration values for the Maze Escape game.

/** @description Bullet travel speed in units per second. */
export const BULLET_SPEED = 200;

/** @description Bullet lifespan in seconds before disappearing. */
export const BULLET_LIFE = 1;

/** @description Number of rows in the maze grid. */
export const MAZE_ROWS = 10;

/** @description Number of columns in the maze grid. */
export const MAZE_COLS = 10;

/** @description Size of each cell in the maze grid (units). */
export const CELL_SIZE = 100;

/** @description Maximum number of active targets allowed in the maze. */
export const MAX_TARGETS = 5;

/** @description Interval (in milliseconds) between automatic target spawns. */
export const SPAWN_INTERVAL = 2000; // ms

/** @description Maximum number of active enemies allowed in the maze. */
export const MAX_ENEMIES = 3;

/** @description Height of the maze walls. */
export const WALL_HEIGHT = 50;

/** @description Thickness of the maze walls. */
export const WALL_THICKNESS = 5;

/** @description Radius around the exit point for winning condition check. */
export const EXIT_RADIUS = CELL_SIZE * 0.5 - 10; // Derived from CELL_SIZE

// Layer definitions for selective rendering
/** @description Main render layer, visible to main camera and minimap. */
export const MAIN_LAYER = 0;
/** @description Minimap-specific layer (e.g., grid). */
export const MINIMAP_LAYER = 1;
/** @description Layer for the player marker on the minimap. */
export const PLAYER_MARKER_LAYER = 2;
/** @description Layer for the ground plane, visible to main camera but not minimap. */
export const GROUND_LAYER = 3;

// Minimap specific constants
/** @description Size (width and height) of the minimap display in pixels. */
export const MINIMAP_SIZE = 200;
/** @description Orthographic camera scope for the minimap, determining the visible area. */
export const MINIMAP_SCOPE = MAZE_COLS * CELL_SIZE * 0.6; // Derived from maze size

// Player specific constants
/** @description Starting health value for the player. */
export const PLAYER_START_HEALTH = 100;
/** @description Radius used for player collision detection. */
export const PLAYER_RADIUS = 5;
/** @description Player movement speed (units per second). */
export const PLAYER_MOVE_SPEED = 200;

// Enemy specific constants
/** @description Radius used for enemy collision detection. */
export const ENEMY_RADIUS = 8;
/** @description Distance at which enemies start chasing the player. */
export const ENEMY_CHASE_RADIUS = 500;
/** @description Base speed for enemy movement (units per second). */
export const ENEMY_BASE_SPEED = 40;
/** @description Damage dealt by enemy collision. */
export const ENEMY_COLLISION_DAMAGE = 10;
/** @description Interval (in milliseconds) between automatic enemy spawns. */
export const ENEMY_SPAWN_INTERVAL = 3000; // ms

// Target specific constants
/** @description Size of the target boxes (width, height, depth). */
export const TARGET_SIZE = 20;
/** @description Margin from cell walls when spawning targets. */
export const TARGET_SPAWN_MARGIN = 20;
/** @description Radius for target collision detection (approximate). */
export const TARGET_COLLISION_RADIUS = 10; 