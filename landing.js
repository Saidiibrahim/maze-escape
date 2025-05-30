// landing.js
// Handles Three.js animations for the landing page hero section

import * as THREE from 'three';

let camera, scene, renderer;
let particles, geometry, material;
let mouseX = 0, mouseY = 0;

const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;
const container = document.getElementById('hero-canvas-container');

/**
 * Initializes the Three.js scene, camera, renderer, and particles.
 */
function init() {
  if (!container) {
      console.error('Hero canvas container not found!');
      return;
  }

  // Camera
  camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 1, 2000);
  camera.position.z = 1000;

  // Scene
  scene = new THREE.Scene();

  // Particles
  geometry = new THREE.BufferGeometry();
  const vertices = [];
  const numParticles = 10000;

  for (let i = 0; i < numParticles; i++) {
    const x = Math.random() * 2000 - 1000;
    const y = Math.random() * 2000 - 1000;
    const z = Math.random() * 2000 - 1000;
    vertices.push(x, y, z);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

  material = new THREE.PointsMaterial({
    color: 0x00ff99, // Use accent green
    size: 2,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.7
  });

  particles = new THREE.Points(geometry, material);
  scene.add(particles);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // alpha: true for transparent background
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // Event Listeners
  document.addEventListener('mousemove', onDocumentMouseMove, false);
  window.addEventListener('resize', onWindowResize, false);
}

/**
 * Handles window resize events to update camera aspect ratio and renderer size.
 */
function onWindowResize() {
  if (!container) return;
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}

/**
 * Tracks mouse movement to slightly influence particle animation.
 * @param {MouseEvent} event - The mouse move event.
 */
function onDocumentMouseMove(event) {
  mouseX = (event.clientX - windowHalfX) / 5; // Reduced influence
  mouseY = (event.clientY - windowHalfY) / 5;
}

/**
 * The main animation loop.
 */
function animate() {
  requestAnimationFrame(animate);
  render();
}

/**
 * Renders the scene and updates particle positions.
 */
function render() {
  const time = Date.now() * 0.00005;

  // Slightly move camera based on mouse position for parallax effect
  camera.position.x += (mouseX - camera.position.x) * 0.01;
  camera.position.y += (-mouseY - camera.position.y) * 0.01;
  camera.lookAt(scene.position); // Keep camera focused on the center

  // Rotate particles
  if (particles) {
      particles.rotation.x = time * 0.5;
      particles.rotation.y = time * 0.25;
  }

  renderer.render(scene, camera);
}

// --- Initialize --- //
init();
animate(); 