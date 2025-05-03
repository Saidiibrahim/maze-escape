// js/world/environment.js
// Sets up the scene's lighting, floor, skybox, and minimap grid.
import * as THREE from 'three';
import { GROUND_LAYER, MINIMAP_LAYER } from '../core/constants.js';

/**
 * Creates and adds lighting, floor, skybox, and grid to the scene.
 * @param {THREE.Scene} scene - The main scene object.
 * @param {THREE.TextureLoader} textureLoader - The texture loader instance.
 * @returns {{ wallTexture: THREE.Texture, wallMaterial: THREE.MeshStandardMaterial }} - Textures/materials needed by other modules (like maze).
 */
export function setupEnvironment(scene, textureLoader) {
  // --- Lighting ---
  const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
  light.position.set(0.5, 1, 0.75);
  scene.add(light);

  // --- Floor Plane ---
  const floorGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
  // Load ground texture
  const groundTexture = textureLoader.load('textures/sand_stone_texture.png');
  groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set(40, 40);
  const floorMaterial = new THREE.MeshStandardMaterial({ map: groundTexture });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  floor.layers.set(GROUND_LAYER); // Only visible in main camera, not minimap

  // --- Sky Background ---
  textureLoader.load('textures/sky_texture.png', (skyTex) => {
    skyTex.mapping = THREE.EquirectangularReflectionMapping;
    // skyTex.encoding = THREE.sRGBEncoding; // Correct color space
    skyTex.colorSpace = THREE.SRGBColorSpace; // <-- Updated API
    scene.background = skyTex;
    // scene.environment = skyTex; // Optionally set for PBR reflections
  });

  // --- Grid Helper (for minimap) ---
  const grid = new THREE.GridHelper(2000, 100, 0x000000, 0x000000);
  grid.material.opacity = 0.2;
  grid.material.transparent = true;
  scene.add(grid);
  grid.layers.set(MINIMAP_LAYER); // Only visible on the minimap layer

  // --- Load Wall Texture (needed for maze generation) ---
  const wallTexture = textureLoader.load('textures/wall_bricks.png');
  wallTexture.wrapS = THREE.RepeatWrapping;
  wallTexture.wrapT = THREE.RepeatWrapping;
  // Base repeat values (can be adjusted per wall type in maze.js)
  // wallTexture.repeat.set(CELL_SIZE / 50, WALL_HEIGHT / 50);
  const wallMaterial = new THREE.MeshStandardMaterial({
    map: wallTexture,
    color: 0xffffff
  });

  // Return textures/materials that maze.js needs
  return { wallTexture, wallMaterial };
} 