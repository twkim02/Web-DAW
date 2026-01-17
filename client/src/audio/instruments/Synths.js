export const SYNTH_PRESETS = {
    'default': {
        params: {
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 1 }
        },
        volume: -10
    },
    'saw_lead': {
        params: {
            oscillator: { type: 'fatsawtooth', count: 3, spread: 30 },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.4 }
        },
        volume: -8
    },
    'square_bass': {
        params: {
            oscillator: { type: 'square' },
            envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.2 }
        },
        volume: -6
    },
    'soft_pad': {
        params: {
            oscillator: { type: 'sine' },
            envelope: { attack: 1, decay: 2, sustain: 0.8, release: 3 }
        },
        volume: -12
    },
    'electric_piano': {
        params: {
            oscillator: { type: 'sine' },
            envelope: { attack: 0.01, decay: 1.5, sustain: 0.2, release: 0.8 },
            portamento: 0
        },
        volume: -5
    },
    'strings': {
        params: {
            oscillator: { type: 'fmsawtooth', modulationType: 'sine', modulationIndex: 3, harmonicity: 1 },
            envelope: { attack: 0.5, decay: 0.5, sustain: 1, release: 1.5 },
        },
        volume: -10
    },
    'brass': {
        params: {
            oscillator: { type: 'sawtooth' },
            envelope: { attack: 0.1, decay: 0.3, sustain: 0.7, release: 0.5 },
            filterEnvelope: { attack: 0.05, decay: 0.2, sustain: 0.5, baseFrequency: 2000, octaves: 2 }
        },
        volume: -8
    },
    'chiptune': {
        params: {
            oscillator: { type: 'square' },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.01 }
        },
        volume: -10
    }
};
