import * as Tone from 'tone';
import { sampler } from './Sampler';

class AudioEngine {
    constructor() {
        this.isInitialized = false;
        this.synth = null;
    }

    async init() {
        if (this.isInitialized) return;

        try {
            if (Tone.context.state !== 'running') {
                await Tone.start();
            }

            // Initialize Synth
            this.synth = new Tone.PolySynth(Tone.Synth, {
                oscillator: { type: 'triangle' },
                envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 1 }
            }).toDestination();

            this.synth.volume.value = -10;
            console.log('[AudioEngine] Synth initialized');

            this.isInitialized = true;

            // Initialize Effects
            this.reverb = new Tone.Reverb({
                decay: 1.5,
                preDelay: 0.01,
                wet: 0 // Start dry
            });
            await this.reverb.generate();

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

            // Re-routing Synth (disconnect from destination first)
            this.synth.disconnect();
            this.synth.connect(this.delay);

            // Connect Sampler to Effects Chain
            sampler.connectTo(this.delay);

            console.log('[AudioEngine] Effects Initialized');

            // Set default Transport settings
            Tone.Transport.bpm.value = 120;

            // Initialize Metronome
            this.metronomePart = new Tone.Loop((time) => {
                const osc = new Tone.Oscillator().toDestination();
                osc.frequency.value = 800; // High pitch
                osc.volume.value = -10;
                osc.start(time).stop(time + 0.05); // Short beep
            }, "4n").start(0);

            this.metronomePart.mute = true;

        } catch (error) {
            console.error('[AudioEngine] Error during init:', error);
            throw error;
        }
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
            Tone.Transport.pause();
        } else {
            Tone.Transport.start();
        }
        return Tone.Transport.state;
    }

    triggerSynth(note, duration = '8n', params = {}) {
        if (this.synth) {
            // Apply params if provided (e.g., change oscillator type)
            if (params.oscillator) {
                this.synth.set({ oscillator: params.oscillator });
            }
            this.synth.triggerAttackRelease(note, duration);
        }
    }

    startSynthNote(note, params = {}) {
        if (this.synth) {
            if (params.oscillator) {
                this.synth.set({ oscillator: params.oscillator });
            }
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
        return this.analyser.getValue();
    }
}

export const audioEngine = new AudioEngine();
