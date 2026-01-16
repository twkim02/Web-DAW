import { useCallback } from 'react';
import useStore from '../store/useStore';
import { sampler } from '../audio/Sampler';
import { sequencer } from '../audio/Sequencer';
import { audioEngine } from '../audio/AudioEngine';

const usePadTrigger = () => {
    const setPadActive = useStore((state) => state.setPadActive);
    // We need access to mappings to know the mode
    // Using getState() inside the callback to avoid re-creating callbacks on every store change
    // or useStore with a selector if we want reactivity, but for an event handler getState is fine and more performant.

    const triggerPad = useCallback((padId, eventType) => {
        // eventType: 'down' | 'up'
        const state = useStore.getState();
        const mapping = state.padMappings[padId];
        const mode = mapping?.mode || 'one-shot';
        const type = mapping?.type || 'sample';

        if (eventType === 'down') {
            sequencer.recordEvent(padId);

            if (mode !== 'toggle') {
                setPadActive(padId, true);
            }

            // --- SYNTH LOGIC ---
            if (type === 'synth') {
                const note = mapping?.note || 'C4';
                if (mode === 'one-shot') {
                    audioEngine.triggerSynth(note);
                } else if (mode === 'gate') {
                    audioEngine.startSynthNote(note);
                } else if (mode === 'toggle') {
                    // Start note, but how to track if it's already playing? 
                    // Store doesn't track "playing notes". Visual activePads is the proxy.
                    if (state.activePads[padId]) {
                        audioEngine.stopSynthNote(note);
                        setPadActive(padId, false);
                    } else {
                        audioEngine.startSynthNote(note);
                        setPadActive(padId, true);
                    }
                }
            }
            // --- SAMPLE LOGIC ---
            else {
                if (mode === 'one-shot') {
                    sampler.play(padId);
                } else if (mode === 'gate') {
                    sampler.play(padId);
                } else if (mode === 'toggle') {
                    const isPlaying = sampler.isPlaying(padId);
                    if (isPlaying) {
                        sampler.stop(padId);
                        setPadActive(padId, false);
                    } else {
                        sampler.play(padId, { loop: true });
                        setPadActive(padId, true);
                    }
                }
            }

        } else if (eventType === 'up') {
            if (mode !== 'toggle') {
                setPadActive(padId, false);
            }

            // --- SYNTH LOGIC ---
            if (type === 'synth') {
                const note = mapping?.note || 'C4';
                if (mode === 'gate') {
                    audioEngine.stopSynthNote(note);
                }
            }
            // --- SAMPLE LOGIC ---
            else {
                if (mode === 'gate') {
                    sampler.stop(padId);
                }
            }
        }
    }, [setPadActive]);

    return { triggerPad };
};

export default usePadTrigger;
