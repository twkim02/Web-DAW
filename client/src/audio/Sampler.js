import * as Tone from 'tone';

class Sampler {
    constructor() {
        this.players = new Tone.Players().toDestination();
        // Connect to a limiter/compressor for safety later
    }

    /**
     * Load a sample into a specific key/pad index
     * @param {string} key - Unique identifier for the sample (e.g., 'pad-0')
     * @param {string} url - URL or path to the audio file
     */
    async loadSample(key, url) {
        return new Promise((resolve, reject) => {
            this.players.add(key, url, () => {
                resolve();
            });
        });
    }

    /**
   * Play a sample
   * @param {string} key - Identifier of the sample to play
   * @param {object} options - Options like startTime, offset, duration, loop
   */
    play(key, options = {}) {
        if (this.players.has(key)) {
            const player = this.players.player(key);
            player.loop = !!options.loop;
            // If re-triggering, typically we want to restart.
            // Launchpad style: One-shot usually restarts.
            if (player.state === 'started') {
                player.stop();
            }
            player.start(options.startTime, options.offset, options.duration);
        } else {
            console.warn(`Sample ${key} not found`);
        }
    }

    isPlaying(key) {
        if (this.players.has(key)) {
            return this.players.player(key).state === 'started';
        }
        return false;
    }

    /**
     * Stop a sample
     * @param {string} key 
     */
    stop(key) {
        if (this.players.has(key)) {
            const player = this.players.player(key);
            player.stop();
            player.loop = false; // Reset loop
        }
    }
}

export const sampler = new Sampler();
