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

        const handleKeyDown = (e) => {
            // DEBUG LOGS
            // console.log('[Keyboard] Code:', e.code, 'Shift:', e.shiftKey, 'Alt:', e.altKey);

            if (e.repeat) return;

            // 1. Ignore if typing in an input
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

            // Disable global map if a modal is open (Playing Mode or Preview Mode)
            // Allow if editingPadId is set (Sidebar), unless input is focused (handled above)
            const state = useStore.getState();
            // console.log('[Keyboard] State check - Editing:', state.editingPadId, 'Playing:', state.playingPadId);

            if (state.playingPadId !== null || state.previewMode.isOpen) return;

            const code = e.code;

            // Global Transport Toggle (Space)
            if (code === 'Space') {
                e.preventDefault();
                import('tone').then(Tone => {
                    if (Tone.Transport.state === 'started') {
                        Tone.Transport.pause();
                        console.log('Transport Paused');
                    } else {
                        Tone.Transport.start();
                        console.log('Transport Started');
                    }
                });
                return;
            }

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

                // Arrow Keys: Left/Right DISABLED for Track Selection as per request
                // Only Up/Down/Enter remain for Parameter Control

                // Parameter / Action Control (Up/Down/Enter)
                if (code === 'ArrowUp' || code === 'ArrowDown' || code === 'Enter') {
                    e.preventDefault();

                    // 1. Parameter Modes (Volume, Pan, Sends)
                    // MIXER_SELECTION defaults to Volume control
                    if (['VOLUME', 'PAN', 'SEND_A', 'SEND_B', 'MIXER_SELECTION'].includes(viewMode)) {
                        if (code === 'Enter') return; // Enter doesn't adjust sliders

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


                        let min = 0, max = 1, step = 0.125; // Default for Vol/Send (1/8 of 0-1)

                        if (type === 'pan') {
                            min = -1;
                            max = 1;
                            step = 0.25; // 1/8 of -1 to 1 (Range 2)
                        }
                        // Sends share the same 0-1 range as Volume

                        const delta = (code === 'ArrowUp' ? step : -step);
                        let newVal = currentVal + delta;
                        if (newVal > max) newVal = max;
                        if (newVal < min) newVal = min;
                        // Precision handling for 0.125 steps
                        newVal = Math.round(newVal * 1000) / 1000;

                        state.setMixerLevel(type, selectedTrack, newVal);

                        // Sync with AudioEngine
                        import('../audio/AudioEngine').then(({ audioEngine }) => {
                            audioEngine.updateMixerTrack(selectedTrack, { [type]: newVal });
                        });
                        return;
                    }

                    // 2. Action Modes (Mute, Solo, Stop)
                    if (['MUTE', 'SOLO', 'STOP'].includes(viewMode)) {
                        import('../audio/Sequencer').then(({ sequencer }) => {
                            // Try to find track by index
                            const tracks = useStore.getState().tracks;
                            // Note: track ordering in store should match mixer columns 0-7
                            const track = tracks[selectedTrack];
                            const trackId = track ? track.id : `slot-${selectedTrack}`; // Fallback to slot ID

                            if (viewMode === 'MUTE') {
                                // Toggle Mute
                                if (trackId) sequencer.toggleMute(trackId);
                            }
                            else if (viewMode === 'SOLO') {
                                // Toggle Solo
                                if (trackId) sequencer.toggleSolo(trackId);
                            }
                            else if (viewMode === 'STOP') {
                                // Trigger Stop
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
            if (code === 'KeyO') { setViewMode('SEND_A'); return; }
            if (code === 'KeyP') { setViewMode('SEND_B'); return; }

            // Global FX Settings (Y)
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
            if (code === 'KeyM') { setViewMode('MUTE'); return; } // M for Mute (Intuitive) - Overrides KeyJ plan
            if (code === 'KeyK') { setViewMode('SOLO'); return; } // K is near L
            if (code === 'KeyL') { setViewMode('CLEAR'); return; }  // L for Loop Clear
            // if (code === 'Semicolon') { setViewMode('STOP'); return; } // ; for Stop

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
                // Default to VOLUME directly as requested
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
            // DISABLED IN MIXER MODE? No, user only asked for Loop (5-0) and Launchpad (1-4)
            // But '5' is also Loop 1 in new mapping?
            // "1234(Launchpad) 567890(Loop)" -> 1-0 are now used for Mixer.
            // So we must intercept Scene Launch '5' if it conflicts?
            // Scene Launch is on 5, T, G, B. 
            // If Mixer Mode uses 5 for Track 5, Scene Launch 5 is blocked by the return above. Correct.

            // --- Loop / Bank Logic ---
            const bankCoords = useStore.getState().bankCoords;
            const bankOffset = bankCoords.y * 4; // Top Bank = 0, Bottom Bank = 4

            // Handle Scene Launch IF NOT handled by Mixer
            // But we processed Digit5 above and returned. So this only runs if not Mixer.
            // if (code === 'Digit5') ...
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
                // NEW: Alt Key to Reset Pad
                else if (e.altKey) {
                    e.preventDefault();
                    try {
                        sampler.unload(globalIndex); // Unload audio
                    } catch (err) {
                        console.warn('Audio unload failed, forcing UI reset:', err);
                    }
                    useStore.getState().resetPad(globalIndex); // Reset state
                    // Optional: Visual feedback or toast could go here
                }
                else {
                    triggerPad(globalIndex, 'down');
                }
            }
        };

        const handleKeyUp = (e) => {
            const code = e.code;

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
