import { create } from 'zustand';

const useStore = create((set) => ({
    // Transport State
    bpm: 120,
    isPlaying: false,
    isMetronomeOn: false,
    isRecording: false, // Global recording state
    setBpm: (bpm) => set({ bpm }),
    setIsPlaying: (isPlaying) => set({ isPlaying }),
    setIsMetronomeOn: (isOn) => set({ isMetronomeOn: isOn }),
    setIsRecording: (isRecording) => set({ isRecording }),

    // Synth State
    synthParams: {
        oscillatorType: 'triangle',
        envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 1 }
    },
    setSynthParams: (params) => set((state) => ({
        synthParams: { ...state.synthParams, ...params }
    })),

    // Auth State
    user: null,
    setUser: (user) => set({ user }),

    // Presets State
    presets: [],
    setPresets: (presets) => set({ presets }),

    // Audio Context State
    isAudioContextReady: false,
    setAudioContextReady: (isReady) => set({ isAudioContextReady: isReady }),

    // Pad State (Phase 1 mock data, will be dynamic later)
    // Mapping 64 pads (0-63) to sound files and settings
    padMappings: Array(64).fill(null).map((_, index) => ({
        id: index,
        key: null, // assigned key char (User mode mapping later)
        file: null, // path to audio file
        mode: 'one-shot', // Default mode
        volume: 0,
        type: 'sample', // 'sample' | 'synth'
        note: 'C4', // Default note
        color: null
    })),

    updatePadMapping: (id, newMapping) => set((state) => {
        const newMappings = [...state.padMappings];
        newMappings[id] = { ...newMappings[id], ...newMapping };
        return { padMappings: newMappings };
    }),

    resetPad: (id) => set((state) => {
        const newMappings = [...state.padMappings];
        newMappings[id] = {
            id: id,
            key: null,
            file: null,
            mode: 'one-shot',
            volume: 0,
            type: 'sample',
            note: 'C4',
            color: null,
            originalName: null,
            name: null,
            assetId: null
        };

        // Also clear active state just in case
        const newActivePads = { ...state.activePads };
        delete newActivePads[id];

        return {
            padMappings: newMappings,
            activePads: newActivePads
        };
    }),

    // Visual State for Pads (active or not)
    activePads: {}, // { 0: true, 1: false ... }
    setPadActive: (id, isActive) => set((state) => ({
        activePads: { ...state.activePads, [id]: isActive }
    })),

    // Pad Editing State
    editingPadId: null,
    setEditingPadId: (id) => set({ editingPadId: id }),

    // Loop/Track State
    tracks: [], // { id, name, isMuted, isSolo }
    addTrack: (track) => set((state) => ({ tracks: [...state.tracks, track] })),
    removeTrack: (id) => set((state) => ({ tracks: state.tracks.filter(t => t.id !== id) })),
    updateTrack: (id, updates) => set((state) => ({
        tracks: state.tracks.map(t => t.id === id ? { ...t, ...updates } : t)
    })),
    setTracks: (tracks) => set({ tracks }),

    // Global FX State
    effects: {
        reverb: { mix: 0, decay: 1.5 },
        delay: { mix: 0, time: 0.25, feedback: 0.5 }
    },
    setEffectParams: (type, params) => set((state) => ({
        effects: {
            ...state.effects,
            [type]: { ...state.effects[type], ...params }
        }
    })),

    // Bank Navigation State
    bankCoords: { x: 0, y: 0 }, // x: 0-1, y: 0-1
    moveBank: (dx, dy) => set((state) => {
        const newX = Math.max(0, Math.min(1, state.bankCoords.x + dx));
        const newY = Math.max(0, Math.min(1, state.bankCoords.y + dy));
        return { bankCoords: { x: newX, y: newY } };
    }),

    // Zoom UI State
    isZoomed: true, // Default to zoomed in view? Or false? Let's try true to match current feeling but better.
    setIsZoomed: (isZoomed) => set({ isZoomed }),
}));

export default useStore;
