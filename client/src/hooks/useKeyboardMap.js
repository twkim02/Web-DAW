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
            if (e.repeat) return;
            // Disable global map if a modal is open (editingPadId is set)
            if (useStore.getState().editingPadId !== null) return;

            const code = e.code;
            const key = e.key.toLowerCase(); // Keep for arrows check? Arrows have codes too.

            // Arrow Keys for Bank Navigation (Auto Zoom In)
            if (code === 'ArrowUp') { e.preventDefault(); useStore.getState().moveBank(0, -1); useStore.getState().setIsZoomed(true); return; }
            if (code === 'ArrowDown') { e.preventDefault(); useStore.getState().moveBank(0, 1); useStore.getState().setIsZoomed(true); return; }
            if (code === 'ArrowLeft') { e.preventDefault(); useStore.getState().moveBank(-1, 0); useStore.getState().setIsZoomed(true); return; }
            if (code === 'ArrowRight') { e.preventDefault(); useStore.getState().moveBank(1, 0); useStore.getState().setIsZoomed(true); return; }

            // Bank Logic
            if (CODE_MAP.hasOwnProperty(code)) {
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
                    useStore.getState().setEditingPadId(globalIndex);
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
            if (CODE_MAP.hasOwnProperty(code)) {
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
