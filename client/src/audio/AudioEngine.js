import * as Tone from 'tone';

import { sampler } from './Sampler';

class AudioEngine {
    constructor() {
        this.isInitialized = false;
        this.synth = null;
    }

    async init() {
        console.log('[AudioEngine] init() start');
        if (this.isInitialized) {
            console.log('[AudioEngine] Already initialized');
            return;
        }

        try {
            // Tone.start() should be called by the UI event handler (App.jsx)
            // But we check just in case or if called programmatically later
            if (Tone.context.state !== 'running') {
                console.log('[AudioEngine] Context not running, attempting resume/start...');
                // Note: This might fail if not in a user event, but harmless to try if missed.
                await Tone.start();
            }
            console.log('[AudioEngine] Audio Context State:', Tone.context.state);

            // Initialize Synth
            this.synth = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'triangle' },
                envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 1 }
            }).toDestination();

            // Wait for synth to be ready? usually PolySynth is synchronous instantiation
            this.synth.volume.value = -10;

            console.log('[AudioEngine] Synth initialized');
            this.isInitialized = true;

            // Set default Transport settings
            Tone.Transport.bpm.value = 120;

        } catch (error) {
            console.error('[AudioEngine] Error during init:', error);
            throw error;
        }

        // Set default Transport settings
        Tone.Transport.bpm.value = 120;

        // Initialize Metronome
        this.metronomePart = new Tone.Loop((time) => {
            // Strong click on beat 1? usually 4/4
            // Simple click for now
            const osc = new Tone.Oscillator().toDestination();
            osc.frequency.value = 800; // High pitch
            osc.volume.value = -10;
            osc.start(time).stop(time + 0.05); // Short beep
        }, "4n").start(0);

        // Mute initially
        this.metronomePart.mute = true;
    }

    setMetronome(isOn) {
        if (this.metronomePart) {
            this.metronomePart.mute = !isOn;
        }
    }

    get context() {
        return Tone.getContext();
    }

    setBpm(bpm) {
        Tone.Transport.bpm.value = bpm;
    }

    startTransport() {
        Tone.Transport.start();
    }

    stopTransport() {
        Tone.Transport.stop();
    }

    toggleTransport() {
        if (Tone.Transport.state === 'started') {
            Tone.Transport.pause(); // or stop if we want reset
        } else {
            Tone.Transport.start();
        }
        return Tone.Transport.state;
    }

    triggerSynth(note, duration = '8n') {
        if (this.synth) {
            this.synth.triggerAttackRelease(note, duration);
        }
    }

    startSynthNote(note) {
        if (this.synth) {
            this.synth.triggerAttack(note);
        }
    }

    stopSynthNote(note) {
        if (this.synth) {
            this.synth.triggerRelease(note);
        }
    }

    updateSynthParams(params) {
        if (!this.synth) return;

        if (params.oscillatorType) {
            this.synth.set({ oscillator: { type: params.oscillatorType } });
        }
        if (params.envelope) {
            this.synth.set({ envelope: params.envelope });
        }
    }
}

export const audioEngine = new AudioEngine();
