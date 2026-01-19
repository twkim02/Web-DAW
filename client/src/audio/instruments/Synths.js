export const SYNTH_PRESETS = {
    // --- DEFAULTS ---
    'default': {
        params: {
            oscillator: { type: 'triangle' },
            envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 1 }
        },
        volume: -10
    },

    // --- BASS ---
    'bass_square': {
        params: {
            oscillator: { type: 'square' },
            envelope: { attack: 0.01, decay: 0.2, sustain: 0, release: 0.2 }
        },
        volume: -6
    },
    'bass_sub': {
        params: {
            oscillator: { type: 'sine' },
            envelope: { attack: 0.05, decay: 0.2, sustain: 0.8, release: 1.5 }
        },
        volume: -2
    },
    'bass_acid': {
        params: {
            oscillator: { type: 'sawtooth' },
            envelope: { attack: 0.01, decay: 0.5, sustain: 0.1, release: 0.5 },
            filterEnvelope: { attack: 0.01, decay: 0.3, sustain: 0.1, baseFrequency: 300, octaves: 4, exponent: 2 }
        },
        volume: -8
    },
    'bass_reese': {
        params: {
            oscillator: { type: 'fatsawtooth', count: 3, spread: 20 },
            envelope: { attack: 0.1, decay: 0.5, sustain: 1, release: 2 }
        },
        volume: -6
    },
    'bass_slap': {
        params: {
            oscillator: { type: 'square' },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 }
        },
        volume: -6
    },

    // --- LEADS ---
    'lead_saw': {
        params: {
            oscillator: { type: 'fatsawtooth', count: 3, spread: 30 },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.4 }
        },
        volume: -8
    },
    'lead_pulse': {
        params: {
            oscillator: { type: 'pulse', width: 0.4 },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.8, release: 1 }
        },
        volume: -8
    },
    'lead_sync': {
        params: {
            oscillator: { type: 'fmsquare', modulationType: 'sawtooth', modulationIndex: 3, harmonicity: 3.5 },
            envelope: { attack: 0.05, decay: 0.2, sustain: 0.5, release: 1 }
        },
        volume: -7
    },
    'lead_theremin': {
        params: {
            oscillator: { type: 'sine' },
            envelope: { attack: 0.5, decay: 0, sustain: 1, release: 1 },
            portamento: 0.2
        },
        volume: -8
    },

    // --- KEYS / PIANO ---
    'keys_epiano': {
        params: {
            oscillator: { type: 'sine' },
            envelope: { attack: 0.01, decay: 1.5, sustain: 0.2, release: 0.8 },
            portamento: 0
        },
        volume: -5
    },
    'keys_organ': {
        params: {
            oscillator: { type: 'fatcustom', partials: [1, 0, 1, 0, 0.5], spread: 0 },
            envelope: { attack: 0.01, decay: 0.2, sustain: 0.9, release: 0.1 }
        },
        volume: -10
    },
    'keys_fm': {
        params: {
            oscillator: { type: 'fmsine', modulationType: 'sine', modulationIndex: 10, harmonicity: 3 },
            envelope: { attack: 0.01, decay: 0.5, sustain: 0.2, release: 2 }
        },
        volume: -8
    },
    'keys_vibes': {
        params: {
            oscillator: { type: 'amtriangle', harmonicity: 1, modulationType: 'sine' },
            envelope: { attack: 0.01, decay: 1.5, sustain: 0, release: 1.5 }
        },
        volume: -8
    },

    // --- PADS ---
    'pad_soft': {
        params: {
            oscillator: { type: 'sine' },
            envelope: { attack: 1, decay: 2, sustain: 0.8, release: 3 }
        },
        volume: -12
    },
    'pad_space': {
        params: {
            oscillator: { type: 'fatcustom', partials: [0.5, 1, 0.5], spread: 40 },
            envelope: { attack: 2, decay: 3, sustain: 0.6, release: 4 }
        },
        volume: -15
    },
    'pad_glass': {
        params: {
            oscillator: { type: 'fmtriangle', modulationType: 'sine', modulationIndex: 5, harmonicity: 5 },
            envelope: { attack: 1.5, decay: 1, sustain: 0.7, release: 3 }
        },
        volume: -12
    },
    'pad_warm': {
        params: {
            oscillator: { type: 'fatsawtooth', count: 2, spread: 20 },
            envelope: { attack: 0.5, decay: 1, sustain: 0.8, release: 2 },
            filterEnvelope: { attack: 0.5, baseFrequency: 400, octaves: 3 }
        },
        volume: -10
    },

    // --- ORCHESTRAL / WIND ---
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

    // --- FX / MISC ---
    'fx_chiptune': {
        params: {
            oscillator: { type: 'square' },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.01 }
        },
        volume: -10
    },
    'fx_laser': {
        params: {
            oscillator: { type: 'sawtooth' },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 },
            filterEnvelope: { attack: 0.001, decay: 0.1, sustain: 0, baseFrequency: 500, octaves: 8, exponent: 4 }
        },
        volume: -10
    },
    'fx_drop': {
        params: {
            oscillator: { type: 'sine' },
            envelope: { attack: 0.01, decay: 1, sustain: 0, release: 0.5 },
            pitchDecay: 0.5,
            octaves: 4
        },
        volume: -5
    },
    'percussion_wood': {
        params: {
            oscillator: { type: 'fmsine', modulationType: 'square', modulationIndex: 20, harmonicity: 3 },
            envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.1 }
        },
        volume: -5
    },

    // --- NEW PRESETS ---
    'supersaw': {
        params: {
            oscillator: { type: 'fatsawtooth', count: 3, spread: 30 },
            envelope: { attack: 0.01, decay: 0.1, sustain: 1, release: 0.5 }
        },
        volume: -10
    },
    'pluck_sine': {
        params: {
            oscillator: { type: 'sine' },
            envelope: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.3 }
        },
        volume: -5
    },
    'bell_fm': {
        params: {
            oscillator: { type: 'fmsine', modulationType: 'sine', modulationIndex: 10, harmonicity: 1.5 },
            envelope: { attack: 0.01, decay: 1.0, sustain: 0, release: 1.0 }
        },
        volume: -8
    },
    'lead_retro': {
        params: {
            oscillator: { type: 'square' },
            envelope: { attack: 0.05, decay: 0.2, sustain: 0.8, release: 0.5 },
            portamento: 0.1
        },
        volume: -8
    }
};
