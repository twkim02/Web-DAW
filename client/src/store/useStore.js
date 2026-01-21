import { create } from 'zustand';

const useStore = create((set) => ({
    // Transport State
    bpm: 120,
    timeSignature: [4, 4], // Default 4/4
    isPlaying: false,
    isCountIn: false, // New state for Count-in phase
    isMetronomeOn: false,
    isRecording: false, // Live Mode Video Recording
    setIsRecording: (isRecording) => set({ isRecording }),
    isLoopRecording: false, // Sequencer Loop Recording
    setIsLoopRecording: (isLoopRecording) => set({ isLoopRecording }),
    launchQuantization: '1m', // Default to 1 Bar for Loop Station workflow
    setBpm: (bpm) => set({ bpm }),
    setTimeSignature: (ts) => set({ timeSignature: ts }),
    setIsPlaying: (isPlaying) => set({ isPlaying }),
    setIsCountIn: (isCountIn) => set({ isCountIn }),
    setIsMetronomeOn: (isOn) => set({ isMetronomeOn: isOn }),
    setLaunchQuantization: (val) => set({ launchQuantization: val }),

    // Visualizer State
    showVisualizer: true,
    visualizerMode: 'default', // 'default', 'particles', 'circular_wave', 'bass', 'rainbow', 'gradient'
    setShowVisualizer: (show) => set({ showVisualizer: show }),
    setVisualizerMode: (mode) => set({ visualizerMode: mode }),

    // Global FX State (Reverb, Delay)
    // We already have 'effects' slice, but need to ensure it's loaded from presets.

    // Preset Actions
    deletePreset: (id) => set((state) => ({
        presets: state.presets.filter(p => p.id !== id)
    })),

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

    // Current Loaded Preset ID (for asset filtering)
    currentPresetId: null,
    setCurrentPresetId: (id) => set({ currentPresetId: id }),

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
        color: null,
        chokeGroup: null // 1, 2, 3, 4
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
            assetId: null,
            graphicAssetId: null,
            image: null,
            chokeGroup: null
        };

        // Clear active active state
        const newActivePads = { ...state.activePads };
        delete newActivePads[id];

        // REMOVE FROM QUEUE
        const col = id % 8;
        const newQueues = [...state.padQueues];
        // Filter out this specific ID from the column's queue
        if (newQueues[col]) {
            newQueues[col] = newQueues[col].filter(queuedId => queuedId !== id);
        }

        // Rebuild queuedPads Set
        const newQueuedPads = new Set();
        newQueues.forEach(q => q.forEach(pId => newQueuedPads.add(pId)));

        return {
            padMappings: newMappings,
            activePads: newActivePads,
            padQueues: newQueues,
            queuedPads: newQueuedPads
        };
    }),

    // Visual State for Pads (active or not)
    activePads: {}, // { 0: true, 1: false ... } for logical playback
    setPadActive: (id, isActive) => set((state) => ({
        activePads: { ...state.activePads, [id]: isActive }
    })),

    // Visual FX State (Temporary colors/lighting)
    visualStates: {}, // { 0: { color: '#f00' }, 1: null }
    setVisualState: (id, stateData) => set((state) => ({
        visualStates: { ...state.visualStates, [id]: stateData }
    })),

    triggerVisualEffect: (centerId, effect, color) => {
        if (!effect || effect === 'none' || effect === 'pulse' || effect === 'flash') return;

        const row = Math.floor(centerId / 8);
        const col = centerId % 8;
        const DELAY_STEP = 60;
        const LIGHT_DURATION = 200;
        const sourceColor = color || '#00ffcc';

        const lightUp = (ids, delay) => {
            setTimeout(() => {
                ids.forEach(id => {
                    if (id >= 0 && id < 64) {
                        set((state) => ({
                            visualStates: { ...state.visualStates, [id]: { color: sourceColor } }
                        }));
                        setTimeout(() => {
                            set((state) => ({
                                visualStates: { ...state.visualStates, [id]: null }
                            }));
                        }, LIGHT_DURATION);
                    }
                });
            }, delay);
        };

        if (effect === 'cross') {
            for (let i = 0; i < 8; i++) {
                if (i !== row) lightUp([i * 8 + col], Math.abs(i - row) * DELAY_STEP * 0.5);
                if (i !== col) lightUp([row * 8 + i], Math.abs(i - col) * DELAY_STEP * 0.5);
            }
        } else if (effect === 'ripple') {
            const MAX_RADIUS = 10;
            for (let r = 1; r <= MAX_RADIUS; r++) {
                const ringPads = [];
                for (let c = col - r; c <= col + r; c++) {
                    if (c >= 0 && c < 8 && (row - r) >= 0) ringPads.push((row - r) * 8 + c);
                    if (c >= 0 && c < 8 && (row + r) < 8) ringPads.push((row + r) * 8 + c);
                }
                for (let ro = row - r + 1; ro <= row + r - 1; ro++) {
                    if (ro >= 0 && ro < 8 && (col - r) >= 0) ringPads.push(ro * 8 + (col - r));
                    if (ro >= 0 && ro < 8 && (col + r) < 8) ringPads.push(ro * 8 + (col + r));
                }
                if (ringPads.length > 0) lightUp(ringPads, r * DELAY_STEP);
            }
        }
    },

    // Pad Editing State
    editingPadId: null,
    setEditingPadId: (id) => set({ editingPadId: id }),

    // Virtual Instrument State
    playingPadId: null,
    setPlayingPadId: (id) => set({ playingPadId: id }),

    // --- Pad Queueing (Reserved State) ---
    // Queues per column: { 0: [padId, ...], 1: [] ... }
    padQueues: Array(8).fill(null).map(() => []),
    // Visual helper: Set of IDs that are queued
    queuedPads: new Set(),

    addToQueue: (padId) => set((state) => {
        const col = padId % 8;
        const newQueues = [...state.padQueues];
        // Avoid duplicates in queue? User said "queue", implying multiples. FIFO.
        // If already in queue, ignore? Or add again? Usually repeat is allowed.
        newQueues[col] = [...newQueues[col], padId];

        const newQueuedPads = new Set(state.queuedPads);
        newQueuedPads.add(padId);

        return { padQueues: newQueues, queuedPads: newQueuedPads };
    }),

    shiftQueue: (col) => set((state) => {
        const newQueues = [...state.padQueues];
        const queue = newQueues[col];
        if (queue.length === 0) return {}; // No change

        const [nextPadId, ...remaining] = queue;
        newQueues[col] = remaining;

        // Update visual set: Check if nextPadId is still in ANY queue (unlikely unique ID per queue entry, but ID is unique pad).
        // Since ID is unique to pad, if it's no longer in queue, remove from set.
        // Exception: If same pad queued twice? "queuedPads" just means "is strictly waiting".
        // Rebuild Set from all queues is safest but expensive.
        // Simpler: Just rebuild for this column? 
        // Let's just Rebuild Set entirely to be safe and simple.
        const newSet = new Set();
        newQueues.forEach(q => q.forEach(id => newSet.add(id)));

        return { padQueues: newQueues, queuedPads: newSet };
    }),

    clearQueue: (col) => set((state) => {
        const newQueues = [...state.padQueues];
        newQueues[col] = [];

        const newSet = new Set();
        newQueues.forEach(q => q.forEach(id => newSet.add(id)));

        return { padQueues: newQueues, queuedPads: newSet };
    }),

    removeFromQueue: (col, padId) => set((state) => {
        const newQueues = [...state.padQueues];
        if (newQueues[col]) {
            newQueues[col] = newQueues[col].filter(id => id !== padId);
        }

        const newSet = new Set();
        newQueues.forEach(q => q.forEach(id => newSet.add(id)));

        return { padQueues: newQueues, queuedPads: newSet };
    }),

    // Preview Mode
    previewMode: { isOpen: false, type: null, preset: null },
    setPreviewMode: (isOpen, type = null, preset = null) => set({
        previewMode: { isOpen, type, preset }
    }),

    // Library Refresh
    lastLibraryUpdate: 0,
    triggerLibraryRefresh: () => set({ lastLibraryUpdate: Date.now() }),

    // Loop/Track State
    // Slots: 0-5 (6 total)
    loopSlots: Array(6).fill({ status: 'empty' }), // status: 'empty', 'recording', 'playing', 'stopped'
    setLoopSlotStatus: (index, status) => set((state) => {
        const newSlots = [...state.loopSlots];
        newSlots[index] = { ...newSlots[index], status };
        return { loopSlots: newSlots };
    }),

    // Instruction Modal
    isInstructionOpen: false,
    setIsInstructionOpen: (isOpen) => set({ isInstructionOpen: isOpen }),

    // Mixer Selection Logic
    selectedMixerTrack: 0, // 0-7
    setSelectedMixerTrack: (index) => set({ selectedMixerTrack: index }),

    tracks: [], // Legacy tracks (keep for compatibility if needed, but Slots will use internal Sequencer mapping)
    addTrack: (track) => set((state) => ({ tracks: [...state.tracks, track] })),
    removeTrack: (id) => set((state) => ({ tracks: state.tracks.filter(t => t.id !== id) })),
    updateTrack: (id, updates) => set((state) => ({
        tracks: state.tracks.map(t => t.id === id ? { ...t, ...updates } : t)
    })),
    setTracks: (tracks) => set({ tracks }),

    // Global FX State
    // Global FX State (Modular Chains)
    effects: {
        sendA: [],
        sendB: []
    },
    updateGlobalEffectChain: (bus, newChain) => set((state) => ({
        effects: {
            ...state.effects,
            [bus]: newChain
        }
    })),
    // specific param update helper (optional, or just use chain replacement)
    setGlobalEffectParam: (bus, index, params) => set((state) => {
        const chain = [...state.effects[bus]];
        if (!chain[index]) return {};
        chain[index] = { ...chain[index], params: { ...chain[index].params, ...params } };
        return { effects: { ...state.effects, [bus]: chain } };
    }),

    // Bank Navigation State
    bankCoords: { x: 0, y: 0 }, // x: 0-1, y: 0-1
    moveBank: (dx, dy) => set((state) => {
        const newX = Math.max(0, Math.min(1, state.bankCoords.x + dx));
        const newY = Math.max(0, Math.min(1, state.bankCoords.y + dy));
        return { bankCoords: { x: newX, y: newY } };
    }),

    // Zoom UI State
    isZoomed: false,
    setIsZoomed: (isZoomed) => set({ isZoomed }),

    // Launchpad View Mode
    viewMode: 'SESSION', // 'SESSION', 'NOTE', 'MIXER_SELECTION', 'VOLUME', 'PAN', 'MUTE', 'SOLO', 'REC'
    setViewMode: (mode) => set({ viewMode: mode }),

    // --- Theme State ---
    currentThemeId: 'cosmic',
    setThemeId: (id) => set({ currentThemeId: id }),

    // Custom Background State
    customBackgroundImage: null,
    setCustomBackgroundImage: (url) => set({ customBackgroundImage: url }),


    // --- Sidebar State ---
    isLeftSidebarOpen: true,
    toggleLeftSidebar: () => set((state) => ({ isLeftSidebarOpen: !state.isLeftSidebarOpen })),

    isRightSidebarOpen: false, // Default closed
    setIsRightSidebarOpen: (isOpen) => set({ isRightSidebarOpen: isOpen }),
    rightSidebarView: 'library', // 'library' | 'settings'
    setRightSidebarView: (view) => set({ rightSidebarView: view }),
    toggleRightSidebar: () => set((state) => ({ isRightSidebarOpen: !state.isRightSidebarOpen })),

    // --- Live Mode State ---
    isLiveMode: false,
    toggleLiveMode: () => set((state) => {
        const nextMode = !state.isLiveMode;
        return {
            isLiveMode: nextMode,
            isRightSidebarOpen: nextMode ? false : state.isRightSidebarOpen,
            isLeftSidebarOpen: nextMode ? false : state.isLeftSidebarOpen
        };
    }),

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
