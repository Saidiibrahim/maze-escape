// js/entities/bullet.js
// Manages bullet creation, movement, and collision detection.
import * as THREE from 'three';
import {
    BULLET_SPEED,
    BULLET_LIFE,
    TARGET_COLLISION_RADIUS,
    ENEMY_RADIUS
} from '../core/constants.js';
// TODO: Import Audio Manager when created

// Private variables for the module
let _bullets = [];
let _scene = null;
let _clock = null;

/**
 * Initializes the Bullet Manager.
 * @param {THREE.Scene} sceneInstance - The main scene object.
 * @param {THREE.Clock} clockInstance - The game clock instance.
 */
export function initBulletManager(sceneInstance, clockInstance) {
    _scene = sceneInstance;
    _clock = clockInstance;
    _bullets = []; // Ensure array is empty on init
    console.log("Bullet Manager initialized");
}

/**
 * Creates and launches a new bullet.
 * @param {THREE.Camera} camera - The player camera to get direction and position.
 */
export function shootBullet(camera) {
    if (!_scene || !_clock) {
        console.error("Bullet Manager not initialized!");
        return;
    }

    // Create bullet mesh
    const bulletGeometry = new THREE.SphereGeometry(1, 8, 8);
    const bulletMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const bullet = new THREE.Mesh(bulletGeometry, bulletMaterial);

    // Calculate initial position and velocity
    const directionVector = new THREE.Vector3();
    camera.getWorldDirection(directionVector); // Get camera direction

    bullet.position.copy(camera.position);
    bullet.userData.velocity = directionVector.multiplyScalar(BULLET_SPEED);
    bullet.userData.startTime = _clock.getElapsedTime();

    _scene.add(bullet);
    _bullets.push(bullet);

    // Play sound effect
    // TODO: Replace with Audio Manager call
    const sfxShoot = document.getElementById('sfxShoot');
    if (sfxShoot) {
        sfxShoot.currentTime = 0; // Quick restart
        sfxShoot.play().catch(error => {
            console.warn("Shoot sound failed:", error);
        });
    }
}

/**
 * Updates all active bullets, handling movement, lifespan, and collisions.
 * @param {number} delta - Time delta since last frame.
 * @param {THREE.Mesh[]} targets - Array of target objects.
 * @param {THREE.Mesh[]} enemies - Array of enemy objects.
 * @param {object} callbacks
 * @param {function(THREE.Mesh): void} callbacks.onTargetHit - Called when a bullet hits a target.
 * @param {function(THREE.Mesh): void} callbacks.onEnemyHit - Called when a bullet hits an enemy.
 */
export function updateBullets(delta, targets, enemies, callbacks) {
    if (!_scene || !_clock) return;

    const elapsed = _clock.getElapsedTime();

    // Iterate backwards for safe removal
    for (let i = _bullets.length - 1; i >= 0; i--) {
        const bullet = _bullets[i];
        let bulletRemoved = false;

        // --- Movement ---
        bullet.position.add(bullet.userData.velocity.clone().multiplyScalar(delta));

        // --- Lifespan Check ---
        if (elapsed - bullet.userData.startTime > BULLET_LIFE) {
            _scene.remove(bullet);
            _bullets.splice(i, 1);
            bulletRemoved = true;
            continue; // Skip collision checks for expired bullet
        }

        // --- Target Collision Check ---
        for (let j = targets.length - 1; j >= 0; j--) {
            const target = targets[j];
            // Simple distance check (using squared distance is slightly faster)
            // const distanceSq = bullet.position.distanceToSquared(target.position);
            // if (distanceSq < TARGET_COLLISION_RADIUS * TARGET_COLLISION_RADIUS) {
            if (bullet.position.distanceTo(target.position) < TARGET_COLLISION_RADIUS) {
                callbacks.onTargetHit(target);
                _scene.remove(bullet);
                _bullets.splice(i, 1);
                bulletRemoved = true;
                break; // Bullet hit a target, no need to check other targets
            }
        }

        if (bulletRemoved) continue; // Skip enemy check if already removed

        // --- Enemy Collision Check ---
        const bulletRadius = 1; // Bullet geometry radius
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            // Simple distance check (enemy radius + bullet radius)
            // const distanceSq = bullet.position.distanceToSquared(enemy.position);
            // const radiiSumSq = (ENEMY_RADIUS + bulletRadius) * (ENEMY_RADIUS + bulletRadius);
            // if (distanceSq < radiiSumSq) {
            if (bullet.position.distanceTo(enemy.position) < ENEMY_RADIUS + bulletRadius) {
                callbacks.onEnemyHit(enemy);
                _scene.remove(bullet);
                _bullets.splice(i, 1);
                bulletRemoved = true;
                break; // Bullet hit an enemy
            }
        }
    }
}

/** Gets the array of active bullet meshes. */
export function getBullets() {
    return _bullets;
} 