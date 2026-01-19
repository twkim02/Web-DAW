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

    // --- Internal Play Function (Bypasses Queue Check) ---
    const playPadNow = useCallback((padId, mapping, state, startTimeOverride) => {
        // 1. Set Active
        setPadActive(padId, true);

        const mode = mapping.mode || 'one-shot';
        const type = mapping.type || 'sample';
        const visualEffect = mapping.visualEffect || 'none';
        const col = padId % 8;

        // 2. Define Handoff Logic (Queue Check)
        const checkQueueAndPlayNext = () => {
            // Check Store for Queue
            const freshState = useStore.getState();
            const queue = freshState.padQueues[col];

            if (queue && queue.length > 0) {
                // Determine Next Pad
                const nextPadId = queue[0]; // Peek

                // Shift Queue
                freshState.shiftQueue(col);
                console.log(`[Queue] Handoff: ${padId} -> ${nextPadId}`);

                // Stop Current (Self)
                // Note: For 'onLoop', the play loop typically continues unless stopped.
                setPadActive(padId, false);
                sampler.stop(padId);

                // Play Next
                // Recursive call (careful of stack, but async events break stack so it's fine)
                // Need to fetch mapping for next pad
                const nextMapping = freshState.padMappings[nextPadId];
                if (nextMapping) {
                    playPadNow(nextPadId, nextMapping, freshState);
                }
                return true; // We handled a handoff
            }
            return false; // No queue, continue as normal
        };

        // 3. Play
        if (type === 'synth' || type === 'piano' || type === 'drums') {
            const note = mapping.note || 'C4';
            instrumentManager.trigger(padId, note, '8n', startTimeOverride);
            // Instruments don't support "Queue Handoff" easily via onLoop yet. 
            // They rely on Note events. 
            // Only SAMPLES fully support the Loop/End callbacks right now.
        } else {
            // Sample Playback
            const isGate = (mode === 'gate');
            const shouldLoop = (mode === 'loop' || mode === 'toggle');

            sampler.play(padId, {
                loop: shouldLoop || isGate,
                startTime: startTimeOverride,
                onLoop: () => {
                    // Check Queue on every loop cycle
                    if (checkQueueAndPlayNext()) return;

                    // If no queue, just visual FX
                    triggerVisualFX(padId, visualEffect, mapping.color);
                },
                onEnded: () => {
                    setPadActive(padId, false);
                    // Check Queue on end
                    checkQueueAndPlayNext();
                }
            });
        }
    }, [setPadActive, triggerVisualFX]);


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
        const col = padId % 8;

        // 2. Down Event Logic
        if (eventType === 'down') {
            console.log(`[Pad ${padId}] DOWN (Mode: ${mode}, Type: ${type})`);

            // A. Trigger Visuals (Immediate Feedback)
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

            // C. Queue vs Play Logic
            // If any pad in this column is active, we QUEUE (unless it's the SAME pad doing a stop/toggle)

            // Find currently playing pad in this column
            let activePadInCol = -1;
            for (let i = 0; i < 8; i++) {
                const checkId = (Math.floor(padId / 8) * 8 + i); // Wait, stored is Row*8+Col. 
                // Col is vertical. So indices are col, col+8, col+16...
            }
            // Better loop: 0 to 7 rows
            for (let r = 0; r < 8; r++) {
                const pId = r * 8 + col;
                if (state.activePads[pId]) {
                    activePadInCol = pId;
                    break;
                }
            }

            // Case 1: LATCH / TOGGLE / LOOP
            if (mode === 'loop' || mode === 'toggle') {
                const isCurrentlyActive = state.activePads[padId];

                if (isCurrentlyActive) {
                    // STOP Action (Manual override)
                    // If we press a playing loop, we typically stop it.
                    setPadActive(padId, false);
                    if (type === 'synth') audioEngine.stopSynthNote(mapping.note);
                    else sampler.stop(padId);
                    return;
                }

                // If another pad is playing in column -> Queue
                if (activePadInCol !== -1 && activePadInCol !== padId) {
                    console.log(`[Queue] Column ${col} busy (Pad ${activePadInCol}). Queueing ${padId}.`);
                    state.addToQueue(padId);
                    return;
                }

                // Else -> Play Now
                playPadNow(padId, mapping, state, startTime);
                return;
            }

            // Case 2: ONE-SHOT / GATE
            if (activePadInCol !== -1 && activePadInCol !== padId) {
                // Column Busy -> Queue
                console.log(`[Queue] Column ${col} busy. Queueing ${padId}.`);
                state.addToQueue(padId);
                return;
            }

            // Allow re-triggering self in One-Shot? (Standard is yes, cuts self off)
            // But if we queue self? "Same vertical line" includes self.
            // If I press SAME pad that is playing One-Shot... 
            // Usually re-trigger immediately (stutter).
            // Logic: "Reserved... when one-shot... *do not play immediately*".
            // User: "If... PRESSED... one-shot... pressed..."
            // Let's assume re-triggering SELF is immediate (Stutter). Only OTHER pads queue.

            if (mode === 'one-shot' && type === 'sample' && sampler.isPlaying(padId)) {
                // If self is playing... allow re-trigger? 
                // Existing code prevented it. Let's allow it for stutter or keep prevention.
                // Keeping prevention for safe one-shot based on prev code.
                // But wait, prev code returned: `if (sampler.isPlaying(padId)) return;`
                // Let's keep that behavior OR allow restart. I'll stick to playPadNow (which restarts).
            }

            // Logic:
            playPadNow(padId, mapping, state, startTime);

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

    }, [setPadActive, triggerVisualFX, playPadNow]);

    return { triggerPad };
};

export default usePadTrigger;
