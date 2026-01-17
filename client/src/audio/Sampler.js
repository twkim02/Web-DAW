import * as Tone from 'tone';

class Sampler {
    constructor() {
        this.players = new Map(); // Direct Map of Tone.Player instances
        this.destination = Tone.getDestination(); // Default output
    }

    connectTo(node) {
        this.destination = node;
        // Reconnect all existing players
        this.players.forEach(player => {
            player.disconnect();
            player.connect(this.destination);
        });
        console.log('[Sampler] Connected to custom node (FX Chain)');
    }

    /**
     * Load a sample into a specific key/pad index
     * @param {string} key - Unique identifier for the sample (e.g., 'pad-0')
     * @param {string} url - URL or path to the audio file
     */
    async loadSample(key, url) {
        return new Promise((resolve, reject) => {
            if (this.players.has(key)) {
                // Dipose old player first to ensure clean state
                this.unload(key);
            }

            const player = new Tone.Player({
                url: url,
                loop: false,
                autostart: false,
                onload: () => {
                    console.log(`[Sampler] Loaded new sample for key: ${key}`);
                    resolve();
                },
                onerror: (err) => {
                    console.error(`[Sampler] Failed to load sample for key: ${key}`, err);
                    reject(err);
                }
            }).connect(this.destination);

            this.players.set(key, player);
        });
    }

    /**
     * Play a sample
     * @param {string} key - Identifier of the sample to play
     * @param {object} options - Options like startTime, offset, duration, loop
     */
    play(key, options = {}) {
        if (this.players.has(key)) {
            const player = this.players.get(key);

            // Handle Looping
            player.loop = !!options.loop;

            // Stop if already playing to allow retrigger
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
            return this.players.get(key).state === 'started';
        }
        return false;
    }

    /**
     * Stop a sample
     * @param {string} key 
     */
    stop(key) {
        if (this.players.has(key)) {
            const player = this.players.get(key);
            player.stop();
            player.loop = false;
        }
    }

    /**
     * Unload/Dispose a sample
     * @param {string} key 
     */
    unload(key) {
        if (this.players.has(key)) {
            const player = this.players.get(key);
            player.disconnect();
            player.dispose();
            this.players.delete(key);
            console.log(`[Sampler] Unloaded sample for key: ${key}`);
        }
    }
}

export const sampler = new Sampler();
