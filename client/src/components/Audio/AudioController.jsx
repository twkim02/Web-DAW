import React, { useEffect } from 'react';
import useStore from '../../store/useStore';
import { audioEngine } from '../../audio/AudioEngine';

const AudioController = () => {
    // Mixer State Selectors for Audio Engine Sync
    const mixerLevels = useStore((state) => state.mixerLevels);
    const trackStates = useStore((state) => state.trackStates);

    // --- Mixer Audio Sync Effect ---
    useEffect(() => {
        // Sync Mixer State to Audio Engine whenever it changes
        for (let i = 0; i < 8; i++) {
            audioEngine.updateMixerTrack(i, {
                volume: mixerLevels.vol[i],
                pan: mixerLevels.pan[i],
                mute: trackStates.mute[i],
                solo: trackStates.solo[i],
                sendA: mixerLevels.sendA[i],
                sendB: mixerLevels.sendB[i]
            });
        }
    }, [mixerLevels, trackStates]);

    return null; // This component handles side effects only
};

export default AudioController;
