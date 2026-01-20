import * as Tone from 'tone';
import { audioEngine } from './AudioEngine'; // Static Import

// Instrument Definitions
import { SAMPLER_PRESETS } from './instruments/Samplers';
import { SYNTH_PRESETS } from './instruments/Synths';
import { DRUM_KITS, DRUM_NOTE_MAP } from './instruments/Drums';

class InstrumentManager {
    constructor() {
        this.activeInstruments = new Map(); // padId -> Instrument Instance
        this.activeEffects = new Map(); // padId -> { effectNode, config }
        this.destination = Tone.getDestination();
    }

    connectTo(node) {
        this.destination = node;
        // Reconnect all active instruments (and their effects if present)
        this.activeInstruments.forEach((inst, padId) => {
            this.reconnectPadChain(padId);
        });
    }

    /**
     * Registers an instrument created externally (e.g. by Sampler.js)
     * allows InstrumentManager to control its FX chain.
     */
    registerInstrument(padId, type, instance) {
        console.log(`[InstrumentManager] Registering external ${type} for Pad ${padId}`);
        this.activeInstruments.set(padId, {
            type: type,
            instance: instance,
            preset: 'external'
        });

        // If there was a pending effect, apply it now
        if (this.activeEffects.has(padId)) {
            this.reconnectPadChain(padId);
        }
    }

    // Helper to wire Instrument -> [Effect] -> Destination/Channel
    reconnectPadChain(padId) {
        const item = this.activeInstruments.get(padId);
        if (!item) return;

        const instrument = item.instance;
        const effectItem = this.activeEffects.get(padId);
        const trackIndex = parseInt(padId) % 8;

        // Determine Final Destination (Mixer Channel or Global)
        let outputNode = this.destination;
        if (audioEngine && audioEngine.channels && audioEngine.channels[trackIndex]) {
            outputNode = audioEngine.channels[trackIndex];
        }

        // 1. Disconnect everything first to be safe
        instrument.disconnect();

        // Handle disconnection of existing chain/effect if needed
        const chain = this.activeEffects.get(padId);
        if (chain && Array.isArray(chain)) {
            try {
                // Disconnect the last node from destination
                if (chain.length > 0) chain[chain.length - 1].disconnect();
            } catch (e) { console.warn(e); }
        } else if (chain && chain.effectNode) {
            // Legacy fallback (shouldn't be hit mostly)
            chain.effectNode.disconnect();
        }

        // 2. Connect Chain
        // const chain = this.activeEffects.get(padId); // Reuse variable from above

        if (chain && Array.isArray(chain) && chain.length > 0) {
            // Instrument -> FX[0]
            instrument.connect(chain[0]);

            // FX[i] -> FX[i+1]
            for (let i = 0; i < chain.length - 1; i++) {
                chain[i].connect(chain[i + 1]);
            }

            // FX[last] -> Output
            chain[chain.length - 1].connect(outputNode);

            console.log(`[AudioChain] Pad ${padId}: Instrument -> [${chain.length} Effects] -> Track ${trackIndex}`);
        } else {
            instrument.connect(outputNode);
            // console.log(`[AudioChain] Pad ${padId}: Instrument -> Track ${trackIndex}`);
        }
    }

    /**
     * Applies an insert effect to a specific pad
     * @param {number} padId 
     * @param {object} effectConfig { type, params, name }
     */
    /**
     * Applies a chain of insert effects to a specific pad
     * @param {number} padId 
     * @param {Array} effectConfigs Array of { type, params, name }
     */
    applyEffectChain(padId, effectConfigs) {
        // console.log(`[InstrumentManager] Applying FX Chain on Pad ${padId}:`, effectConfigs);

        // 1. Dispose old effects
        const oldEffects = this.activeEffects.get(padId);
        if (oldEffects) {
            oldEffects.forEach(fx => {
                fx.disconnect();
                fx.dispose();
            });
            this.activeEffects.delete(padId);
        }

        if (!effectConfigs || effectConfigs.length === 0) {
            this.reconnectPadChain(padId);
            return;
        }

        // 2. Create New Effect Nodes
        const newChain = [];
        effectConfigs.forEach(config => {
            let effectNode;
            try {
                // Defensive: Ensure params exists
                const params = config.params || {};

                switch (config.type) {
                    case 'distortion':
                        effectNode = new Tone.Distortion(params.distortion);
                        break;
                    case 'bitcrusher':
                        effectNode = new Tone.BitCrusher(params.bits);
                        break;
                    case 'chorus':
                        effectNode = new Tone.Chorus(params.frequency, params.delayTime, params.depth).start();
                        break;
                    case 'phaser':
                        effectNode = new Tone.Phaser(params).start();
                        break;
                    case 'autowah':
                        effectNode = new Tone.AutoWah(params.baseFrequency, params.octaves, params.sensitivity);
                        break;
                    case 'chebyshev':
                        effectNode = new Tone.Chebyshev(params.order);
                        break;
                    case 'tremolo':
                        effectNode = new Tone.Tremolo(params.frequency, params.depth).start();
                        break;
                    case 'pitchshift':
                        effectNode = new Tone.PitchShift(params.pitch);
                        break;
                    case 'reverb':
                        // Use Freeverb or JCReverb for synchronous instantiation (Standard Reverb is async convolution)
                        effectNode = new Tone.Freeverb({
                            roomSize: (params.decay || 1.5) / 10, // approximate mapping
                            dampening: 3000
                        });
                        effectNode.wet.value = params.mix || 0.5;
                        break;
                    case 'eq3':
                        effectNode = new Tone.EQ3(params.low, params.mid, params.high);
                        break;
                    case 'panner':
                        effectNode = new Tone.Panner(params.pan || 0);
                        break;
                    case 'compressor':
                        effectNode = new Tone.Compressor({
                            threshold: params.threshold,
                            ratio: params.ratio,
                            attack: params.attack,
                            release: params.release
                        });
                        break;
                    case 'flanger':
                        effectNode = new Tone.Flanger({
                            delayTime: params.delayTime,
                            depth: params.depth,
                            feedback: params.feedback
                        }).start();
                        break;
                    default:
                        console.warn('Unknown effect type:', config.type);
                        return;
                }

                if (effectNode) {
                    newChain.push(effectNode);
                }

            } catch (e) {
                console.error('Error creating effect:', e);
            }
        });

        // 3. Store and Reconnect
        // Ensure activeEffects is set even if empty, but here we only set if chain > 0
        // Logic below handles empty:
        if (newChain.length > 0) {
            this.activeEffects.set(padId, newChain);
            this.reconnectPadChain(padId);
        } else {
            // If chain creation failed (e.g. all errors), ensure we reconnect without effects
            this.reconnectPadChain(padId);
        }
    }

    async loadInstrument(padId, instrumentType, presetId) {
        this.unload(padId); // Unload old instrument (and its effect? No, keep effect if just changing instrument?)
        // Currently unload() disposes instrument. 
        // Let's decide: Does changing instrument clear effect? Usually yes in simple samplers.
        // Let's keep effect for now to allow "Swap instrument, keep distortion".
        // But need to ensure `unload` doesn't kill effect if we want to keep it.
        // Actually, `unload` splits instrument from chain.

        console.log(`[InstrumentManager] Loading ${instrumentType} (${presetId}) for Pad ${padId}`);

        try {
            let instrument;
            let finalType = instrumentType;

            if (SAMPLER_PRESETS[presetId]) {
                instrument = await this.createSampler(SAMPLER_PRESETS[presetId]);
                finalType = 'sampler';
            } else if (SYNTH_PRESETS[presetId] || instrumentType === 'synth') {
                instrument = this.createSynth(presetId);
                finalType = 'synth';
            } else if (instrumentType === 'drums') {
                instrument = await this.createDrumKit(presetId);
                finalType = 'drums';
            }

            if (instrument) {
                this.activeInstruments.set(padId, {
                    type: finalType,
                    instance: instrument,
                    preset: presetId
                });

                // Wire it up!
                this.reconnectPadChain(padId);

                console.log(`[InstrumentManager] Loaded ${finalType} (${presetId})`);
            }
        } catch (err) {
            console.error(`[InstrumentManager] Failed to load instrument for Pad ${padId}`, err);
        }
    }

    async createSampler(config) {
        return new Promise((resolve, reject) => {
            const sampler = new Tone.Sampler({
                urls: config.urls,
                baseUrl: config.baseUrl,
                onload: () => resolve(sampler),
                onerror: (err) => reject(err)
            });
        });
    }

    createSynth(presetId) {
        const config = SYNTH_PRESETS[presetId] || SYNTH_PRESETS['default'];
        const synth = new Tone.PolySynth(Tone.Synth, config.params);
        if (config.volume) synth.volume.value = config.volume;
        return synth;
    }

    async createDrumKit(kitId) {
        const config = DRUM_KITS[kitId];
        if (!config) return null;

        return new Promise((resolve, reject) => {
            const players = new Tone.Players({
                urls: config.urls,
                baseUrl: config.baseUrl,
                onload: () => resolve(players),
                onerror: (err) => reject(err)
            });
        });
    }

    trigger(padId, note, duration = '8n', time) {
        // --- MUTE / SOLO CHECK ---
        const col = padId % 8;
        const state = useStore.getState();
        const { solo, mute } = state.trackStates;

        const isSoloActive = solo.some(s => s);
        const isSelfSoloed = solo[col];
        const isSelfMuted = mute[col];

        if (isSoloActive) {
            if (!isSelfSoloed) return;
        } else {
            if (isSelfMuted) return;
        }

        const item = this.activeInstruments.get(padId);
        if (!item) return;
        const { type, instance } = item;

        if (type === 'piano' || type === 'synth') {
            instance.triggerAttackRelease(note, duration, time);
        } else if (type === 'drums') {
            const sample = DRUM_NOTE_MAP[note] || note;
            if (instance.has(sample)) instance.player(sample).start(time);
        }
    }

    startNote(padId, note) {
        // --- MUTE / SOLO CHECK ---
        const col = padId % 8;
        const state = useStore.getState();
        const { solo, mute } = state.trackStates;

        const isSoloActive = solo.some(s => s);
        const isSelfSoloed = solo[col];
        const isSelfMuted = mute[col];

        if (isSoloActive) {
            if (!isSelfSoloed) return;
        } else {
            if (isSelfMuted) return;
        }

        const item = this.activeInstruments.get(padId);
        if (!item) return;
        if (item.type === 'drums') {
            // No-op for now for drums in this method, used for visuals mostly
        } else {
            item.instance.triggerAttack(note);
        }
    }

    stopNote(padId, note) {
        const item = this.activeInstruments.get(padId);
        if (!item) return;
        if (item.type !== 'drums') {
            item.instance.triggerRelease(note);
        }
    }

    // DRUM TUNING
    tuneDrum(padId, sampleName, params) {
        const item = this.activeInstruments.get(padId);
        if (!item || item.type !== 'drums') return;

        const player = item.instance.player(sampleName);
        if (!player) return;

        if (params.volume !== undefined) player.volume.value = params.volume;
        if (params.pitch !== undefined) player.detune.value = params.pitch * 100; // semitones to cents -- FIXED: use .value
    }

    // Preview Tuning
    tunePreviewDrum(sampleName, params) {
        if (!this.previewInstance || this.previewType !== 'drums') return;

        try {
            const player = this.previewInstance.player(sampleName);
            if (player) {
                if (params.volume !== undefined) player.volume.value = params.volume;
                if (params.pitch !== undefined) player.detune.value = params.pitch * 100; // FIXED: use .value
            }
        } catch (e) { console.warn("Preview Tune Error", e); }
    }
    unload(padId) {
        // Unload Instrument
        const item = this.activeInstruments.get(padId);
        if (item) {
            item.instance.dispose();
            this.activeInstruments.delete(padId);
        }

        // OPTIONAL: Decide if we unload effect too?
        // For now, let's KEEP effects when unloading instrument, 
        // to support "Replace Sample" without losing FX.
        // Only explicitly remove effect via UI or specific method.
    }

    // Call this if user explicitly clears pad or effect
    removeEffect(padId) {
        const oldEffect = this.activeEffects.get(padId);
        if (oldEffect) {
            oldEffect.effectNode.disconnect();
            oldEffect.effectNode.dispose();
            this.activeEffects.delete(padId);
            this.reconnectPadChain(padId); // Reconnect instrument directly to output
        }
    }

    /**
     * Re-evaluates routing for all active instruments.
     * Call this after AudioEngine is initialized to ensure everything connects to the Mixer.
     */
    refreshRouting() {
        console.log('[InstrumentManager] Refreshing Routing for all instruments...');
        this.activeInstruments.forEach((_, padId) => {
            this.reconnectPadChain(padId);
        });
    }

    // ... Preview methods unchanged ...
    async loadPreview(type, preset) {
        if (this.previewInstance) {
            this.previewInstance.dispose();
            this.previewInstance = null;
        }
        // Dispose old effects if any
        if (this.previewReverb) { this.previewReverb.dispose(); this.previewReverb = null; }
        if (this.previewDistortion) { this.previewDistortion.dispose(); this.previewDistortion = null; }

        let instrument;
        if (SAMPLER_PRESETS[preset]) {
            instrument = await this.createSampler(SAMPLER_PRESETS[preset]);
            this.previewType = 'sampler';
        } else if (type === 'synth') {
            instrument = this.createSynth(preset);
            this.previewType = 'synth';
        } else if (type === 'drums') {
            instrument = await this.createDrumKit(preset);
            this.previewType = 'drums';
        }

        if (instrument) {
            // Create Effects
            this.previewDistortion = new Tone.Distortion(0).toDestination();
            this.previewReverb = new Tone.Reverb({ decay: 2, 湿: 0 }).toDestination(); // typo intended wet: 0, waiting for generate
            // Actually use correct params
            this.previewReverb = new Tone.Reverb({ decay: 2, wet: 0 }).toDestination();
            // Tone.Reverb is async to generate impulse, might need await if using non-convolution? 
            // Tone.Reverb (not Freeverb) generates impulse. start() needed? No, standard Reverb needs generate()
            // Let's use Freeverb for simplicity/speed in preview or just simple Reverb without waiting?
            // Tone.js Reverb: "The reverb will not be ready until audioContext.resume() and Reverb.generate() have been called"
            // Let's use JCReverb or Freeverb for instant availability in preview to avoid complexity.
            this.previewReverb = new Tone.Freeverb({ roomSize: 0.7, dampening: 3000 }).toDestination();
            this.previewReverb.wet.value = 0;

            this.previewDistortion = new Tone.Distortion(0).toDestination();

            this.recorder = new Tone.Recorder();

            // Build Chain: Inst -> Dist -> Reverb -> Recorder -> Dest
            // Actually: Inst -> Dist -> Reverb -> [Recorder, Dest]
            // Correction: Connect in series.

            instrument.disconnect(); // Disconnect from default destination if any

            // Inst -> Distortion
            instrument.connect(this.previewDistortion);

            // Distortion -> Reverb
            this.previewDistortion.connect(this.previewReverb);

            // Reverb -> Recorder
            this.previewReverb.connect(this.recorder);
            // Reverb -> Destination (already done by toDestination() above? No, checking docs.)
            // .toDestination() connects to master.
            // If we chain, we only want the LAST one to connect to destination usually, or manual.

            // Let's be explicit:
            this.previewDistortion.disconnect();
            this.previewReverb.disconnect();

            instrument.connect(this.previewDistortion);
            this.previewDistortion.connect(this.previewReverb);
            this.previewReverb.connect(this.recorder);
            this.previewReverb.connect(Tone.Destination); // Hear it

            this.previewInstance = instrument;
        }
    }

    // Control Preview Effects
    tunePreviewEffect(type, value) {
        // value: 0 to 1
        if (type === 'reverb' && this.previewReverb) {
            this.previewReverb.wet.value = value; // 0=Dry, 1=Wet
        }
        else if (type === 'distortion' && this.previewDistortion) {
            this.previewDistortion.distortion = value; // 0=Clean, 1=Distorted
        }
    }

    triggerPreview(note, duration = '8n') {
        if (!this.previewInstance) return;
        if (Tone.context.state !== 'running') Tone.start();

        if (this.previewType === 'sampler' || this.previewType === 'piano' || this.previewType === 'synth') {
            this.previewInstance.triggerAttackRelease(note, duration);
        } else if (this.previewType === 'drums') {
            const sample = DRUM_NOTE_MAP[note] || note;
            if (this.previewInstance.has(sample)) {
                this.previewInstance.player(sample).start();
            }
        }
    }

    startPreviewNote(note) {
        if (!this.previewInstance) return;
        if (Tone.context.state !== 'running') Tone.start();
        if (this.previewType === 'sampler' || this.previewType === 'piano' || this.previewType === 'synth') {
            if (this.previewInstance.triggerAttack) this.previewInstance.triggerAttack(note);
        } else if (this.previewType === 'drums') {
            const sample = DRUM_NOTE_MAP[note] || note;
            if (this.previewInstance.has(sample)) this.previewInstance.player(sample).start();
        }
    }

    stopPreviewNote(note) {
        if (!this.previewInstance) return;
        if (this.previewInstance.triggerRelease) this.previewInstance.triggerRelease(note);
    }

    async startRecording() {
        if (this.recorder && this.recorder.state !== 'started') {
            this.recorder.start();
        }
    }

    async stopRecording() {
        if (this.recorder && this.recorder.state === 'started') {
            const blob = await this.recorder.stop();
            return blob;
        }
        return null;
    }

    closePreview() {
        if (this.previewInstance) {
            this.previewInstance.dispose();
            this.previewInstance = null;
        }
        if (this.recorder) {
            this.recorder.dispose();
            this.recorder = null;
        }
    }
}

export const instrumentManager = new InstrumentManager();
