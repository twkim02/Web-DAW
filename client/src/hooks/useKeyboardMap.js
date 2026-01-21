import { useEffect } from 'react';
import useStore from '../store/useStore';
import usePadTrigger from './usePadTrigger';
import { sampler } from '../audio/Sampler';

const CODE_MAP = {
    'Digit1': 0, 'Digit2': 1, 'Digit3': 2, 'Digit4': 3,
    'KeyQ': 4, 'KeyW': 5, 'KeyE': 6, 'KeyR': 7,
    'KeyA': 8, 'KeyS': 9, 'KeyD': 10, 'KeyF': 11,
    'KeyZ': 12, 'KeyX': 13, 'KeyC': 14, 'KeyV': 15
};

const useKeyboardMap = () => {
    const isAudioContextReady = useStore((state) => state.isAudioContextReady);
    const { triggerPad } = usePadTrigger();

    useEffect(() => {
        if (!isAudioContextReady) return;

        // Track Held Keys for Modifiers (M, K, Backspace, J)
        const heldKeys = {
            m: false,
            k: false,
            backspace: false,
            j: false
        };

        const handleKeyDown = (e) => {
            if (e.repeat) return;
            // 1. Ignore if typing in an input
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

            const state = useStore.getState();
            if (state.playingPadId !== null || state.previewMode.isOpen) return;

            const code = e.code;

            // Update Held Keys
            if (code === 'KeyM') heldKeys.m = true;
            if (code === 'KeyK') heldKeys.k = true;
            if (code === 'Backspace') heldKeys.backspace = true;
            if (code === 'KeyJ') heldKeys.j = true;

            // --- 0. Modifier + Pad Trigger (Mute, Stop, Delete) - PRIORITY UP ---
            if (Object.prototype.hasOwnProperty.call(CODE_MAP, code)) {
                const bankCoords = useStore.getState().bankCoords;
                const localIndex = CODE_MAP[code];
                const localRow = Math.floor(localIndex / 4);
                const localCol = localIndex % 4;
                const globalRow = (bankCoords.y * 4) + localRow;
                const globalCol = (bankCoords.x * 4) + localCol;
                const globalIndex = (globalRow * 8) + globalCol;

                // PRIORITY 1: Backspace + Pad OR Alt + Pad -> DELETE
                if (heldKeys.backspace || e.altKey) {
                    e.preventDefault();
                    console.log('Delete Shortcut for Pad:', globalIndex);

                    try {
                        sampler.unload(globalIndex);
                    } catch (err) {
                        console.warn('Audio unload failed:', err);
                    }

                    // Stop Sequencer/Audio explicitly if needed
                    import('../audio/Sequencer').then(({ sequencer }) => {
                        // Resetting the pad in store clears active state.
                        // We also might want to stop the track if it relies on this specific clip.
                    });

                    // Reset Store (This cleans queues too now)
                    useStore.getState().resetPad(globalIndex);
                    return;
                }

                // PRIORITY 2: M + Pad -> MUTE Track
                if (heldKeys.m) {
                    e.preventDefault();
                    const col = globalIndex % 8;
                    const trackId = `slot-${col}`;
                    import('../audio/Sequencer').then(({ sequencer }) => {
                        console.log('Mute Shortcut for Column:', col);
                        sequencer.toggleMute(trackId);
                        useStore.getState().toggleTrackState('mute', col);
                    });
                    return;
                }

                // PRIORITY 3: K + Pad -> STOP Track
                if (heldKeys.k) {
                    e.preventDefault();
                    const col = globalIndex % 8;
                    import('../audio/Sequencer').then(({ sequencer }) => {
                        console.log('Stop Shortcut for Column:', col);
                        sequencer.stopTrack(col);
                    });
                    return;
                }

                // PRIORITY 4: J + Pad -> SOLO Track
                if (heldKeys.j) {
                    e.preventDefault();
                    const col = globalIndex % 8;
                    const trackId = `slot-${col}`;
                    import('../audio/Sequencer').then(({ sequencer }) => {
                        console.log('Solo Shortcut for Column:', col);
                        sequencer.toggleSolo(trackId);
                        useStore.getState().toggleTrackState('solo', col);
                    });
                    return;
                }
            }

            // --- 1. Modifiers + Number Row (1-8) for Column/Line Control ---
            // Only if NOT handled by Pad Trigger above (implied by returns above)
            if (['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8'].includes(code)) {
                if (heldKeys.m || heldKeys.k || heldKeys.backspace || heldKeys.j || e.altKey) {
                    e.preventDefault();
                    const col = parseInt(code.replace('Digit', '')) - 1; // 0-7

                    // Case 1: Delete (Backspace or Alt) -> Reset Pad in Row 0 (Pad 0-7)
                    if (heldKeys.backspace || e.altKey) {
                        console.log('Delete Shortcut for Column (Pad 0-7):', col);
                        try { sampler.unload(col); } catch (e) { }
                        useStore.getState().resetPad(col);
                        // Also clear loop slot if applicable?
                        import('../audio/Sequencer').then(({ sequencer }) => {
                            sequencer.clearSlot(col);
                        });
                        return;
                    }

                    // Case 2: Mute
                    if (heldKeys.m) {
                        console.log('Mute Shortcut for Column:', col);
                        const trackId = `slot-${col}`;
                        import('../audio/Sequencer').then(({ sequencer }) => {
                            sequencer.toggleMute(trackId);
                            useStore.getState().toggleTrackState('mute', col);
                        });
                        return;
                    }

                    // Case 3: Stop
                    if (heldKeys.k) {
                        console.log('Stop Shortcut for Column:', col);
                        import('../audio/Sequencer').then(({ sequencer }) => {
                            sequencer.stopTrack(col);
                        });
                        return;
                    }

                    // Case 4: Solo
                    if (heldKeys.j) {
                        console.log('Solo Shortcut for Column:', col);
                        const trackId = `slot-${col}`;
                        import('../audio/Sequencer').then(({ sequencer }) => {
                            sequencer.toggleSolo(trackId);
                            useStore.getState().toggleTrackState('solo', col);
                        });
                        return;
                    }
                }
            }


            // --- 2. Existing Global Key Logic ---

            // Arrow Keys for Bank Navigation or Mixer Control
            const viewMode = useStore.getState().viewMode;
            const MIXER_MODES = ['VOLUME', 'PAN', 'SEND_A', 'SEND_B', 'MIXER_SELECTION', 'MUTE', 'SOLO', 'STOP', 'ARM', 'CLEAR'];

            if (MIXER_MODES.includes(viewMode)) {
                // --- Mixer Mode Logic ---
                const selectedTrack = useStore.getState().selectedMixerTrack;

                // Track Selection / Action via Numbers (1-8)
                if (['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8'].includes(code)) {
                    e.preventDefault();
                    // Map Digit1 -> 0, Digit8 -> 7
                    const trackIdx = parseInt(code.replace('Digit', '')) - 1;

                    // Always select the track visually
                    useStore.getState().setSelectedMixerTrack(trackIdx);

                    // If in Action Mode, Trigger Immediately
                    if (['MUTE', 'SOLO', 'STOP'].includes(viewMode)) {
                        import('../audio/Sequencer').then(({ sequencer }) => {
                            const tracks = useStore.getState().tracks;
                            const track = tracks[trackIdx];
                            const trackId = track ? track.id : `slot-${trackIdx}`;

                            if (viewMode === 'MUTE') {
                                if (trackId) sequencer.toggleMute(trackId);
                            }
                            else if (viewMode === 'SOLO') {
                                if (trackId) sequencer.toggleSolo(trackId);
                            }
                            else if (viewMode === 'STOP') {
                                sequencer.stopTrack(trackIdx);
                            }
                        });
                    }

                    return; // Blocking Launchpad/Loop logic
                }

                // Parameter / Action Control (Up/Down/Enter)
                if (code === 'ArrowUp' || code === 'ArrowDown' || code === 'Enter') {
                    e.preventDefault();

                    // 1. Parameter Modes (Volume, Pan, Sends)
                    if (['VOLUME', 'PAN', 'SEND_A', 'SEND_B', 'MIXER_SELECTION'].includes(viewMode)) {
                        if (code === 'Enter') return;

                        const typeMap = {
                            'VOLUME': 'vol',
                            'MIXER_SELECTION': 'vol',
                            'PAN': 'pan',
                            'SEND_A': 'sendA',
                            'SEND_B': 'sendB'
                        };
                        const type = typeMap[viewMode];
                        const state = useStore.getState();
                        let currentVal = state.mixerLevels[type][selectedTrack];


                        let min = 0, max = 1, step = 0.125;

                        if (type === 'pan') {
                            min = -1;
                            max = 1;
                            step = 0.25;
                        }

                        const delta = (code === 'ArrowUp' ? step : -step);
                        let newVal = currentVal + delta;
                        if (newVal > max) newVal = max;
                        if (newVal < min) newVal = min;
                        newVal = Math.round(newVal * 1000) / 1000;

                        state.setMixerLevel(type, selectedTrack, newVal);

                        import('../audio/AudioEngine').then(({ audioEngine }) => {
                            audioEngine.updateMixerTrack(selectedTrack, { [type]: newVal });
                        });
                        return;
                    }

                    // 2. Action Modes (Mute, Solo, Stop)
                    if (['MUTE', 'SOLO', 'STOP'].includes(viewMode)) {
                        import('../audio/Sequencer').then(({ sequencer }) => {
                            const tracks = useStore.getState().tracks;
                            const track = tracks[selectedTrack];
                            const trackId = track ? track.id : `slot-${selectedTrack}`;

                            if (viewMode === 'MUTE') {
                                if (trackId) sequencer.toggleMute(trackId);
                            }
                            else if (viewMode === 'SOLO') {
                                if (trackId) sequencer.toggleSolo(trackId);
                            }
                            else if (viewMode === 'STOP') {
                                sequencer.stopTrack(selectedTrack);
                            }
                        });
                        return;
                    }
                }
            } else {
                // --- Standard Bank Navigation ---
                if (code === 'ArrowLeft') { e.preventDefault(); useStore.getState().moveBank(-1, 0); useStore.getState().setIsZoomed(true); return; }
                if (code === 'ArrowRight') { e.preventDefault(); useStore.getState().moveBank(1, 0); useStore.getState().setIsZoomed(true); return; }
                if (code === 'ArrowUp') { e.preventDefault(); useStore.getState().moveBank(0, -1); useStore.getState().setIsZoomed(true); return; }
                if (code === 'ArrowDown') { e.preventDefault(); useStore.getState().moveBank(0, 1); useStore.getState().setIsZoomed(true); return; }
            }

            // --- Mixer Mode Shortcuts (Right Hand) ---
            const setViewMode = useStore.getState().setViewMode;

            // Row 1: Parameters
            if (code === 'KeyU') { setViewMode('VOLUME'); return; }
            if (code === 'KeyI') { setViewMode('PAN'); return; }
            if (code === 'KeyO') { setViewMode('SEND_A'); return; }
            if (code === 'KeyP') { setViewMode('SEND_B'); return; }

            // Global FX Settings (Y)
            if (code === 'KeyY') {
                e.preventDefault();
                const { isRightSidebarOpen, rightSidebarView, setIsRightSidebarOpen, setRightSidebarView } = useStore.getState();

                if (isRightSidebarOpen && rightSidebarView === 'global_fx') {
                    setIsRightSidebarOpen(false);
                    setRightSidebarView(null);
                } else {
                    setRightSidebarView('global_fx');
                    setIsRightSidebarOpen(true);
                }
                return;
            }

            // Row 2: States
            if (code === 'KeyM') { setViewMode('MUTE'); return; }
            if (code === 'KeyK') { setViewMode('SOLO'); return; }
            if (code === 'KeyL') { setViewMode('CLEAR'); return; }

            // Alternative Standard Map (J,K,L,;)
            if (code === 'KeyJ') { setViewMode('MUTE'); return; }
            if (code === 'Semicolon') { setViewMode('STOP'); return; }

            // Mixer Mode Cycling ([ / ])
            if (code === 'BracketLeft' || code === 'BracketRight') {
                const MODES = ['VOLUME', 'PAN', 'SEND_A', 'SEND_B', 'STOP', 'MUTE', 'SOLO', 'CLEAR'];
                const current = useStore.getState().viewMode;
                const idx = MODES.indexOf(current);

                if (idx !== -1) {
                    const direction = code === 'BracketRight' ? 1 : -1;
                    const len = MODES.length;
                    const newIdx = (idx + direction + len) % len;
                    setViewMode(MODES[newIdx]);
                } else {
                    // If not in mixer mode, enter Volume
                    setViewMode('VOLUME');
                }
                return;
            }

            // Global Toggles
            if (code === 'Tab') {
                e.preventDefault();
                const current = useStore.getState().viewMode;
                setViewMode(current === 'SESSION' ? 'VOLUME' : 'SESSION');
                return;
            }
            if (code === 'Backspace') {
                setViewMode('STOP'); // Fast Stop Access
                return;
            }

            // ESC to Close Sidebar / Deselect
            if (code === 'Escape') {
                useStore.getState().setIsRightSidebarOpen(false);
                useStore.getState().setEditingPadId(null);
                return;
            }

            // --- Scene Launch Keys (5, T, G, B) ---
            const bankCoords = useStore.getState().bankCoords;
            const bankOffset = bankCoords.y * 4; // Top Bank = 0, Bottom Bank = 4

            if (code === 'Digit5') { e.preventDefault(); import('../audio/Sequencer').then(({ sequencer }) => sequencer.playScene(bankOffset + 0)); return; }
            if (code === 'KeyT') { e.preventDefault(); import('../audio/Sequencer').then(({ sequencer }) => sequencer.playScene(bankOffset + 1)); return; }
            if (code === 'KeyG') { e.preventDefault(); import('../audio/Sequencer').then(({ sequencer }) => sequencer.playScene(bankOffset + 2)); return; }
            if (code === 'KeyB') { e.preventDefault(); import('../audio/Sequencer').then(({ sequencer }) => sequencer.playScene(bankOffset + 3)); return; }

            // Bank Logic (Launchpad Grid & Loop Keys)
            if (Object.prototype.hasOwnProperty.call(CODE_MAP, code)) {
                // Determine Global Index based on Active Bank
                const bankCoords = useStore.getState().bankCoords; // {x, y}
                const localIndex = CODE_MAP[code]; // 0-15

                const localRow = Math.floor(localIndex / 4);
                const localCol = localIndex % 4;

                const globalRow = (bankCoords.y * 4) + localRow;
                const globalCol = (bankCoords.x * 4) + localCol;

                const globalIndex = (globalRow * 8) + globalCol;

                // CHANGED: Use shiftKey instead of ctrlKey for Edit
                if (e.shiftKey) {
                    e.preventDefault();
                    console.log('Shift+Key detected for Pad:', globalIndex);
                    useStore.getState().setEditingPadId(globalIndex);
                    // Open RightSidebar and switch to Settings
                    useStore.getState().setRightSidebarView('settings');
                    useStore.getState().setIsRightSidebarOpen(true); // Force Open
                }
                else {
                    triggerPad(globalIndex, 'down');
                }
            }
        };

        const handleKeyUp = (e) => {
            const code = e.code;

            // Update Held Keys (Reset on release)
            if (code === 'KeyM') heldKeys.m = false;
            if (code === 'KeyK') heldKeys.k = false;
            if (code === 'Backspace') heldKeys.backspace = false;
            if (code === 'KeyJ') heldKeys.j = false;

            // Allow Mixer Mode to block 'up' events for reused keys
            const viewMode = useStore.getState().viewMode;
            const MIXER_MODES = ['VOLUME', 'PAN', 'SEND_A', 'SEND_B', 'MIXER_SELECTION', 'MUTE', 'SOLO', 'STOP', 'ARM', 'CLEAR'];

            if (MIXER_MODES.includes(viewMode)) {
                if (['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8'].includes(code)) {
                    return; // Suppress 'up' triggers for pads
                }
            }

            if (Object.prototype.hasOwnProperty.call(CODE_MAP, code)) {
                // Determine Global Index based on Active Bank
                const bankCoords = useStore.getState().bankCoords; // {x, y}
                const localIndex = CODE_MAP[code]; // 0-15

                const localRow = Math.floor(localIndex / 4);
                const localCol = localIndex % 4;

                const globalRow = (bankCoords.y * 4) + localRow;
                const globalCol = (bankCoords.x * 4) + localCol;

                const globalIndex = (globalRow * 8) + globalCol;

                triggerPad(globalIndex, 'up');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isAudioContextReady, triggerPad]);
};

export default useKeyboardMap;
