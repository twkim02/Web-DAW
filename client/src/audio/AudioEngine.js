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

        // Initialize Effects
        this.reverb = new Tone.Reverb({
            decay: 1.5,
            preDelay: 0.01,
            wet: 0 // Start dry
        });
        await this.reverb.generate(); // Reverb requires generation

        // Initialize Analyser (FFT)
        this.analyser = new Tone.Analyser("fft", 256);

        // Chain: Delay -> Reverb -> Analyser -> Destination
        this.reverb.connect(this.analyser);
        this.analyser.toDestination();

        this.delay = new Tone.FeedbackDelay({
            delayTime: 0.25,
            feedback: 0.5,
            wet: 0 // Start dry
        }).connect(this.reverb);

        // create a main bus from simpler/synth to effects
        // We need to reconnect synth and samplers to this chain instead of destination
        // Currently Sampler goes toDestination() and Synth goes toDestination()

        // Re-routing Synth
        this.synth.disconnect();
        this.synth.connect(this.delay);

        // Note: Sampler is in a separate file. We need a way to route it too.
        // Ideally, Sampler should expose its output node or allow connecting.
        // For now, let's assume we handle Synth first, and maybe update Sampler later or exposed method.
        import('./Sampler').then(({ sampler }) => {
            sampler.connectTo(this.delay);
        });

        console.log('[AudioEngine] Effects Initialized');

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

    setReverbParams(params) {
        if (!this.reverb) return;
        if (params.mix !== undefined) this.reverb.wet.value = params.mix;
        if (params.decay !== undefined) this.reverb.decay = params.decay;
    }

    setDelayParams(params) {
        if (!this.delay) return;
        if (params.mix !== undefined) this.delay.wet.value = params.mix;
        if (params.time !== undefined) this.delay.delayTime.value = params.time;
        if (params.feedback !== undefined) this.delay.feedback.value = params.feedback;
    }

    getAudioData() {
        if (!this.analyser) return null;
        return this.analyser.getValue(); // Returns Float32Array of dB values
    }
}

export const audioEngine = new AudioEngine();
