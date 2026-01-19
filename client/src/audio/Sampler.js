import * as Tone from 'tone';
import { instrumentManager } from './InstrumentManager'; // Import InstrumentManager
import useStore from '../store/useStore'; // Static import for Choke logic

class Sampler {
    constructor() {
        this.players = new Map(); // Direct Map of Tone.Player instances
        this.loopTimers = new Map(); // Map for loop intervals
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
            });

            // Routing Logic: Pad ID -> Track Column (0-7)
            const trackIndex = parseInt(key) % 8;

            // Connect to Audio Engine Channel if available
            import('./AudioEngine').then(({ audioEngine }) => {
                if (audioEngine.channels && audioEngine.channels[trackIndex]) {
                    player.connect(audioEngine.channels[trackIndex]);
                } else {
                    // Fallback to destination if channel not ready
                    player.connect(this.destination);
                }
            });

            this.players.set(key, player);

            // Register with InstrumentManager for FX handling
            instrumentManager.registerInstrument(key, 'sampler', player);
        });
    }

    // ... inside play method ...
    play(key, options = {}) {
        if (this.players.has(key)) {
            const player = this.players.get(key);

            // Handle Looping
            player.loop = !!options.loop;

            // --- CHOKE GROUP LOGIC ---
            // 1. Get Choke Group for this pad
            const padMappings = useStore.getState().padMappings;
            const currentPadId = parseInt(key);
            const currentColumn = currentPadId % 8;
            const currentMapping = padMappings[currentPadId];
            const explicitGroup = currentMapping ? currentMapping.chokeGroup : null;

            // 2. Find other playing pads
            this.players.forEach((otherPlayer, otherKey) => {
                if (otherKey !== key && otherPlayer.state === 'started') {
                    const otherId = parseInt(otherKey);
                    const otherMapping = padMappings[otherId];
                    let shouldChoke = false;
                    if (explicitGroup && otherMapping && otherMapping.chokeGroup === explicitGroup) {
                        shouldChoke = true;
                    } else if (otherId % 8 === currentColumn) {
                        shouldChoke = true;
                    }
                    if (shouldChoke) {
                        // Clear their loop timer too
                        if (this.loopTimers.has(otherKey)) {
                            clearInterval(this.loopTimers.get(otherKey));
                            this.loopTimers.delete(otherKey);
                        }
                        otherPlayer.stop();
                        useStore.getState().setPadActive(otherId, false);
                    }
                }
            });

            // Clean up existing timer for this key
            if (this.loopTimers.has(key)) {
                clearInterval(this.loopTimers.get(key));
                this.loopTimers.delete(key);
            }

            // Unconditionally stop previous playback
            player.onstop = null;
            player.stop();

            // Setup Loop Timer if needed
            if (options.loop && options.onLoop && player.buffer) {
                const start = player.loopStart || 0;
                const end = player.loopEnd || player.buffer.duration;
                const duration = (end - start);

                if (duration > 0) {
                    // Interval usage: standard JS interval
                    const timerId = setInterval(() => {
                        // Only trigger if still playing
                        if (player.state === 'started') {
                            options.onLoop();
                        } else {
                            clearInterval(timerId); // safety
                        }
                    }, duration * 1000);
                    this.loopTimers.set(key, timerId);
                }
            }

            // Assign onstop callback
            if (options.onEnded) {
                player.onstop = () => {
                    // Clear timer on stop
                    if (this.loopTimers.has(key)) {
                        clearInterval(this.loopTimers.get(key));
                        this.loopTimers.delete(key);
                    }
                    options.onEnded();
                    player.onstop = null;
                };
            } else {
                player.onstop = () => {
                    // Default cleanup even if no onEnded
                    if (this.loopTimers.has(key)) {
                        clearInterval(this.loopTimers.get(key));
                        this.loopTimers.delete(key);
                    }
                    player.onstop = null;
                };
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

    stop(key) {
        if (this.players.has(key)) {
            // Clear Timer
            if (this.loopTimers.has(key)) {
                clearInterval(this.loopTimers.get(key));
                this.loopTimers.delete(key);
            }
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

    /**
     * Quantize the sample duration to the nearest bar based on BPM.
     * Also trims initial silence (transient detection).
     * @param {string} key 
     * @param {number} bpm 
     */
    quantizeSample(key, bpm) {
        if (!this.players.has(key)) {
            console.warn(`[Sampler] No sample found for ${key} to quantize.`);
            return null;
        }

        const player = this.players.get(key);
        const buffer = player.buffer;

        // 1. Detect Start Offset (Silence Trimming)
        // Simple algorithm: find first sample exceeding threshold
        const threshold = 0.01; // -40dB approx
        const channelData = buffer.getChannelData(0);
        let startIndex = 0;

        for (let i = 0; i < channelData.length; i++) {
            if (Math.abs(channelData[i]) > threshold) {
                startIndex = i;
                break;
            }
        }

        // Convert sample index to seconds
        const startOffset = startIndex / buffer.sampleRate;
        console.log(`[Sampler] Auto-Trim Start: ${startOffset.toFixed(4)}s`);

        // 2. Calculate Effective Duration
        // Duration from start point to end of buffer
        const effectiveDuration = buffer.duration - startOffset;

        // 3. Calculate Quantized Target Duration
        const secondsPerBeat = 60 / bpm;
        const secondsPerBar = secondsPerBeat * 4; // Assuming 4/4

        // Find nearest number of bars
        let numBars = Math.round(effectiveDuration / secondsPerBar);
        if (numBars < 1) numBars = 1;

        const targetDuration = numBars * secondsPerBar;
        console.log(`[Sampler] Quantizing: EffDur=${effectiveDuration.toFixed(2)}s -> Target=${targetDuration.toFixed(2)}s (${numBars} bars at ${bpm} BPM)`);

        // 4. Apply Loop Points
        // We set the player to start at the detected transient
        // And end exactly targetDuration seconds later
        player.loopStart = startOffset;
        player.loopEnd = startOffset + targetDuration;
        player.loop = true;

        // Note: loopEnd cannot exceed buffer duration. 
        // If target is longer than File, we might have silence at end, or we just cap it.
        // Tone.Player handles loopEnd > duration by looping early? No, careful.
        if (player.loopEnd > buffer.duration) {
            console.warn('[Sampler] Target duration exceeds buffer length. Capping to buffer end.');
            player.loopEnd = buffer.duration;
            // Recalculate actual bars or just accept it's short?
        }

        return {
            startOffset,
            loopEnd: player.loopEnd,
            numBars,
            targetDuration
        };
    }
}

export const sampler = new Sampler();
