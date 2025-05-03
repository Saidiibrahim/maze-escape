// js/utils/input.js
// Handles keyboard (WASD movement) and mouse (Pointer Lock for shooting) input.

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

/** @type {function(): void | null} */
let shootCallback = null; // Callback for when a shot is requested

/** @type {HTMLElement | null} */
let instructionsElement = null;

/** @type {import('three/controls/PointerLockControls.js').PointerLockControls | null} */
let pointerLockControls = null;

/** @type {function(): boolean} */
let getGameWonState = () => false;

/** @type {function(): void | null} */
let onUnlockCallback = null;

/** @type {function(): void | null} */
let onLockCallback = null;

/**
 * Handles key down events to set movement flags.
 * @param {KeyboardEvent} event
 */
function onKeyDown(event) {
  switch (event.code) {
    case 'KeyW':
    case 'ArrowUp':
      moveForward = true;
      break;
    case 'KeyA':
    case 'ArrowLeft':
      moveLeft = true;
      break;
    case 'KeyS':
    case 'ArrowDown':
      moveBackward = true;
      break;
    case 'KeyD':
    case 'ArrowRight':
      moveRight = true;
      break;
  }
}

/**
 * Handles key up events to clear movement flags.
 * @param {KeyboardEvent} event
 */
function onKeyUp(event) {
  switch (event.code) {
    case 'KeyW':
    case 'ArrowUp':
      moveForward = false;
      break;
    case 'KeyA':
    case 'ArrowLeft':
      moveLeft = false;
      break;
    case 'KeyS':
    case 'ArrowDown':
      moveBackward = false;
      break;
    case 'KeyD':
    case 'ArrowRight':
      moveRight = false;
      break;
  }
}

/**
 * Handles the click event, primarily for shooting when controls are locked.
 */
function onMouseClick() {
  if (pointerLockControls && pointerLockControls.isLocked && shootCallback) {
    shootCallback();
  }
}

/**
 * Initializes the input handling system.
 * @param {import('three/controls/PointerLockControls.js').PointerLockControls} controls - The PointerLockControls instance.
 * @param {HTMLElement} instructionsEl - The instructions overlay element.
 * @param {object} options
 * @param {function(): void} options.onShoot - Callback function when a shoot action is triggered.
 * @param {function(): boolean} options.getIsGameWon - Function to check the game won state.
 * @param {function(): void} [options.onUnlock] - Optional callback for when controls are unlocked.
 * @param {function(): void} [options.onLock] - Optional callback for when controls are locked.
 */
export function initInput(controls, instructionsEl, options) {
  pointerLockControls = controls;
  instructionsElement = instructionsEl;
  shootCallback = options.onShoot;
  getGameWonState = options.getIsGameWon;
  onUnlockCallback = options.onUnlock;
  onLockCallback = options.onLock;

  // Listener for instructions overlay click (start/restart)
  instructionsElement.addEventListener('click', () => {
    if (!getGameWonState()) {
      pointerLockControls.lock();
    } else {
      location.reload(); // Restart the game
    }
  });

  // Listeners for Pointer Lock state changes
  pointerLockControls.addEventListener('lock', () => {
    instructionsElement.classList.add('fade');
    // Use requestAnimationFrame to ensure display:none happens after fade
    requestAnimationFrame(() => {
        setTimeout(()=> instructionsElement.style.display='none', 800); // Match fade duration
    });

    // Add shoot listener *only* when locked
    document.addEventListener('click', onMouseClick);
    if(onLockCallback) onLockCallback();
  });

  pointerLockControls.addEventListener('unlock', () => {
    instructionsElement.style.display = ''; // Make it visible again
    instructionsElement.classList.remove('fade');

    // Remove shoot listener when unlocked
    document.removeEventListener('click', onMouseClick);
    if (onUnlockCallback) onUnlockCallback();

    // Reset movement flags on unlock to prevent sticking
    moveForward = moveBackward = moveLeft = moveRight = false;
  });

  // General keyboard listeners
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
}

/**
 * Gets the current movement direction state.
 * @returns {{ forward: boolean, backward: boolean, left: boolean, right: boolean }}
 */
export function getMovementState() {
  return {
    forward: moveForward,
    backward: moveBackward,
    left: moveLeft,
    right: moveRight,
  };
} 