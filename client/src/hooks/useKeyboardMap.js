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
            if (['VOLUME', 'PAN', 'SEND_A', 'SEND_B'].includes(viewMode)) {
                // --- Mixer Mode Logic ---
                const selectedTrack = useStore.getState().selectedMixerTrack;
                const typeMap = { 'VOLUME': 'vol', 'PAN': 'pan', 'SEND_A': 'sendA', 'SEND_B': 'sendB' };
                const type = typeMap[viewMode];

                if (code === 'ArrowLeft') {
                    e.preventDefault();
                    const newIdx = Math.max(0, selectedTrack - 1);
                    useStore.getState().setSelectedMixerTrack(newIdx);
                    return;
                }
                if (code === 'ArrowRight') {
                    e.preventDefault();
                    const newIdx = Math.min(7, selectedTrack + 1);
                    useStore.getState().setSelectedMixerTrack(newIdx);
                    return;
                }
                if (code === 'ArrowUp' || code === 'ArrowDown') {
                    e.preventDefault();
                    const state = useStore.getState();
                    let currentVal = state.mixerLevels[type][selectedTrack];

                    // Defined ranges and steps
                    let min = 0, max = 1, step = 0.05;

                    if (type === 'pan') {
                        min = -1;
                        max = 1;
                        step = 0.1;
                    }

                    const delta = (code === 'ArrowUp' ? step : -step);
                    let newVal = currentVal + delta;

                    // Clamp
                    if (newVal > max) newVal = max;
                    if (newVal < min) newVal = min;

                    // Round to avoid float precision issues
                    newVal = Math.round(newVal * 100) / 100;

                    state.setMixerLevel(type, selectedTrack, newVal);
                    return;
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
                setViewMode(current === 'SESSION' ? 'MIXER_SELECTION' : 'SESSION');
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

            // if (code === 'Digit5') { e.preventDefault(); import('../audio/Sequencer').then(({ sequencer }) => sequencer.playScene(bankOffset + 0)); return; }
            if (code === 'KeyT') { e.preventDefault(); import('../audio/Sequencer').then(({ sequencer }) => sequencer.playScene(bankOffset + 1)); return; }
            if (code === 'KeyG') { e.preventDefault(); import('../audio/Sequencer').then(({ sequencer }) => sequencer.playScene(bankOffset + 2)); return; }
            if (code === 'KeyB') { e.preventDefault(); import('../audio/Sequencer').then(({ sequencer }) => sequencer.playScene(bankOffset + 3)); return; }

            // Bank Logic
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
