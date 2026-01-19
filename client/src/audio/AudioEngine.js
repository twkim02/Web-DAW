import * as Tone from 'tone';
// import { sampler } from './Sampler'; // Removed unused import

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

            // Optimize Latency
            Tone.context.lookAhead = 0.05; // Lower lookAhead (default 0.1) for faster scheduling
            // Tone.context.latencyHint is mostly usually set at context creation, so lookAhead is the main knob here.

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
                wet: 1 // Sends usually expect 100% wet on the return bus
            });
            await this.reverb.generate();

            this.delay = new Tone.FeedbackDelay({
                delayTime: 0.25,
                feedback: 0.5,
                wet: 1 // Return bus 100% wet
            });

            // Master Buss
            this.masterBuss = new Tone.Gain(1).toDestination();

            // Initialize Analyser for Visualizer
            this.analyser = new Tone.Analyser("fft", 256);
            this.masterBuss.connect(this.analyser);

            // Connect Returns to Master
            this.reverb.connect(this.masterBuss);
            this.delay.connect(this.masterBuss);

            // Initialize 8 Mixer Channels
            this.channels = Array(8).fill(null).map((_, i) => {
                const channel = new Tone.Channel({
                    volume: 0,
                    pan: 0,
                    mute: false,
                    solo: false
                });

                // Route Channel to Master
                channel.connect(this.masterBuss);

                // Setup Sends
                // Tone.Channel doesn't have built-in named sends easily accessible via simple config object in constructor without setup.
                // We manually create visual "Send" logic by using `channel.send(name, val)`?
                // Actually Tone.Channel has .send(name, val) if we register the receive.
                // But simpler: just use Tone.Gain for sends?

                // Let's use Tone.Channel's receive? No, that's for buses.
                // We'll trust Tone.Channel internal send logic if we can named them?
                // Standard Tone: source.connect(dest).
                // Channel is a Solot/Mute/Vol/Pan wrapper. It can connect to Aux.

                return channel;
            });

            // We need to register receive buses if we use channel.send()? 
            // Or we just manually manage send gains?
            // Let's create GainNodes for each send per channel if Tone.Channel doesn't simplify it.
            // Actually, Tone.Channel *does* allow sending.
            // channel.receive("reverb") ?? No.

            // Re-implementation:
            // Let's manually add `sendA` and `sendB` properties to our stored channel objects.
            this.channels.forEach(channel => {
                // Create Send A (Reverb)
                const sendA = channel.send("reverb", -Infinity); // Init -inf dB
                // Create Send B (Delay)
                const sendB = channel.send("delay", -Infinity);
            });

            // Register global receive buses
            Tone.getDestination().context.createGain(); // Dummy context check
            // Tone.connect("reverb", this.reverb); 
            // Tone.connect("delay", this.delay); 
            // Wait, Tone.js split/receive logic is deprecated or different in v14 depending on usage.
            // Let's just do:
            // channel.connect(sendNode) with a gain.
            // But Tone.Channel.send() is convenient. Checks Tone.context.listener? No.

            // Correct Tone.js Send/Receive workflow:
            // const reverb = new Tone.Reverb().toDestination();
            // const channel = new Tone.Channel().toDestination();
            // channel.send("bus name", volume);
            // const tail = Tone.Receive("bus name"); // No explicit receive in v14?

            // Let's look at Tone.Channel source: it has .send(name, value).
            // It relies on `Tone.getContext().getDestination()` behaving as a bus registry? No.

            // Safe fallback: Manual Send Gains.
            this.channels.forEach(channel => {
                // Send A -> Reverb
                const sendAGain = new Tone.Gain(0);
                channel.connect(sendAGain);
                sendAGain.connect(this.reverb);
                channel.sendA = sendAGain;

                // Send B -> Delay
                const sendBGain = new Tone.Gain(0);
                channel.connect(sendBGain);
                sendBGain.connect(this.delay);
                channel.sendB = sendBGain;
            });




            // Force Re-routing of existing instruments to these new channels
            import('./InstrumentManager').then(({ instrumentManager }) => {
                instrumentManager.refreshRouting();
            });

            // ... (rest of init)

            // Re-routing Synth: Synth -> Channel?
            this.synth.disconnect();
            this.synth.connect(this.masterBuss);


            console.log('[AudioEngine] Effects Initialized');

            // Set default Transport settings
            Tone.Transport.bpm.value = 120;

            // Initialize Metronome
            // Use a Synth configured for a sharp "Woodblock" click
            this.metronomeSynth = new Tone.Synth({
                oscillator: { type: "sine" },
                envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 }
            }).toDestination();
            this.metronomeSynth.volume.value = -5; // Slightly louder to be audible

            // 1. Synced Metronome (for Playback/Recording)
            this.metronomePart = new Tone.Loop((time) => {
                const position = Tone.Transport.position;
                if (!position) return;
                const parts = position.split(':');
                if (parts.length < 2) return;
                const beat = parts[1];
                const isDownbeat = (beat === "0" || beat === 0);
                const note = isDownbeat ? "C6" : "C5";
                this.metronomeSynth.triggerAttackRelease(note, "32n", time);
            }, "4n").start(0);
            this.metronomePart.mute = true;

            // 2. Idle Metronome Logic (Clock)
            // Frequency = BPM / 60 (beats per second)
            this.idleMetronome = new Tone.Clock((time) => {
                // Determine downbeat by tracking ticks (approximate)
                const beatCount = this.idleMetronome.ticks;
                // Tone.Clock ticks are default 1 per callback? No, ticks based on frequency?
                // Actually callback is called at frequency.
                // We'll just toggle high/low based on simple count.
                // Note: This won't be perfectly phase-aligned with "Transport 0:0:0" but good enough for idle check.

                // Let's manually increment a counter
                const count = (this.idleTickCount || 0);
                const isDownbeat = (count % 4 === 0);
                const note = isDownbeat ? "C6" : "C5";
                this.metronomeSynth.triggerAttackRelease(note, "32n", time);

                this.idleTickCount = count + 1;
            }, Tone.Transport.bpm.value / 60);

            // Event Listeners to toggle between Idle and Synced
            Tone.Transport.on('start', () => {
                this.idleMetronome.stop();
            });

            Tone.Transport.on('stop', () => {
                if (this.isMetronomeOn) {
                    this.idleTickCount = 0; // Reset "beat"
                    this.idleMetronome.frequency.value = Tone.Transport.bpm.value / 60;
                    this.idleMetronome.start();
                }
            });
            Tone.Transport.on('pause', () => {
                if (this.isMetronomeOn) {
                    this.idleMetronome.frequency.value = Tone.Transport.bpm.value / 60;
                    this.idleMetronome.start();
                }
            });

            // Metronome State Tracker
            this.isMetronomeOn = false;

            // --- Recording Support ---
            // Create a MediaStreamDestination to capture audio output
            this.recordingDest = Tone.context.createMediaStreamDestination();
            this.masterBuss.connect(this.recordingDest);

            console.log('[AudioEngine] Metronome (Idle+Synced) & Recording initialized');

        } catch (error) {
            console.error('[AudioEngine] Error during init:', error);
            throw error;
        }
    }

    // Expose the audio stream for MediaRecorder
    getAudioStream() {
        if (!this.recordingDest) return null;
        return this.recordingDest.stream;
    }

    // ... (rest of methods)

    updateMixerTrack(trackIndex, params) {
        if (!this.channels || !this.channels[trackIndex]) return;

        const channel = this.channels[trackIndex];

        if (params.volume !== undefined) {
            let db = Tone.gainToDb(params.volume);
            if (params.volume <= 0.001) db = -Infinity;
            channel.volume.rampTo(db, 0.1);
        }

        if (params.pan !== undefined) {
            channel.pan.rampTo(params.pan, 0.1);
        }

        if (params.mute !== undefined) {
            channel.mute = params.mute;
        }

        if (params.solo !== undefined) {
            channel.solo = params.solo;
        }

        // Sends (0-1)
        if (params.sendA !== undefined && channel.sendA) {
            // Linear 0-1 to Gain directly? Or dB?
            // Usually sends are gain 0-1.
            channel.sendA.gain.rampTo(params.sendA, 0.1);
        }

        if (params.sendB !== undefined && channel.sendB) {
            channel.sendB.gain.rampTo(params.sendB, 0.1);
        }
    }

    updateEffectParams(type, params) {
        if (!this.isInitialized) return;

        if (type === 'reverb' && this.reverb) {
            if (params.decay !== undefined) this.reverb.decay = params.decay;
            if (params.preDelay !== undefined) this.reverb.preDelay = params.preDelay;
            // wet/mix is usually handled by send amount, but if we want global return level?
            // For now, assume fixed return level (Unity) and control via Send.
        }

        if (type === 'delay' && this.delay) {
            if (params.time !== undefined) this.delay.delayTime.rampTo(params.time, 0.1);
            if (params.feedback !== undefined) this.delay.feedback.rampTo(params.feedback, 0.1);
        }
    }

    getAudioData() {
        if (!this.analyser) return null;
        return this.analyser.getValue();
    }

    getFrequencyData() {
        if (!this.analyser) return new Uint8Array(0);
        const dbData = this.analyser.getValue(); // Float32Array in dB
        const byteData = new Uint8Array(dbData.length);
        for (let i = 0; i < dbData.length; i++) {
            let val = dbData[i];
            // Map -100dB to 0, -30dB to 255
            if (val === -Infinity) val = -100;
            val = (val + 100) * 3;
            if (val < 0) val = 0;
            if (val > 255) val = 255;
            byteData[i] = val;
        }
        return byteData;
    }

    setBpm(bpm) {
        if (!this.isInitialized) return;
        if (Tone.Transport && isFinite(bpm)) {
            Tone.Transport.bpm.value = bpm;
            // Update Idle Metronome frequency if it exists
            if (this.idleMetronome) {
                this.idleMetronome.frequency.value = bpm / 60;
            }
        }
    }

    setMetronome(isOn) {
        if (!this.isInitialized || !this.metronomePart) return;

        this.isMetronomeOn = isOn;
        this.metronomePart.mute = !isOn;

        // Handle Idle Metronome (When Transport is STOPPED)
        if (Tone.Transport.state !== 'started') {
            if (isOn) {
                this.idleTickCount = 0;
                if (this.idleMetronome) {
                    this.idleMetronome.frequency.value = Tone.Transport.bpm.value / 60;
                    this.idleMetronome.start();
                }
            } else {
                if (this.idleMetronome) this.idleMetronome.stop();
            }
        }
    }
}


export const audioEngine = new AudioEngine();
