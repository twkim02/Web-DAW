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
        if (effectItem) effectItem.effectNode.disconnect();

        // 2. Connect Chain
        if (effectItem) {
            instrument.connect(effectItem.effectNode);
            effectItem.effectNode.connect(outputNode);
            console.log(`[AudioChain] Pad ${padId}: Instrument -> ${effectItem.config.name} -> Track ${trackIndex}`);
        } else {
            instrument.connect(outputNode);
            console.log(`[AudioChain] Pad ${padId}: Instrument -> Track ${trackIndex}`);
        }
    }

    /**
     * Applies an insert effect to a specific pad
     * @param {number} padId 
     * @param {object} effectConfig { type, params, name }
     */
    applyEffect(padId, effectConfig) {
        console.log(`[InstrumentManager] Applying Effect on Pad ${padId}:`, effectConfig);

        // 1. Dispose old effect if exists
        const oldEffect = this.activeEffects.get(padId);
        if (oldEffect) {
            oldEffect.effectNode.disconnect();
            oldEffect.effectNode.dispose();
            this.activeEffects.delete(padId);
        }

        // 2. Create New Effect Node
        let effectNode;
        try {
            switch (effectConfig.type) {
                case 'distortion':
                    effectNode = new Tone.Distortion(effectConfig.params.distortion);
                    break;
                case 'bitcrusher':
                    effectNode = new Tone.BitCrusher(effectConfig.params.bits);
                    break;
                case 'chorus':
                    effectNode = new Tone.Chorus(effectConfig.params.frequency, effectConfig.params.delayTime, effectConfig.params.depth).start();
                    break;
                case 'phaser':
                    effectNode = new Tone.Phaser(effectConfig.params);
                    break;
                case 'autowah':
                    effectNode = new Tone.AutoWah(effectConfig.params.baseFrequency, effectConfig.params.octaves, effectConfig.params.sensitivity);
                    break;
                case 'chebyshev':
                    effectNode = new Tone.Chebyshev(effectConfig.params.order);
                    break;
                case 'tremolo':
                    effectNode = new Tone.Tremolo(effectConfig.params.frequency, effectConfig.params.depth).start();
                    break;
                case 'pitchshift':
                    effectNode = new Tone.PitchShift(effectConfig.params.pitch);
                    break;
                default:
                    console.warn('Unknown effect type:', effectConfig.type);
                    return;
            }
        } catch (e) {
            console.error('Error creating effect:', e);
            return;
        }

        // 3. Store and Reconnect
        if (effectNode) {
            this.activeEffects.set(padId, {
                effectNode: effectNode,
                config: effectConfig
            });
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
        const item = this.activeInstruments.get(padId);
        if (!item) return;
        if (item.type === 'drums') {
            this.trigger(padId, note);
            return;
        }
        if (item.instance.triggerAttack) item.instance.triggerAttack(note);
    }

    stopNote(padId, note) {
        const item = this.activeInstruments.get(padId);
        if (!item) return;
        if (item.instance.triggerRelease) item.instance.triggerRelease(note);
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
            this.recorder = new Tone.Recorder();
            instrument.connect(this.recorder);
            instrument.toDestination();
            this.previewInstance = instrument;
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
