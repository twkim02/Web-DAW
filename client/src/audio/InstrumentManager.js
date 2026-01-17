import * as Tone from 'tone';

// Instrument Definitions
import { SAMPLER_PRESETS } from './instruments/Samplers';
import { SYNTH_PRESETS } from './instruments/Synths';
import { DRUM_KITS, DRUM_NOTE_MAP } from './instruments/Drums';

class InstrumentManager {
    constructor() {
        this.activeInstruments = new Map(); // padId -> Instrument Instance
        this.destination = Tone.getDestination();
    }

    connectTo(node) {
        this.destination = node;
        // Reconnect all active instruments
        this.activeInstruments.forEach(inst => {
            if (inst.connect) inst.connect(this.destination);
        });
    }

    /**
     * Loads an instrument for a specific pad
     * @param {number} padId 
     * @param {string} instrumentType 'piano', 'synth', 'drums'
     * @param {string} presetId Specific preset name
     */
    async loadInstrument(padId, instrumentType, presetId) {
        this.unload(padId);
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
                instrument.connect(this.destination);
                this.activeInstruments.set(padId, {
                    type: finalType,
                    instance: instrument,
                    preset: presetId
                });
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

        // Apply extra effects if defined in preset (simplified for now)
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

    /**
     * Trigger a note on the pad's instrument
     * @param {number} padId 
     * @param {string} note 
     * @param {string} duration 
     */
    trigger(padId, note, duration = '8n') {
        const item = this.activeInstruments.get(padId);
        if (!item) return;

        const { type, instance } = item;

        if (type === 'piano' || type === 'synth') {
            // Polyphonic trigger
            instance.triggerAttackRelease(note, duration);
        } else if (type === 'drums') {
            const sample = DRUM_NOTE_MAP[note] || note; // Map C3->kick, or use 'kick' if passed directly
            if (instance.has(sample)) {
                instance.player(sample).start();
            }
        }
    }

    startNote(padId, note) {
        const item = this.activeInstruments.get(padId);
        if (!item) return;
        if (item.type === 'drums') {
            this.trigger(padId, note); // Drums just trigger
            return;
        }
        if (item.instance.triggerAttack) item.instance.triggerAttack(note);
    }

    stopNote(padId, note) {
        const item = this.activeInstruments.get(padId);
        if (!item) return;
        if (item.instance.triggerRelease) item.instance.triggerRelease(note);
    }

    async loadPreview(type, preset) {
        if (this.previewInstance) {
            this.previewInstance.dispose();
            this.previewInstance = null;
        }

        console.log(`[InstrumentManager] Loading Preview: ${type} (${preset})`);

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
            console.log(`[InstrumentManager] Triggering Drum: ${note} -> ${sample}`);

            if (this.previewInstance.has(sample)) {
                console.log(`[InstrumentManager] Sample found. Playing...`);
                this.previewInstance.player(sample).start();
            } else {
                console.warn(`[InstrumentManager] Sample NOT found: ${sample}`);
                console.log('Available samples:', this.previewInstance._players.keys()); // accessing internal map for debug
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
            if (this.previewInstance.has(sample)) {
                this.previewInstance.player(sample).start();
            }
        }
    }

    stopPreviewNote(note) {
        if (!this.previewInstance) return;
        if (this.previewInstance.triggerRelease) {
            this.previewInstance.triggerRelease(note);
        }
    }

    async startRecording() {
        if (this.recorder && this.recorder.state !== 'started') {
            console.log('[InstrumentManager] Recording Started...');
            this.recorder.start();
        }
    }

    async stopRecording() {
        if (this.recorder && this.recorder.state === 'started') {
            console.log('[InstrumentManager] Recording Stopped.');
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
