// js/utils/audio.js
// Manages loading and playback of audio assets.

// Define known sound effect IDs
export const SOUND_KEYS = {
    SHOOT: 'sfxShoot',
    FOOTSTEPS: 'sfxFootsteps',
    HEAVY_FOOTSTEPS: 'sfxHeavyFootsteps',
    ENEMY_MOVE: 'sfxEnemyMove',
    BACKGROUND_MUSIC: 'bgm'
};

// Store references to the audio elements
const _audioElements = {};

/**
 * Initializes the audio manager by getting references to all audio elements defined in SOUND_KEYS.
 */
export function initAudio() {
    let allFound = true;
    for (const key in SOUND_KEYS) {
        const elementId = SOUND_KEYS[key];
        const element = document.getElementById(elementId);
        if (element) {
            _audioElements[elementId] = element;
            // console.log(`Audio: Found element for ${key} (#${elementId})`);
        } else {
            console.warn(`Audio: Element with ID '${elementId}' for sound '${key}' not found!`);
            allFound = false;
        }
    }
    if (allFound) {
        console.log("Audio Manager Initialized successfully.");
    } else {
        console.warn("Audio Manager Initialized with missing elements.");
    }
}

/**
 * Plays a sound effect by its ID.
 * @param {string} soundId - The ID of the audio element (must be one of SOUND_KEYS values).
 * @param {boolean} [restart=true] - Whether to restart the sound if it's already playing.
 */
export function playSound(soundId, restart = true) {
    const audioElement = _audioElements[soundId];
    if (audioElement) {
        try {
            if (restart) {
                audioElement.currentTime = 0;
            }
            // Check if it's already playing (for non-looping sounds, restart handles it)
            // For looping sounds, we might not want to restart if already playing
            if (audioElement.paused || restart) {
                 audioElement.play().catch(error => {
                    // Autoplay restrictions might prevent playback initially
                    console.warn(`Audio: Failed to play '${soundId}':`, error.message);
                });
            }
        } catch (error) {
            console.error(`Audio: Error playing sound '${soundId}':`, error);
        }
    } else {
        console.warn(`Audio: Cannot play sound - ID '${soundId}' not found.`);
    }
}

/**
 * Stops a sound effect by its ID and resets its time.
 * @param {string} soundId - The ID of the audio element.
 */
export function stopSound(soundId) {
    const audioElement = _audioElements[soundId];
    if (audioElement && !audioElement.paused) {
        try {
            audioElement.pause();
            audioElement.currentTime = 0; // Reset position
        } catch (error) {
             console.error(`Audio: Error stopping sound '${soundId}':`, error);
        }
    }
}

/**
 * Pauses a sound effect by its ID without resetting time (useful for BGM).
 * @param {string} soundId - The ID of the audio element.
 */
export function pauseSound(soundId) {
    const audioElement = _audioElements[soundId];
    if (audioElement && !audioElement.paused) {
         try {
            audioElement.pause();
        } catch (error) {
             console.error(`Audio: Error pausing sound '${soundId}':`, error);
        }
    }
}


/** Stops all currently playing sound effects managed by this module. */
export function stopAllSounds() {
    console.log("Audio: Stopping all sounds.");
    for (const soundId in _audioElements) {
        // Check if it's actually playing before stopping
        const audioElement = _audioElements[soundId];
        if (audioElement && !audioElement.paused) {
            try {
                audioElement.pause();
                // Only reset time for non-background music sounds
                if (soundId !== SOUND_KEYS.BACKGROUND_MUSIC) {
                     audioElement.currentTime = 0;
                }
            } catch (error) {
                console.error(`Audio: Error stopping sound '${soundId}' during stopAll:`, error);
            }
        }
    }
}

/**
 * Sets the loop property for a specific sound.
 * @param {string} soundId - The ID of the audio element.
 * @param {boolean} loop - Whether the sound should loop.
 */
export function setLoop(soundId, loop) {
    const audioElement = _audioElements[soundId];
    if (audioElement) {
        audioElement.loop = loop;
    } else {
         console.warn(`Audio: Cannot set loop - ID '${soundId}' not found.`);
    }
} 