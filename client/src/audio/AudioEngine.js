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
            Tone.context.lookAhead = 0.05; // Default is 0.1. Lowering for faster response.

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
        if (Tone.Transport && isFinite(bpm)) {
            Tone.Transport.bpm.value = bpm;
            console.log(`[AudioEngine] BPM updated to ${bpm}`);
        }
    }

    setMetronome(isOn) {
        if (this.metronomePart) {
            this.metronomePart.mute = !isOn;
            console.log(`[AudioEngine] Metronome ${isOn ? 'ON' : 'OFF'}`);

            // Ensure Transport is running if Metronome is ON? 
            // Usually Metronome only clicks when Transport is running.
            // We rely on Global Play/Stop for Transport.
        }
    }
}

export const audioEngine = new AudioEngine();
