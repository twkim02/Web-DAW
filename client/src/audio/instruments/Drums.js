export const DRUM_KITS = {
    '808': {
        baseUrl: "https://tonejs.github.io/audio/drum-samples/Techno/",
        urls: {
            "kick": "kick.mp3",
            "snare": "snare.mp3",
            "hh_closed": "hihat.mp3",
            "hh_open": "hihat.mp3",    // Fallback
            "tom_low": "tom1.mp3",
            "tom_mid": "tom2.mp3",
            "tom_high": "tom3.mp3",
            "clap": "snare.mp3",       // Fallback
            "crash": "hihat.mp3",      // Fallback (Techno usually uses Noise/Cymbal)
            "ride": "hihat.mp3"        // Fallback
        }
    },
    'acoustic': {
        baseUrl: "https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/standard_drum_kit-mp3/",
        urls: {
            "kick": "36.mp3",       // Bass Drum 1
            "snare": "38.mp3",      // Acoustic Snare
            "hh_closed": "42.mp3",  // Closed Hi-Hat
            "hh_open": "46.mp3",    // Open Hi-Hat
            "tom_low": "41.mp3",    // Low Floor Tom
            "tom_mid": "45.mp3",    // Low-Mid Tom
            "tom_high": "48.mp3",   // Hi-Mid Tom
            "clap": "39.mp3",       // Hand Clap
            "crash": "49.mp3",      // Crash Cymbal 1
            "ride": "51.mp3"        // Ride Cymbal 1
        }
    },
    'kpr77': {
        baseUrl: "https://tonejs.github.io/audio/drum-samples/KPR77/",
        urls: {
            "kick": "kick.mp3",
            "snare": "snare.mp3",
            "hh_closed": "hihat.mp3",
            "hh_open": "hihat.mp3",
            "tom_low": "tom1.mp3",
            "tom_mid": "tom2.mp3",
            "tom_high": "tom3.mp3",
            "clap": "clap.mp3",
            "crash": "hihat.mp3", // Fallback
            "ride": "hihat.mp3"   // Fallback
        }
    },
    'cr78': {
        baseUrl: "https://tonejs.github.io/audio/drum-samples/CR78/",
        urls: {
            "kick": "kick.mp3",
            "snare": "snare.mp3",
            "hh_closed": "hihat.mp3",
            "hh_open": "hihat.mp3",
            "tom_low": "tom1.mp3",
            "tom_mid": "tom2.mp3",
            "tom_high": "tom3.mp3",
            "clap": "snare.mp3",
            "crash": "hihat.mp3",
            "ride": "hihat.mp3"
        }
    }
};

// Map Keyboard Notes (from VirtualDrums) to Sample Names
export const DRUM_NOTE_MAP = {
    // Row 1 (UIOP[)
    "U": "kick",
    "I": "snare",
    "O": "hh_closed",
    "P": "hh_open",
    "[": "crash",

    // Row 2 (HJKL')
    "H": "tom_low",
    "J": "tom_mid",
    "K": "tom_high",
    "L": "clap",
    "'": "ride",
};
