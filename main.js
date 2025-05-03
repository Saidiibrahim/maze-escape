// // Import Three.js core and PointerLockControls for FPS navigation
// // Import Three.js core, PointerLockControls, and GLTFLoader
// import * as THREE from 'three';
// import { PointerLockControls } from 'three/controls/PointerLockControls.js';
// // import { GLTFLoader } from 'three/loaders/GLTFLoader.js';
// 
// // Global variables and game object containers
// let camera, scene, renderer, controls;
// let miniCam, miniRenderer; // <-- Declare minimap cam/renderer globally
// const objects = [];        // Array of target objects in the scene
// const bullets = [];        // Active bullets in the scene
// const walls = [];          // Array of wall meshes for collision
// const bulletSpeed = 200;   // Bullet travel speed units/second
// const bulletLife = 1;      // Bullet lifespan in seconds
// 
// // Maze and spawning parameters
// const mazeRows = 10, mazeCols = 10, cellSize = 100;
// let spawnCells = [];       // Centers of maze cells for target respawning
// let freeCellIndices = [];  // Indices of unoccupied maze cells
// const maxTargets = 5;      // Maximum active targets in the maze
// const spawnInterval = 2000; // ms between automatic spawns
// 
// // Exit and game state
// let gameWon = false;
// let exitPosition = new THREE.Vector3();
// const exitRadius = cellSize * 0.5 - 10;
// 
// // UI Elements
// let scoreElement;
// let instructionsElement;
// let health = 100; // Declare globally
// let healthEl;     // Declare globally
// let sfxShoot;
// let sfxFootsteps;
// let sfxHeavyFootsteps;
// let sfxEnemyMove;
// let bgm;
// let isMoving = false; // Track player movement state
// 
// // Gameplay state
// let score = 0;             // Player's score (targets hit)
// 
// // Movement flags for WASD controls
// let moveForward = false;
// let moveBackward = false;
// let moveLeft = false;
// let moveRight = false;
// 
// // Physics and timing
// const velocity = new THREE.Vector3();   // Current velocity vector
// const direction = new THREE.Vector3();  // Movement direction vector
// const clock = new THREE.Clock();        // Clock for delta timing
// 
// // Layer definitions
// const MAIN_LAYER          = 0;
// const MINIMAP_LAYER       = 1;
// const PLAYER_MARKER_LAYER = 2;      // player cone
// const GROUND_LAYER        = 3;      // NEW – ground only, minimap ignores
// 
// let playerMarker; // Global variable for the player marker
// 
// // +++ Texture Loader +++
// const textureLoader = new THREE.TextureLoader();
// // +++ --- +++
// 
// const enemies = [];
// const maxEnemies = 3;
// 
// // Spawn a single target box in a random maze cell (with jitter)
// // Spawn a single target box in a random free maze cell (with jitter)
// function spawnBox() {
//   // Don't exceed maxTargets or spawn when no free cells
//   if (objects.length >= maxTargets || freeCellIndices.length === 0) return;
//   // Choose a random free cell index and remove it from availability
//   const listIdx = Math.floor(Math.random() * freeCellIndices.length);
//   const cellIndex = freeCellIndices.splice(listIdx, 1)[0];
//   const cell = spawnCells[cellIndex];
//   // Allow some jitter so boxes are not flush against walls
//   const margin = 20;
//   const jitterRange = cellSize - 2 * margin;
//   const boxGeometry = new THREE.BoxGeometry(20, 20, 20);
//   const boxMaterial = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff });
//   const box = new THREE.Mesh(boxGeometry, boxMaterial);
//   box.position.x = cell.x + (Math.random() - 0.5) * jitterRange;
//   box.position.y = 10;
//   box.position.z = cell.z + (Math.random() - 0.5) * jitterRange;
//   // Track which cell this box occupies for later freeing
//   box.userData.cellIndex = cellIndex;
//   scene.add(box);
//   objects.push(box);
// }
// 
// function spawnEnemy(){
//   if(enemies.length>=maxEnemies || freeCellIndices.length===0) return;
//   const idx  = freeCellIndices.splice(Math.random()*freeCellIndices.length|0,1)[0];
//   const cell = spawnCells[idx];
//   const geo  = new THREE.SphereGeometry(8,12,12);
//   const mat  = new THREE.MeshStandardMaterial({color:0xff0000});
//   const e    = new THREE.Mesh(geo,mat);
//   e.position.set(cell.x,8,cell.z);
//   e.userData={cellIndex:idx, speed:40};
//   scene.add(e); enemies.push(e);
//   e.layers.set(MAIN_LAYER); // Add enemy to main layer (visible in minimap)
// }
// 
// // Initialize the scene and start the render loop
// init();
// animate();
// 
// // Set up the scene, camera, renderer, controls, and objects
// function init() {
//   // Create a scene with background color and fog
//   scene = new THREE.Scene();
//   scene.background = new THREE.Color(0xaaaaaa);
//   scene.fog = new THREE.Fog(0xaaaaaa, 1, 2000);
// 
//   // Set up a perspective camera
//   camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 2000);
//   camera.layers.enable(MAIN_LAYER);
//   camera.layers.enable(GROUND_LAYER);      // NEW -> main view can still see floor
//   camera.layers.disable(PLAYER_MARKER_LAYER);
// 
//   // Add hemisphere light for soft, ambient illumination
//   const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
//   light.position.set(0.5, 1, 0.75);
//   scene.add(light);
// 
//   // Create the floor plane
//   const floorGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
//   const floorMaterial = new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false });
//   const floor = new THREE.Mesh(floorGeometry, floorMaterial);
//   floor.rotation.x = -Math.PI / 2;
//   scene.add(floor);
//   floor.layers.set(GROUND_LAYER);          // CHANGED – was MAIN_LAYER
// 
//   // === NEW TEXTURE FOR GROUND ===
//   const groundTexture = textureLoader.load('textures/sand_stone_texture.png');
//   groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
//   groundTexture.repeat.set(40, 40); // tile 40x to avoid stretching
//   floor.material = new THREE.MeshStandardMaterial({ map: groundTexture });
//   floor.material.needsUpdate = true; // force material update
// 
//   // === SKY BACKGROUND ===
//   textureLoader.load('textures/sky_texture.png', (skyTex) => {
//     skyTex.mapping = THREE.EquirectangularReflectionMapping;
//     skyTex.encoding = THREE.sRGBEncoding;
//     scene.background = skyTex;
//     // If using PBR materials you can enable the next line for image-based lighting
//     // scene.environment = skyTex;
//   });
//   
//   // Add a grid helper on the floor for orientation
//   const grid = new THREE.GridHelper(2000, 100, 0x000000, 0x000000);
//   grid.material.opacity = 0.2;
//   grid.material.transparent = true;
//   scene.add(grid);
//   grid.layers.set(MINIMAP_LAYER); // <<< Grid only on minimap layer
//   // Generate maze interior walls
//   // (mazeRows, mazeCols, cellSize now globals)
//   const wallHeight = 50;
//   const wallThickness = 5;
//   // +++ Load Wall Texture +++
//   // Replace 'textures/wall_bricks.jpg' with the actual path to your texture image
//   const wallTexture = textureLoader.load('textures/wall_bricks.png');
//   // Repeat the texture across the surface
//   wallTexture.wrapS = THREE.RepeatWrapping; // Repeat horizontally
//   wallTexture.wrapT = THREE.RepeatWrapping; // Repeat vertically
//   // How many times to repeat per wall segment (adjust as needed)
//   // For a vertical wall segment (width=thickness, height=height, depth=cellSize):
//   wallTexture.repeat.set(cellSize / 50, wallHeight / 50); // Example: Repeat every 50 units
//   // +++ --- +++
// 
//   // Generate maze interior walls
//   // (mazeRows, mazeCols, cellSize now globals)
//   const wallMaterial = new THREE.MeshStandardMaterial({
//     map: wallTexture,
//     color: 0xffffff // Base color, texture often overrides this but good to set
//     // You can also add roughnessMap, normalMap etc. here for more realism later
//   });
// 
//   // Recursive backtracking maze generator
//   function generateMaze(rows, cols) {
//     const verticalWalls = [];
//     const horizontalWalls = [];
//     // initialize all walls present
//     for (let r = 0; r < rows; r++) {
//       verticalWalls[r] = [];
//       for (let c = 0; c <= cols; c++) verticalWalls[r][c] = true;
//     }
//     for (let r = 0; r <= rows; r++) {
//       horizontalWalls[r] = [];
//       for (let c = 0; c < cols; c++) horizontalWalls[r][c] = true;
//     }
//     // visited cells
//     const visited = [];
//     for (let r = 0; r < rows; r++) {
//       visited[r] = [];
//       for (let c = 0; c < cols; c++) visited[r][c] = false;
//     }
//     const stack = [];
//     let current = { r: 0, c: 0 };
//     visited[0][0] = true;
//     stack.push(current);
//     while (stack.length) {
//       const { r, c } = current;
//       const neighbors = [];
//       if (r > 0 && !visited[r - 1][c]) neighbors.push({ r: r - 1, c, dir: 'N' });
//       if (r < rows - 1 && !visited[r + 1][c]) neighbors.push({ r: r + 1, c, dir: 'S' });
//       if (c > 0 && !visited[r][c - 1]) neighbors.push({ r, c: c - 1, dir: 'W' });
//       if (c < cols - 1 && !visited[r][c + 1]) neighbors.push({ r, c: c + 1, dir: 'E' });
//       if (neighbors.length) {
//         const next = neighbors[Math.floor(Math.random() * neighbors.length)];
//         // remove wall between cells
//         if (next.dir === 'N') horizontalWalls[r][c] = false;
//         if (next.dir === 'S') horizontalWalls[r + 1][c] = false;
//         if (next.dir === 'W') verticalWalls[r][c] = false;
//         if (next.dir === 'E') verticalWalls[r][c + 1] = false;
//         visited[next.r][next.c] = true;
//         stack.push(current);
//         current = { r: next.r, c: next.c };
//       } else {
//         current = stack.pop();
//       }
//     }
//     return { verticalWalls, horizontalWalls };
//   }
// 
//   const { verticalWalls, horizontalWalls } = generateMaze(mazeRows, mazeCols);
//   const offsetX = -mazeCols * cellSize / 2;
//   const offsetZ = -mazeRows * cellSize / 2;
//   // Build list of valid spawn cell centers
//   // Build list of valid spawn cell centers
//   spawnCells = [];
//   for (let r = 0; r < mazeRows; r++) {
//     for (let c = 0; c < mazeCols; c++) {
//       spawnCells.push({
//         x: offsetX + c * cellSize + cellSize / 2,
//         z: offsetZ + r * cellSize + cellSize / 2
//       });
//     }
//   }
//   // Initialize free cell indices for occupancy tracking
//   freeCellIndices = Array.from({ length: spawnCells.length }, (_, i) => i);
//   // Place exit marker at bottom-right cell
//   const exitIndex = (mazeRows - 1) * mazeCols + (mazeCols - 1);
//   const exitCell = spawnCells[exitIndex];
//   exitPosition.set(exitCell.x, 10, exitCell.z);
//   const exitGeometry = new THREE.CylinderGeometry(10, 10, 5, 16);
//   const exitMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
//   const exitMesh = new THREE.Mesh(exitGeometry, exitMaterial);
//   exitMesh.position.set(exitCell.x, 2.5, exitCell.z);
//   scene.add(exitMesh);
//   exitMesh.layers.set(MAIN_LAYER); // Make exit visible in minimap
//   // build vertical walls
//   for (let r = 0; r < mazeRows; r++) {
//     for (let c = 0; c <= mazeCols; c++) {
//       if (verticalWalls[r][c]) {
//         const geometry = new THREE.BoxGeometry(wallThickness, wallHeight, cellSize);
//         // +++ Adjust UV mapping for vertical walls if needed +++
//         // You might need custom UV mapping if the texture looks stretched.
//         // For simple BoxGeometry, it might be okay initially.
//         // +++ --- +++
//         const mesh = new THREE.Mesh(geometry, wallMaterial);
//         mesh.position.set(offsetX + c * cellSize, wallHeight / 2, offsetZ + r * cellSize + cellSize / 2);
//         scene.add(mesh);
//         walls.push(mesh);
//         mesh.layers.set(MAIN_LAYER); // Add wall to main layer
//       }
//     }
//   }
//   // build horizontal walls
//   for (let r = 0; r <= mazeRows; r++) {
//     for (let c = 0; c < mazeCols; c++) {
//       if (horizontalWalls[r][c]) {
//         const geometry = new THREE.BoxGeometry(cellSize, wallHeight, wallThickness);
//          // +++ Adjust UV mapping for horizontal walls +++
//         // Make sure texture repeats correctly based on wall dimensions
//         const horizontalWallTexture = wallTexture.clone(); // Clone to set different repeat
//         horizontalWallTexture.needsUpdate = true; // Important when cloning!
//         horizontalWallTexture.repeat.set(cellSize / 50, wallHeight / 50); // Repeat based on horizontal wall dimensions
//         const horizontalWallMaterial = new THREE.MeshStandardMaterial({ map: horizontalWallTexture });
//         // +++ --- +++
//         const mesh = new THREE.Mesh(geometry, horizontalWallMaterial); // Use the new material
//         mesh.position.set(offsetX + c * cellSize + cellSize / 2, wallHeight / 2, offsetZ + r * cellSize);
//         scene.add(mesh);
//         walls.push(mesh);
//         mesh.layers.set(MAIN_LAYER); // Add wall to main layer
//       }
//     }
//   }
// 
//   // Create initial set of target boxes up to maxTargets
//   for (let i = 0; i < maxTargets; i++) {
//     spawnBox();
//   }
//   // Periodically spawn new boxes if below maxTargets
//   setInterval(() => {
//     if (objects.length < maxTargets) spawnBox();
//   }, spawnInterval);
// 
//   // initial enemy wave
//   for(let i=0;i<maxEnemies;i++) spawnEnemy();
//   setInterval(()=>{ if(enemies.length<maxEnemies) spawnEnemy(); },3000);
// 
//   // Initialize the WebGL renderer and add to the page
//   renderer = new THREE.WebGLRenderer({ antialias: true });
//   // Use sRGB for proper color rendering
//   renderer.outputEncoding = THREE.sRGBEncoding;
//   renderer.setPixelRatio(window.devicePixelRatio);
//   renderer.setSize(window.innerWidth, window.innerHeight);
//   document.body.appendChild(renderer.domElement);
// 
//   // === NEW HEALTH BAR ELEMENT ===
//   healthEl = document.createElement('div');
//   healthEl.id = 'health';
//   healthEl.style.cssText = `
//     position: absolute; top: 40px; left: 10px; width: 200px; height: 20px;
//     border: 2px solid #fff; background:#400; z-index:1;
//     transition: background 0.1s ease-out; /* Optional: Smooth transition */
//   `;
//   document.body.appendChild(healthEl);
//   // Update initial display
//   healthEl.style.background = `linear-gradient(to right,#0f0 ${health}%,#400 ${health}%)`;
//   // === END HEALTH BAR ===
// 
//   // Set up pointer lock controls for first-person movement
//   controls = new PointerLockControls(camera, document.body);
//   // Instruction overlay for lock & restart
//   instructionsElement = document.getElementById('instructions');
//   instructionsElement.addEventListener('click', () => {
//     if (!gameWon) {
//       controls.lock();
//     } else {
//       location.reload();
//     }
//   });
//   controls.addEventListener('lock',()=>{
//     instructionsElement.classList.add('fade');
//     setTimeout(()=> instructionsElement.style.display='none',800);
//     // *** Attach shoot listener AFTER locking controls ***
//     document.addEventListener('click', shoot);
// 
//     // Start background ambient sounds
//     if (bgm && bgm.paused) {
//       bgm.play().catch(error => {
//         console.warn("Background music autoplay failed:", error);
//       });
//     }
//   });
//   controls.addEventListener('unlock', () => {
//       instructionsElement.style.display = '';
//       instructionsElement.classList.remove('fade'); // Ensure fade class is removed if unlocking before timeout
//       // *** Remove shoot listener WHEN unlocking ***
//       document.removeEventListener('click', shoot);
//       
//       // Stop all sound effects when game is paused
//       if (sfxFootsteps && !sfxFootsteps.paused) sfxFootsteps.pause();
//       if (sfxEnemyMove && !sfxEnemyMove.paused) sfxEnemyMove.pause();
//       if (bgm && !bgm.paused) bgm.pause();
//       isMoving = false;
//   });
//   scene.add(controls.getObject());
//   // Position player at maze entrance (upper-left cell)
//   controls.getObject().position.set(
//     offsetX + cellSize / 2,
//     10,
//     offsetZ + cellSize / 2
//   );
// 
//   // +++ Load Realistic Gun Model +++
//   // --- Remove comments to enable GLTF loading ---
//   /*
//   const loader = new GLTFLoader();
//   loader.load(
//     'gun.glb', // <<< Make sure you have gun.glb in the correct path
//     (gltf) => {
//       const gunModel = gltf.scene;
// 
//       // Scale and position the loaded model
//       // --- You WILL likely need to adjust these values based on the model ---
//       // gunModel.scale.set(0.1, 0.1, 0.1); // Example scale - adjust as needed
//       // gunModel.position.set(0.2, -0.2, -0.5); // Example position - adjust as needed
//       // gunModel.rotation.y = Math.PI; // Example rotation - adjust if needed (e.g., model faces wrong way)
//       gunModel.scale.set(0.01, 0.01, 0.01); // Keep scale
//       // gunModel.position.set(0.15, -0.3, -0.4); // Try moving left, further down, slightly back
//       // gunModel.position.set(0.2, -0.25, -0.4); // Move slightly right, slightly up, keep distance
//       gunModel.position.set(0.18, -0.23, -0.4); // Keep nudged position
//       // Align gun model so it sits straight in the player's view (no cant)
//       gunModel.rotation.set(0, Math.PI, 0); // yaw 180° to face forward, no roll/pitch
//       // --- End Adjustments ---
// 
//       // Ensure model materials render correctly if they use sRGB
//       gunModel.traverse((child) => {
//         if (child.isMesh) {
//           child.material.encoding = THREE.sRGBEncoding;
//         }
//       });
// 
//       // Add the loaded gun model to the camera
//       controls.getObject().add(gunModel);
//       console.log('Gun model loaded successfully.');
//     },
//     undefined, // Optional progress callback
//     (error) => {
//       console.error('Error loading gun model:', error);
//       // Maybe fall back to the primitive gun here if loading fails?
//     }
//   );
//   */
//   // --- End GLTF loading section ---
//   // +++ End Load Realistic Gun Model +++
// 
//   // ~~~ Remove Simple Primitive Gun Placeholder ~~~
//   // const gunGeometry = new THREE.BoxGeometry(0.5, 0.5, 3); // Simple shape (width, height, depth)
//   // const gunMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
//   // const gunPlaceholder = new THREE.Mesh(gunGeometry, gunMaterial);
//   // // Position relative to camera (adjust as needed)
//   // gunPlaceholder.position.set(0.3, -0.3, -0.5); // x=right, y=down, z=forward from camera center
//   // gunPlaceholder.rotation.set(0, 0, 0); // Adjust if needed
//   // controls.getObject().add(gunPlaceholder); // Add to camera object
//   // ~~~ End Simple Primitive Gun Placeholder ~~~
// 
//   // Register input and window resize event listeners (REMOVE SHOOT from here)
//   scoreElement = document.getElementById('score');
//   scoreElement.innerText = `Score: ${score}`;
//   document.addEventListener('keydown', onKeyDown);
//   document.addEventListener('keyup', onKeyUp);
//   window.addEventListener('resize', onWindowResize);
// 
//   // after renderer creation
//   const mapSize = 200;
//   const mapScope = mazeCols * cellSize * 0.6; // Adjust scope based on maze size + padding
//   miniCam = new THREE.OrthographicCamera(-mapScope, mapScope, mapScope, -mapScope, 0.1, 1000); // Adjusted bounds & near/far
//   miniCam.layers.enable(MAIN_LAYER); // Minimap camera sees the main layer
//   miniCam.layers.enable(PLAYER_MARKER_LAYER); // Minimap camera ALSO sees the marker layer
//   miniCam.up.set(0, 0, -1); // Point camera's top towards negative Z
// 
//   // --- MINIMAP RENDERER (make it pop!) ------------------------------------
//   // 1.  Turn OFF canvas transparency (alpha:false)
//   // 2.  Give the renderer a dedicated clear‑colour
//   // 3.  Mild CSS tweaks (rounded corners)
//   /**
//    * Minimap renderer:
//    * - alpha:false   → lets WebGL clear to an opaque colour
//    * - setClearColor → dark slate grey so ground doesn't bleed through
//    */
//   miniRenderer = new THREE.WebGLRenderer({ antialias: false, alpha: false }); // << CHANGED (alpha:false)
//   miniRenderer.setClearColor(0x111111, 1); // << NEW (solid background)
//   miniRenderer.setSize(mapSize, mapSize);
//   miniRenderer.domElement.style.cssText = `
//     position:absolute;
//     bottom:10px;right:10px;
//     border:2px solid #fff;
//     border-radius:4px;           /* nicer rim                */
//   `;
//   document.body.appendChild(miniRenderer.domElement);
//   // ------------------------------------------------------------------------
// 
//   // *** Get Audio elements ***
//   sfxShoot = document.getElementById('sfxShoot');
//   sfxFootsteps = document.getElementById('sfxFootsteps');
//   sfxHeavyFootsteps = document.getElementById('sfxHeavyFootsteps');
//   sfxEnemyMove = document.getElementById('sfxEnemyMove');
//   bgm = document.getElementById('bgm');
//   
//   if (!sfxShoot) console.warn('Shoot sound effect element (sfxShoot) not found!');
//   if (!sfxFootsteps) console.warn('Footsteps sound effect element (sfxFootsteps) not found!');
//   if (!sfxHeavyFootsteps) console.warn('Heavy footsteps sound effect element (sfxHeavyFootsteps) not found!');
//   if (!sfxEnemyMove) console.warn('Enemy move sound effect element (sfxEnemyMove) not found!');
//   if (!bgm) console.warn('Background music element (bgm) not found!');
// 
//   // Create player marker
//   const markerGeometry = new THREE.ConeGeometry(8, 15, 3); // Smaller cone
//   const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 }); // Bright yellow
//   playerMarker = new THREE.Mesh(markerGeometry, markerMaterial);
//   playerMarker.position.y = 0.1; // Slightly above the floor
//   playerMarker.rotation.x = Math.PI / 2; // Point cone along Z axis initially
//   scene.add(playerMarker);
//   // playerMarker.layers.set(MAIN_LAYER); // Marker should be visible in minimap
//   playerMarker.layers.set(PLAYER_MARKER_LAYER); // Put marker on its own layer
// }
// 
// // Handle key down events to set movement flags
// function onKeyDown(event) {
//   switch (event.code) {
//     case 'KeyW': moveForward = true; break;
//     case 'KeyA': moveLeft = true; break;
//     case 'KeyS': moveBackward = true; break;
//     case 'KeyD': moveRight = true; break;
//   }
// }
// 
// // Handle key up events to clear movement flags
// function onKeyUp(event) {
//   switch (event.code) {
//     case 'KeyW': moveForward = false; break;
//     case 'KeyA': moveLeft = false; break;
//     case 'KeyS': moveBackward = false; break;
//     case 'KeyD': moveRight = false; break;
//   }
// }
// 
// // Spawn and shoot a bullet from the camera position
// function shoot() {
//   // Only shoot if controls are locked (prevents shooting while paused/instructions visible)
//   if (!controls.isLocked) return;
// 
//   // Create bullet mesh
//   const bulletGeometry = new THREE.SphereGeometry(1, 8, 8);
//   const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
//   const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);
// 
//   // Calculate bullet velocity based on camera orientation
//   const directionVector = new THREE.Vector3(0, 0, -1)
//     .applyQuaternion(camera.quaternion)
//     .normalize();
//   bullet.position.copy(camera.position);
//   bullet.userData.velocity = directionVector.multiplyScalar(bulletSpeed);
//   bullet.userData.startTime = clock.getElapsedTime();
//   scene.add(bullet);
//   bullets.push(bullet);
// 
//   // Play sound effect
//   if (sfxShoot) {
//     sfxShoot.currentTime = 0; // quick restart
//     sfxShoot.play().catch(error => {
//       console.warn("Shoot sound failed:", error);
//     });
//   }
// }
// 
// // Update camera aspect ratio and renderer size on window resize
// function onWindowResize() {
//   camera.aspect = window.innerWidth / window.innerHeight;
//   camera.updateProjectionMatrix();
//   renderer.setSize(window.innerWidth, window.innerHeight);
// }
// 
// function animate() {
//   // Main animation loop: update physics, handle input, bullets, and render
//   requestAnimationFrame(animate);
// 
//   // Time elapsed since last frame
//   const delta = clock.getDelta();
//   
//   // Movement: calculate horizontal displacement and handle wall collisions
//   direction.x = Number(moveRight) - Number(moveLeft);
//   direction.z = Number(moveForward) - Number(moveBackward);
//   
//   // Handle footstep sounds based on movement
//   let currentlyMoving = direction.lengthSq() > 0;
//   
//   // Start or stop footstep sounds when movement state changes
//   if (currentlyMoving && !isMoving) {
//     // Player started moving - play footsteps
//     if (sfxFootsteps && sfxFootsteps.paused) {
//       sfxFootsteps.play().catch(e => console.warn("Footstep audio failed:", e));
//     }
//     isMoving = true;
//   } else if (!currentlyMoving && isMoving) {
//     // Player stopped moving - stop footsteps
//     if (sfxFootsteps && !sfxFootsteps.paused) {
//       sfxFootsteps.pause();
//       sfxFootsteps.currentTime = 0;
//     }
//     isMoving = false;
//   }
//   
//   if (direction.lengthSq() > 0) {
//     direction.normalize();
//     const moveSpeed = 200;
//     const forward = new THREE.Vector3(0, 0, -1)
//       .applyQuaternion(camera.quaternion)
//       .setY(0)
//       .normalize();
//     const rightVec = new THREE.Vector3(1, 0, 0)
//       .applyQuaternion(camera.quaternion)
//       .setY(0)
//       .normalize();
//     const moveX = rightVec.multiplyScalar(direction.x * moveSpeed * delta);
//     const moveZ = forward.multiplyScalar(direction.z * moveSpeed * delta);
//     const move = moveX.clone().add(moveZ);
// 
//     const oldPos = controls.getObject().position.clone();
//     let newPos = oldPos.clone();
//     const radius = 5;
// 
//     // Check X-axis movement collision
//     newPos.x += move.x;
//     let collision = false;
//     walls.forEach(wall => {
//       const box = new THREE.Box3().setFromObject(wall);
//       const closestPoint = box.clampPoint(newPos, new THREE.Vector3());
//       if (closestPoint.distanceTo(newPos) < radius) collision = true;
//     });
//     if (!collision) oldPos.x = newPos.x;
// 
//     // Check Z-axis movement collision
//     newPos = oldPos.clone();
//     newPos.z += move.z;
//     collision = false;
//     walls.forEach(wall => {
//       const box = new THREE.Box3().setFromObject(wall);
//       const closestPoint = box.clampPoint(newPos, new THREE.Vector3());
//       if (closestPoint.distanceTo(newPos) < radius) collision = true;
//     });
//     if (!collision) oldPos.z = newPos.z;
// 
//     // Update player position
//     controls.getObject().position.x = oldPos.x;
//     controls.getObject().position.z = oldPos.z;
//   }
// 
//   // Keep the player at a fixed height
//   controls.getObject().position.y = 10;
// 
//   // Update bullets: movement, lifespan, and collisions
//   const elapsed = clock.getElapsedTime();
//   for (let i = bullets.length - 1; i >= 0; i--) {
//     const b = bullets[i];
//     // Move the bullet
//     b.position.add(b.userData.velocity.clone().multiplyScalar(delta));
//     // Remove bullet if it's exceeded its lifespan
//     if (elapsed - b.userData.startTime > bulletLife) {
//       scene.remove(b);
//       bullets.splice(i, 1);
//       continue;
//     }
//     
//     // Check collisions with target objects
//     for (let j = objects.length - 1; j >= 0; j--) {
//       const obj = objects[j];
//       // Check collision with target objects
//       if (b.position.distanceTo(obj.position) < 10) {
//         // Free up the cell index before removing this target
//         if (obj.userData.cellIndex !== undefined) freeCellIndices.push(obj.userData.cellIndex);
//         // Remove hit target and update score
//         scene.remove(obj);
//         objects.splice(j, 1);
//         score++;
//         scoreElement.innerText = `Score: ${score}`;
//         // Spawn a replacement target
//         spawnBox();
//         // Remove bullet upon impact
//         scene.remove(b);
//         bullets.splice(i, 1);
//         break;
//       }
//     }
//     
//     // Skip if bullet was already removed by target collision
//     if (i >= bullets.length) continue;
//     
//     // Check collisions with enemies
//     for (let j = enemies.length - 1; j >= 0; j--) {
//       const enemy = enemies[j];
//       if (b.position.distanceTo(enemy.position) < 9) { // Enemy radius (8) + bullet radius (1)
//         // Play impact sound
//         if (sfxHeavyFootsteps) {
//           sfxHeavyFootsteps.currentTime = 0;
//           sfxHeavyFootsteps.play().catch(e => console.warn("Heavy footsteps audio failed:", e));
//         }
//         
//         // Free up the cell
//         if (enemy.userData.cellIndex !== undefined) {
//           freeCellIndices.push(enemy.userData.cellIndex);
//           freeCellIndices.sort((a, b) => a - b);
//         }
//         
//         // Remove enemy and spawn a new one
//         scene.remove(enemy);
//         enemies.splice(j, 1);
//         spawnEnemy();
//         
//         // Remove bullet
//         scene.remove(b);
//         bullets.splice(i, 1);
//         break;
//       }
//     }
//   }
// 
//   // Check for exit condition
//   if (!gameWon) {
//     const playerPos = controls.getObject().position;
//     if (playerPos.distanceTo(exitPosition) < exitRadius) {
//       gameWon = true;
//       controls.unlock();
//       instructionsElement.innerHTML = '<h1>You Escaped!</h1><p>Click to restart</p>';
//       instructionsElement.style.display = '';
//       
//       // Play success sound (using heavy footsteps as a victory sound)
//       if (sfxHeavyFootsteps) {
//         sfxHeavyFootsteps.currentTime = 0;
//         sfxHeavyFootsteps.play().catch(e => console.warn("Victory sound failed:", e));
//       }
//     }
//   }
// 
//   // Update health bar
//   healthEl.style.background = `linear-gradient(to right,#0f0 ${health}%,#400 ${health}%)`;
// 
//   // Update enemies: movement and collision
//   let anyEnemyMoving = false;
//   
//   for(let i=enemies.length-1; i>=0; i--) {
//     const e = enemies[i];
//     const playerPos = controls.getObject().position;
//     const dir = playerPos.clone().sub(e.position).setY(0);
//     const dist = dir.length();
// 
//     // Check collision with player FIRST
//     if(dist < (8 + 5)) { // Enemy radius 8 + Player radius 5 = 13
//       hurt(10); // Damage the player
//       
//       // Play heavy footsteps for impact sound when hit
//       if (sfxHeavyFootsteps) {
//         sfxHeavyFootsteps.currentTime = 0;
//         sfxHeavyFootsteps.play().catch(e => console.warn("Heavy footsteps audio failed:", e));
//       }
//       
//       // Free up the cell this enemy occupied
//       if (e.userData.cellIndex !== undefined) {
//           freeCellIndices.push(e.userData.cellIndex);
//           // Sort to potentially make finding free cells slightly more efficient later
//           freeCellIndices.sort((a, b) => a - b);
//       }
//       // Remove enemy
//       scene.remove(e);
//       enemies.splice(i, 1);
//       spawnEnemy(); // Optionally spawn a new one immediately
//       continue; // Skip movement logic for this removed enemy
//     }
// 
//     // Enemy movement logic
//     const chaseSpeed = e.userData.speed * delta;
//     if(dist < 500) { // Chase radius
//         dir.normalize();
//         const potentialMove = dir.clone().multiplyScalar(chaseSpeed);
//         const nextPos = e.position.clone().add(potentialMove);
//         let enemyCollision = false;
//         const enemyRadius = 8; // Enemy sphere radius
// 
//         // Check for wall collisions
//         walls.forEach(wall => {
//             const wallBox = new THREE.Box3().setFromObject(wall);
//             const closestPoint = wallBox.clampPoint(nextPos, new THREE.Vector3());
//             if (closestPoint.distanceTo(nextPos) < enemyRadius) {
//                 enemyCollision = true;
//             }
//         });
// 
//         if (!enemyCollision) {
//             e.position.copy(nextPos);
//             anyEnemyMoving = true; // At least one enemy is moving
//         }
//     }
//   }
//   
//   // Handle enemy movement sound
//   if (anyEnemyMoving) {
//     if (sfxEnemyMove && sfxEnemyMove.paused) {
//       sfxEnemyMove.play().catch(e => console.warn("Enemy move audio failed:", e));
//     }
//   } else {
//     if (sfxEnemyMove && !sfxEnemyMove.paused) {
//       sfxEnemyMove.pause();
//       sfxEnemyMove.currentTime = 0;
//     }
//   }
// 
//   // Render the updated scene
//   renderer.render(scene, camera);
// 
//   // Render minimap if exists
//   // Check if miniCam and miniRenderer are initialized before using them
//   if (typeof miniCam !== 'undefined' && typeof miniRenderer !== 'undefined') {
//       const playerPos = controls.getObject().position;
//       miniCam.position.copy(playerPos).setY(500); // Lowered Y even more
//       miniCam.lookAt(playerPos.x, 0, playerPos.z); // Look down at the player's XZ position
//       
//       // Update player marker position
//       playerMarker.position.x = playerPos.x;
//       playerMarker.position.z = playerPos.z;
// 
//       // Update player marker rotation to match camera direction
//       const lookDirection = new THREE.Vector3();
//       camera.getWorldDirection(lookDirection);
//       playerMarker.rotation.z = Math.atan2(lookDirection.x, lookDirection.z); // Rotate around Y (up) axis
// 
//       miniRenderer.clear(); // <-- Clear before rendering
//       miniRenderer.render(scene, miniCam);
//   }
// }
// 
// // Call this whenever player takes damage
// function hurt(dmg){
//   // Make sure healthEl exists before trying to update style, though it should by now
//   if (!healthEl) return;
// 
//   health = Math.max(health - dmg, 0);
//   // Update the visual immediately
//   healthEl.style.background = `linear-gradient(to right,#0f0 ${health}%,#400 ${health}%)`;
// 
//   // Check for death
//   if(!health) die();
// }
// 
// function die(){
//   gameWon = true; // reuse end state toggle
//   controls.unlock(); // This will trigger the unlock listener, showing instructions
//   instructionsElement.innerHTML = '<h1>You Died!</h1><p>Click to restart</p>';
//   
//   // Stop all sounds
//   if (sfxFootsteps && !sfxFootsteps.paused) sfxFootsteps.pause();
//   if (sfxEnemyMove && !sfxEnemyMove.paused) sfxEnemyMove.pause();
//   if (bgm && !bgm.paused) bgm.pause();
// }