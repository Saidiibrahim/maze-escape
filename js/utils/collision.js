// js/utils/collision.js
// This file will provide utility functions for collision detection. 
import * as THREE from 'three';

// Reusable Box3 for checking wall collisions
const _wallBox = new THREE.Box3();
const _closestPoint = new THREE.Vector3();

/**
 * Checks if a point (representing a sphere center) collides with any wall mesh.
 * Uses axis-aligned bounding boxes (AABB) for walls and checks distance to the closest point on the box.
 *
 * @param {THREE.Vector3} position - The center position of the sphere (e.g., player or enemy).
 * @param {number} radius - The radius of the sphere.
 * @param {THREE.Mesh[]} walls - An array of wall meshes to check against.
 * @returns {boolean} True if a collision occurs, false otherwise.
 */
export function checkSphereWallCollision(position, radius, walls) {
    for (const wall of walls) {
        // It's generally more efficient to reuse the Box3 object
        // if possible, rather than creating a new one each time.
        _wallBox.setFromObject(wall);
        // Find the point on the wall's bounding box closest to the sphere center
        _wallBox.clampPoint(position, _closestPoint);
        // Calculate the distance between the sphere center and the closest point
        // If the distance is less than the sphere's radius, they are colliding.
        if (_closestPoint.distanceToSquared(position) < radius * radius) {
             // Using distanceToSquared is slightly more performant as it avoids a sqrt
            return true; // Collision detected
        }
    }
    return false; // No collision
}

// Potential future additions:
// - checkSphereSphereCollision(pos1, radius1, pos2, radius2)
// - checkRayCollision(raycaster, objects) 