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
    // Mapping 16 pads (0-15) to sound files and settings
    padMappings: Array(16).fill(null).map((_, index) => ({
        id: index,
        key: null, // assigned key char
        file: null, // path to audio file
        mode: index === 1 ? 'gate' : index === 2 ? 'toggle' : 'one-shot', // Demo: Pad 0=One-shot, Pad 1=Gate, Pad 2=Toggle
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
}));

export default useStore;
