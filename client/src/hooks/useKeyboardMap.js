import { useEffect } from 'react';
import useStore from '../store/useStore';
import usePadTrigger from './usePadTrigger';

const KEY_MAP = {
    'a': 0, 's': 1, 'd': 2, 'f': 3,
    'z': 4, 'x': 5, 'c': 6, 'v': 7,
    'g': 8, 'h': 9, 'j': 10, 'k': 11,
    'b': 12, 'n': 13, 'm': 14, ',': 15
};

const useKeyboardMap = () => {
    const isAudioContextReady = useStore((state) => state.isAudioContextReady);
    const { triggerPad } = usePadTrigger();

    useEffect(() => {
        if (!isAudioContextReady) return;

        const handleKeyDown = (e) => {
            if (e.repeat) return;
            const key = e.key.toLowerCase();
            if (KEY_MAP.hasOwnProperty(key)) {
                if (e.ctrlKey) {
                    // Open Settings
                    e.preventDefault();
                    useStore.getState().setEditingPadId(KEY_MAP[key]);
                } else {
                    // Trigger Sound
                    triggerPad(KEY_MAP[key], 'down');
                }
            }
        };

        const handleKeyUp = (e) => {
            const key = e.key.toLowerCase();
            if (KEY_MAP.hasOwnProperty(key)) {
                triggerPad(KEY_MAP[key], 'up');
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
