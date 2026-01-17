import { useCallback } from 'react';
import useStore from '../store/useStore';
import { sampler } from '../audio/Sampler';
import { sequencer } from '../audio/Sequencer';
import { audioEngine } from '../audio/AudioEngine';
import { instrumentManager } from '../audio/InstrumentManager';
import * as Tone from 'tone';

const usePadTrigger = () => {
    const setPadActive = useStore((state) => state.setPadActive);
    // We need access to mappings to know the mode
    // Using getState() inside the callback to avoid re-creating callbacks on every store change
    // or useStore with a selector if we want reactivity, but for an event handler getState is fine and more performant.

    const triggerPad = useCallback((padId, eventType) => {
        // eventType: 'down' | 'up'
        const state = useStore.getState();
        const mapping = state.padMappings[padId];
        if (!mapping) return;

        const mode = mapping.mode || 'one-shot';
        const type = mapping.type || 'sample';

        console.log(`[Pad ${padId}] ${eventType} (Mode: ${mode}, Type: ${type})`);

        if (eventType === 'down') {
            sequencer.recordEvent(padId);

            // Toggle Mode Special Case
            if (mode === 'toggle') {
                if (type === 'synth') {
                    // Check visual active state as a proxy for synth playing
                    if (state.activePads[padId]) {
                        audioEngine.stopSynthNote(mapping.note || 'C4');
                        setPadActive(padId, false);
                    } else {
                        audioEngine.startSynthNote(mapping.note || 'C4');
                        setPadActive(padId, true);
                    }
                } else {
                    // Sample Toggle
                    const isPlaying = sampler.isPlaying(padId);
                    if (isPlaying) {
                        sampler.stop(padId);
                        setPadActive(padId, false);
                    } else {
                        // Toggle usually implies Looping for samples
                        sampler.play(padId, { loop: true });
                        setPadActive(padId, true);
                    }
                }
                return; // Exit for toggle down
            }

            // Non-Toggle Down Logic
            setPadActive(padId, true);

            // --- Scheduling Logic ---
            const quantization = state.launchQuantization; // 'none', '1m', '4n', etc.
            let startTime = undefined;

            if (quantization && quantization !== 'none') {
                if (Tone.Transport.state !== 'started') {
                    // FEATURE: If Transport is stopped, play IMMEDIATELY (standard DAW behavior)
                    // Instead of waiting for next subdivision (which might be 1 bar away).
                    console.log('[Trigger] Transport Stopped -> Playing Immediately & Starting Transport');
                    Tone.Transport.start();
                    startTime = undefined; // Play now
                } else {
                    // Transport Running -> Schedule for next subdivision
                    startTime = Tone.Transport.nextSubdivision(quantization);
                    const transportTime = Tone.Transport.position;
                    // console.log(`[Trigger] Scheduled for: ${startTime} (Current: ${transportTime})`);
                }
            }
            // ------------------------

            if (['synth', 'piano', 'drums'].includes(type)) {
                // Instrument Trigger (Note, Duration, Time)
                const note = mapping.note || 'C4';
                // Pass startTime to instrumentManager? 
                // InstrumentManager.trigger needs update? 
                // Currently it uses `synth.triggerAttackRelease(note, duration)`.
                // It defaults to 'now'.
                // Let's assume for now instruments play immediately or we update InstrumentManager later.
                // Focusing on Samples for this task.
                instrumentManager.trigger(padId, note, '8n', startTime);
            } else {
                // Legacy Sample
                // Pass startTime to Sampler
                if (mode === 'gate') {
                    sampler.play(padId, { loop: true, startTime });
                } else {
                    sampler.play(padId, { loop: false, startTime });
                }
            }

        } else if (eventType === 'up') {
            // Up Logic
            if (mode === 'toggle') return;

            setPadActive(padId, false);

            if (mode === 'gate') {
                if (['synth', 'piano'].includes(type)) {
                    instrumentManager.stopNote(padId, mapping.note || 'C4');
                } else {
                    sampler.stop(padId);
                }
            }
        }
    }, [setPadActive]);

    return { triggerPad };
};

export default usePadTrigger;
