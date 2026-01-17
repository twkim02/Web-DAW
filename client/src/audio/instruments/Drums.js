export const DRUM_KITS = {
    '808': {
        baseUrl: "https://tonejs.github.io/audio/drum-samples/Techno/",
        urls: {
            "kick": "kick.mp3",
            "snare": "snare.mp3",
            "hh_closed": "hihat.mp3",
            "hh_open": "cymbal.mp3", // Techno kit doesn't have open hat, using cymbal
            "tom_low": "tom1.mp3",
            "tom_mid": "tom2.mp3",
            "tom_high": "tom3.mp3",
            "clap": "clap.mp3"
        }
    },
};

// Map Keyboard Notes (from VirtualDrums) to Sample Names
export const DRUM_NOTE_MAP = {
    // Row 1 (UIOP)
    "U": "kick",
    "I": "snare",
    "O": "hh_closed",
    "P": "hh_open",

    // Row 2 (HJKL)
    "H": "tom_low",
    "J": "tom_mid",
    "K": "tom_high",
    "L": "clap",
};
