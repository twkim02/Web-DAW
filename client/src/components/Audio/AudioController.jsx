import React, { useEffect } from 'react';
import useStore from '../../store/useStore';
import { audioEngine } from '../../audio/AudioEngine';

const AudioController = () => {
    // Mixer State Selectors for Audio Engine Sync
    const mixerLevels = useStore((state) => state.mixerLevels);
    const trackStates = useStore((state) => state.trackStates);
    const bpm = useStore((state) => state.bpm); // Select BPM
    const timeSignature = useStore((state) => state.timeSignature); // Select Time Signature

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

    // --- Global FX Sync Effect ---
    const effects = useStore((state) => state.effects);
    useEffect(() => {
        audioEngine.updateEffectParams('reverb', effects.reverb);
        audioEngine.updateEffectParams('delay', effects.delay);
    }, [effects]);

    // --- BPM Sync Effect ---
    useEffect(() => {
        audioEngine.setBpm(bpm);
    }, [bpm]);

    // --- Time Signature Sync Effect ---
    useEffect(() => {
        audioEngine.setTimeSignature(timeSignature);
    }, [timeSignature]);

    // --- Metronome Sync Effect ---
    const isMetronomeOn = useStore((state) => state.isMetronomeOn);
    useEffect(() => {
        audioEngine.setMetronome(isMetronomeOn);
    }, [isMetronomeOn]);

    // --- Pad Effect Sync (Real-time) ---
    const editingPadId = useStore((state) => state.editingPadId);
    const padMappings = useStore((state) => state.padMappings);

    // Deep selection of the editing pad's effects to trigger update
    // Handle both 'effects' (Array) and legacy 'effect' (Object)
    const editingPad = editingPadId !== null ? padMappings[editingPadId] : null;
    const activeEffectsArray = editingPad?.effects;
    const activeLegacyEffect = editingPad?.effect;

    useEffect(() => {
        if (editingPadId !== null && editingPad) {
            // Normalize: Ensure it's an array. Prioritize 'effects' array. Fallback to 'effect' object wrapped in array.
            let effectsChain = [];
            if (Array.isArray(activeEffectsArray)) {
                effectsChain = activeEffectsArray;
            } else if (activeLegacyEffect) {
                effectsChain = [activeLegacyEffect];
            }

            // Apply Chain
            import('../../audio/InstrumentManager').then(({ instrumentManager }) => {
                instrumentManager.applyEffectChain(editingPadId, effectsChain);
            });
        }
    }, [activeEffectsArray, activeLegacyEffect, editingPadId]);

    return null; // This component handles side effects only
};

export default AudioController;
