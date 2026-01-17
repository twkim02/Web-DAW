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

    // Virtual Instrument State
    playingPadId: null,
    setPlayingPadId: (id) => set({ playingPadId: id }),

    // Preview Mode
    previewMode: { isOpen: false, type: null, preset: null },
    setPreviewMode: (isOpen, type = null, preset = null) => set({
        previewMode: { isOpen, type, preset }
    }),

    // Library Refresh
    lastLibraryUpdate: 0,
    triggerLibraryRefresh: () => set({ lastLibraryUpdate: Date.now() }),

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
    isZoomed: true,
    setIsZoomed: (isZoomed) => set({ isZoomed }),

    // Launchpad View Mode
    viewMode: 'SESSION', // 'SESSION', 'NOTE', 'MIXER_SELECTION', 'VOLUME', 'PAN', 'MUTE', 'SOLO', 'REC'
    setViewMode: (mode) => set({ viewMode: mode }),

    // Mixer State (8 tracks corresponding to 8 columns)
    mixerLevels: {
        vol: Array(8).fill(0.8), // 0-1
        pan: Array(8).fill(0),   // -1 to 1
        sendA: Array(8).fill(0),
        sendB: Array(8).fill(0)
    },
    trackStates: {
        mute: Array(8).fill(false),
        solo: Array(8).fill(false),
        arm: Array(8).fill(false)
    },

    setMixerLevel: (type, index, value) => set((state) => {
        const newLevels = [...state.mixerLevels[type]];
        newLevels[index] = value;
        return { mixerLevels: { ...state.mixerLevels, [type]: newLevels } };
    }),

    toggleTrackState: (type, index) => set((state) => {
        const newStates = [...state.trackStates[type]];
        newStates[index] = !newStates[index];
        return { trackStates: { ...state.trackStates, [type]: newStates } };
    }),
}));

export default useStore;
