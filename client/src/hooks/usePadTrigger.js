import { useCallback } from 'react';
import useStore from '../store/useStore';
import { sampler } from '../audio/Sampler';
import { sequencer } from '../audio/Sequencer';
import { audioEngine } from '../audio/AudioEngine';
import { instrumentManager } from '../audio/InstrumentManager';
import * as Tone from 'tone';

/**
 * usePadTrigger Hook
 * Handles all logic for triggering a pad (Audio + Visuals + State)
 */
const usePadTrigger = () => {
    const setPadActive = useStore((state) => state.setPadActive);

    // --- Helper: Visual FX Logic ---
    const triggerVisualFX = useCallback((centerId, effect, color) => {
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
                        useStore.getState().setVisualState(id, { color: sourceColor });
                        setTimeout(() => {
                            useStore.getState().setVisualState(id, null);
                        }, LIGHT_DURATION);
                    }
                });
            }, delay);
        };

        if (effect === 'cross') {
            // Horizontal & Vertical
            for (let i = 0; i < 8; i++) {
                if (i !== row) lightUp([i * 8 + col], Math.abs(i - row) * DELAY_STEP * 0.5); // Col
                if (i !== col) lightUp([row * 8 + i], Math.abs(i - col) * DELAY_STEP * 0.5); // Row
            }
        } else if (effect === 'ripple') {
            // Square Ripple
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
    }, []);

    // --- Main Trigger Function ---
    const triggerPad = useCallback((padId, eventType) => {
        const state = useStore.getState();
        const mapping = state.padMappings[padId];

        // 1. Validation
        if (!mapping) return;
        const isHasSound = mapping.file || (mapping.type && mapping.type !== 'sample');
        if (!isHasSound) return;

        const mode = mapping.mode || 'one-shot';
        const type = mapping.type || 'sample';
        const visualEffect = mapping.visualEffect || 'none';

        // 2. Down Event Logic
        if (eventType === 'down') {
            console.log(`[Pad ${padId}] DOWN (Mode: ${mode}, Type: ${type})`);

            // A. Trigger Visuals
            triggerVisualFX(padId, visualEffect, mapping.color);
            sequencer.recordEvent(padId);

            // B. Determine Start Time (Quantization)
            const quantization = state.launchQuantization;
            let startTime = undefined;
            if (quantization && quantization !== 'none') {
                if (Tone.Transport.state !== 'started') {
                    Tone.Transport.start();
                } else {
                    startTime = Tone.Transport.nextSubdivision(quantization);
                }
            }

            // C. Audio & State Logic by Mode

            // --- C-1: LATCH MODES (Loop / Toggle) ---
            if (mode === 'loop' || mode === 'toggle') {
                // Determine if we should start or stop
                const isCurrentlyActive = state.activePads[padId];

                if (isCurrentlyActive) {
                    // STOP
                    setPadActive(padId, false);
                    if (type === 'synth' || type === 'piano' || type === 'drums') {
                        audioEngine.stopSynthNote(mapping.note || 'C4'); // Note: PolySynths might need padId
                    } else {
                        sampler.stop(padId);
                    }
                } else {
                    // START
                    setPadActive(padId, true);
                    if (type === 'synth' || type === 'piano' || type === 'drums') {
                        audioEngine.startSynthNote(mapping.note || 'C4');
                    } else {
                        const shouldLoop = true; // Toggle acts as Loop
                        sampler.play(padId, {
                            loop: shouldLoop,
                            startTime,
                            onLoop: () => triggerVisualFX(padId, visualEffect, mapping.color),
                            onEnded: () => setPadActive(padId, false) // Natural end
                        });
                    }
                }
                return;
            }

            // --- C-2: MOMENTARY MODES (One-Shot / Gate) ---

            // One-Shot Protection: Don't re-trigger if already playing
            if (mode === 'one-shot' && type === 'sample' && sampler.isPlaying(padId)) {
                return;
            }

            setPadActive(padId, true);

            if (type === 'synth' || type === 'piano' || type === 'drums') {
                const note = mapping.note || 'C4';
                // Gate/OneShot for instruments is handled by NoteOn/NoteOff generally
                // But for OneShot instrument, we might need set duration?
                // Currently InstrumentManager trigger uses duration '8n' by default if updated?
                // Let's stick to simple trigger.
                instrumentManager.trigger(padId, note, '8n', startTime);
            } else {
                // Sample Playback
                const isGate = (mode === 'gate');

                sampler.play(padId, {
                    loop: isGate, // Gate loops while held? Or plays once? Usually Gate = Play while held.
                    // If Gate loops, pass onLoop. If Gate is just "hold to play" (no loop), it stops at end.
                    // Assuming Gate = Loop while held for Samples.
                    startTime,
                    onLoop: isGate ? () => triggerVisualFX(padId, visualEffect, mapping.color) : undefined,
                    onEnded: !isGate ? () => setPadActive(padId, false) : undefined
                });
            }

        }

        // 3. Up Event Logic
        else if (eventType === 'up') {
            // Only Gate mode responds to Up events
            if (mode === 'gate') {
                setPadActive(padId, false);
                if (type === 'synth' || type === 'piano' || type === 'drums') {
                    instrumentManager.stopNote(padId, mapping.note || 'C4');
                } else {
                    sampler.stop(padId);
                }
            }
        }

    }, [setPadActive, triggerVisualFX]);

    return { triggerPad };
};

export default usePadTrigger;
