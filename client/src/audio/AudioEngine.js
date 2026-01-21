import * as Tone from 'tone';
import useStore from '../store/useStore';

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

            // Master Buss (Must function before effects connect to it)
            this.masterBuss = new Tone.Gain(1).toDestination();

            // --- Analyser Setup (Visualizer) ---
            // Create a combined FFT/Waveform analyser or just FFT?
            // ThreeVisualizer uses getFrequencyData (FFT) and getTimeDomainData (Waveform).
            // Tone.Analyser default type is 'fft'. 
            // We need 'waveform' to get time domain? 
            // Actually Web Audio AnalyserNode does both always. Tone.Analyser wrapper might hide one.
            // Let's use specific Tone.Waveform and Tone.FFT? 
            // Or just access the raw node as I planned.
            // Let's instantiate a standard Tone.Analyser just to be safe and standard.
            this.analyser = new Tone.Analyser("fft", 256);
            this.masterBuss.connect(this.analyser);

            // Dedicated Waveform Node for 'circular_wave' visualizer
            this.waveform = new Tone.Waveform(256);
            this.masterBuss.connect(this.waveform);

            // Also enable time domain support if needed? 
            // Tone.Analyser with type="fft" still supports getByteTimeDomainData on the native node.
            // So we are good.

            // Initialize Global Send Inputs
            this.sendAInput = new Tone.Gain(1);
            this.sendBInput = new Tone.Gain(1);

            // Initial Default Chains (Matches Store)
            await this.updateGlobalChain('sendA', []);
            await this.updateGlobalChain('sendB', []);

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
                // Send A -> Global Chain A
                const sendAGain = new Tone.Gain(0);
                channel.connect(sendAGain);
                sendAGain.connect(this.sendAInput);
                channel.sendA = sendAGain;

                // Send B -> Global Chain B
                const sendBGain = new Tone.Gain(0);
                channel.connect(sendBGain);
                sendBGain.connect(this.sendBInput);
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

    // --- Global FX Chain Management ---

    async updateGlobalChain(bus, chainDefs) {
        // bus: 'sendA' or 'sendB'
        const inputNode = bus === 'sendA' ? this.sendAInput : this.sendBInput;

        // 1. Cleanup existing chain nodes for this bus
        if (this[`${bus}Nodes`]) {
            this[`${bus}Nodes`].forEach(node => {
                node.disconnect();
                node.dispose();
            });
        }
        this[`${bus}Nodes`] = [];

        // 2. Create new nodes
        const nodes = [];
        for (const def of chainDefs) {
            const node = await this.createEffectNode(def);
            if (node) nodes.push(node);
        }
        this[`${bus}Nodes`] = nodes;

        // 3. Connect Chain: Input -> Node1 -> Node2 ... -> Master
        inputNode.disconnect(); // Disconnect from previous destination

        if (nodes.length === 0) {
            // Empty chain? Connect input directly to master? Or consume? 
            // Usually empty send means no sound. But let's verify.
            // If empty, we probably shouldn't hear anything from the send.
            // So do nothing (disconnected).
            return;
        }

        let currentNode = inputNode;
        nodes.forEach(node => {
            currentNode.connect(node);
            currentNode = node;
        });

        // Final node connects to Master
        currentNode.connect(this.masterBuss);

        console.log(`[AudioEngine] Updated ${bus} chain with ${nodes.length} effects.`);
    }

    async createEffectNode(def) {
        const { type, params } = def;
        let node;

        switch (type) {
            case 'reverb':
                node = new Tone.Reverb({
                    decay: params.decay || 1.5,
                    preDelay: params.preDelay || 0.01,
                    wet: params.mix !== undefined ? params.mix : 1
                });
                await node.generate();
                break;
            case 'delay':
                node = new Tone.FeedbackDelay({
                    delayTime: params.delayTime || 0.25,
                    feedback: params.feedback || 0.5,
                    wet: params.mix !== undefined ? params.mix : 1
                });
                break;
            case 'distortion':
                node = new Tone.Distortion(params.distortion || 0.4);
                break;
            case 'bitcrusher':
                node = new Tone.BitCrusher(params.bits || 4);
                break;
            case 'eq3':
                node = new Tone.EQ3(params.low || 0, params.mid || 0, params.high || 0);
                break;
            case 'compressor':
                node = new Tone.Compressor(params.threshold || -24, params.ratio || 4);
                node.attack.value = params.attack || 0.003;
                node.release.value = params.release || 0.25;
                break;
            case 'flanger':
                node = new Tone.Flanger({
                    delayTime: params.delayTime || 0.005,
                    depth: params.depth || 0.1,
                    feedback: params.feedback || 0.1
                });
                break;
            case 'chorus':
                node = new Tone.Chorus(params.frequency || 4, params.delayTime || 2.5, params.depth || 0.5).start();
                break;
            case 'phaser':
                node = new Tone.Phaser({
                    frequency: params.frequency || 0.5,
                    octaves: params.octaves || 3,
                    baseFrequency: params.baseFrequency || 350
                });
                break;
            case 'pitchshift':
                node = new Tone.PitchShift(params.pitch || 0);
                break;
            case 'tremolo':
                node = new Tone.Tremolo(params.frequency || 10, params.depth || 0.5).start();
                break;
            case 'autowah':
                node = new Tone.AutoWah({
                    baseFrequency: params.baseFrequency || 100,
                    octaves: params.octaves || 6,
                    sensitivity: params.sensitivity || 0
                });
                break;
            case 'panner':
                node = new Tone.Panner(params.pan || 0);
                break;
            default:
                console.warn('Unknown effect type:', type);
                return null;
        }
        return node;
    }

    // Helper to update parameters of an existing chain node live (without rebuilding)
    updateGlobalEffectParam(bus, index, params) {
        if (!this[`${bus}Nodes`] || !this[`${bus}Nodes`][index]) return;
        const node = this[`${bus}Nodes`][index];

        // Map params to Tone.js properties
        // This repeats logic from createEffectNode but for setting values.
        // Simplified mapping:
        Object.keys(params).forEach(key => {
            const val = params[key];
            // Handle specific cases or direct assignment
            if (node[key] && node[key].value !== undefined) {
                // It's a signal
                node[key].rampTo(val, 0.1);
            } else if (node[key] !== undefined) {
                // It's a property
                node[key] = val;
            }

            // Special cases
            if (key === 'mix') node.wet.value = val;
            if (key === 'time') node.delayTime.value = val; // delay legacy
        });
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

    getTimeDomainData() {
        if (!this.waveform) return new Uint8Array(0);

        const values = this.waveform.getValue(); // Float32Array -1 to 1
        // Convert to Uint8 0-255 for consistency
        const byteData = new Uint8Array(values.length);
        for (let i = 0; i < values.length; i++) {
            byteData[i] = (values[i] + 1) * 127.5;
        }
        return byteData;
    }

    setBpm(bpm) {
        if (!this.isInitialized) return;
        if (Tone.Transport && isFinite(bpm)) {
            // 1. Set New BPM
            Tone.Transport.bpm.value = bpm;

            // 2. Resync / Restart Transport if Running
            // User Request: "Metronome should restart based on that beat"
            // This implies the grid should reset to 0 (Downbeat) immediately to match the new feeling.
            if (Tone.Transport.state === 'started') {
                // Option A: Reset Position to 0 (Jumps audio loops too?)
                // Yes, loops align to Transport. If we want loops to stay synced, we MUST reset transport.
                // This effectively "Re-launches" everything at the new tempo.
                Tone.Transport.position = "0:0:0";
            }

            // Update Idle Metronome frequency
            if (this.idleMetronome) {
                this.idleMetronome.frequency.value = bpm / 60;
            }
        }
    }

    setTimeSignature(ts) {
        if (!this.isInitialized) return;
        if (Tone.Transport && Array.isArray(ts)) {
            Tone.Transport.timeSignature = ts;
            console.log(`[AudioEngine] Time Signature set to ${ts[0]}/${ts[1]}`);
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

    /**
     * Starts Transport with a 1-Bar Count-in (Pre-roll)
     * Triggers Metronome Clicks manually before Transport starts.
     */
    async startWithCountIn() {
        if (Tone.Transport.state === 'started') return;

        console.log('[AudioEngine] Starting with Count-in...');

        // Ensure Audio Context
        if (Tone.context.state !== 'running') await Tone.start();

        // SET COUNT-IN FLAG
        useStore.getState().setIsCountIn(true);

        const bpm = Tone.Transport.bpm.value;
        const timeSignature = Tone.Transport.timeSignature;
        const beatsPerBar = Array.isArray(timeSignature) ? timeSignature[0] : (typeof timeSignature === 'number' ? timeSignature : 4);

        const beatDuration = 60 / bpm;
        const now = Tone.now();

        // 1. Schedule Pre-roll Clicks
        for (let i = 0; i < beatsPerBar; i++) {
            const time = now + (i * beatDuration);
            const isDownbeat = (i === 0);
            const note = isDownbeat ? "C6" : "C5";
            this.metronomeSynth.triggerAttackRelease(note, "32n", time);
        }

        // 2. Schedule Transport Start exactly after 1 bar
        const barDuration = beatDuration * beatsPerBar;
        Tone.Transport.start(now + barDuration);

        // 3. Clear Count-in Flag at Start
        // We schedule this on the Transport timeline at 0 so it flips exactly when music starts
        Tone.Transport.scheduleOnce(() => {
            useStore.getState().setIsCountIn(false);
            console.log('[AudioEngine] Count-in Complete. Transport Started.');
        }, 0);

        return barDuration * 1000;
    }

    toggleTransport() {
        if (Tone.Transport.state === 'started') {
            this.stopTransport();
            return 'stopped';
        } else {
            this.startWithCountIn();
            return 'started';
        }
    }

    stopTransport() {
        Tone.Transport.stop();
        useStore.getState().setIsCountIn(false); // Reset flag
        // Reset Idle Metronome handled by event listener
    }
}


export const audioEngine = new AudioEngine();
