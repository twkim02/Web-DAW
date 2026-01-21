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

                // FIX: If next pad is same as current, it means we want to STOP at end of cycle.
                // Previously we ignored this (return false), which kept the loop going.
                // Now we explicitly handle it as a STOP command.
                if (nextPadId === padId) {
                    console.log(`[Queue] Self-Stop detected for ${padId} at End of Cycle.`);
                    freshState.shiftQueue(col); // Remove self from queue
                    setPadActive(padId, false);
                    sampler.stop(padId);
                    return true; // We handled a stop
                }

                // Normal Handoff (Different Pad)
                // Shift Queue
                freshState.shiftQueue(col);
                console.log(`[Queue] Handoff: ${padId} -> ${nextPadId}`);

                // Stop Current (Self)
                setPadActive(padId, false);
                sampler.stop(padId);

                // Play Next
                const nextMapping = freshState.padMappings[nextPadId];
                if (nextMapping) {
                    playPadNow(nextPadId, nextMapping, freshState);
                }
                return true; // We handled a handoff
            }
            return false; // No queue, continue as normal
        };

        // 3. Play
        if (type === 'synth' || type === 'piano' || type === 'drums' || type === 'instrument') {
            const note = mapping.note || 'C4';
            instrumentManager.trigger(padId, note, '8n', startTimeOverride);
        } else {
            // Sample Playback
            const isGate = (mode === 'gate');
            const shouldLoop = (mode === 'loop' || mode === 'toggle');

            sampler.play(padId, {
                loop: shouldLoop || isGate,
                startTime: startTimeOverride,
                onLoop: () => {
                    // LOOP HANDOFF LOGIC
                    // We check the queue at the end of every loop cycle.
                    // If something is queued, we stop current and start next (Handoff).
                    if (checkQueueAndPlayNext()) return;

                    // If no queue, just visual FX
                    triggerVisualFX(padId, visualEffect, mapping.color);
                },
                onEnded: () => {
                    setPadActive(padId, false);
                    // Check Queue on end (Crucial for One-Shot Chains)
                    checkQueueAndPlayNext();
                }
            });
        }
    }, [setPadActive, triggerVisualFX]);


    // --- Main Trigger Function ---
    const triggerPad = useCallback(async (padId, eventType) => {
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

            // A. Visual Feedback (Immediate)
            triggerVisualFX(padId, visualEffect, mapping.color);
            sequencer.recordEvent(padId);

            // B. TOGGLE OFF QUEUED PAD (Cancel Reservation)
            // If the pad is already in the queue (Reserved), clicking it again should cancel the reservation.
            if (state.queuedPads.has(padId)) {
                console.log(`[Queue] Cancelling Reservation for Pad ${padId}`);
                state.removeFromQueue(col, padId);
                return;
            }

            // C. Find Active Pad in Column (Exclusive Group)
            // Iterate all 8 rows for this column
            let activePadInCol = -1;
            for (let r = 0; r < 8; r++) {
                const pId = r * 8 + col;
                if (state.activePads[pId]) {
                    activePadInCol = pId;
                    break;
                }
            }

            // D. Launch Quantization (Default to Next Bar for Loops)
            // User Request: "All loops... reservation state... play at start of bar"
            // Determine Start Time (Quantization)
            const quantization = state.launchQuantization;
            let startTime = undefined;
            const isTransportStarted = Tone.Transport.state === 'started';

            // F. Count-in Logic (Special Case)
            // If we are in Count-in phase (AudioEngine set isCountIn=true), 
            // the Transport is technically stopped but will start at a known time.
            // We want toQUEUE the pad and launch it at Transport Time 0. (Start of Song)
            if (state.isCountIn) {
                console.log(`[Pad ${padId}] Clicked during Count-in -> Queuing for Start.`);

                // 1. Queue Visual (Flashing)
                // addToQueue adds it to padQueues which Grid renders as flashing
                state.addToQueue(padId);

                // 2. Schedule Launch at 0
                // Since Transport starts at 0, we schedule 0.
                // We use scheduleOnce which fires when Transport reaches 0.
                Tone.Transport.scheduleOnce(() => {
                    console.log(`[Pad ${padId}] Launching from Count-in Queue.`);

                    // Remove from Queue (Stop Flashing)
                    state.shiftQueue(col); // Assumes we are the next one in queue? Yes.

                    // Play!
                    playPadNow(padId, mapping, state, "0:0:0");
                }, 0);

                return; // Stop further processing
            }

            if (quantization && quantization !== 'none') {
                if (!isTransportStarted) {
                    Tone.Transport.start();
                } else {
                    startTime = Tone.Transport.nextSubdivision(quantization);
                }
            } else {
                startTime = 0;
            }

            // --- SIBLING INTERACTION: QUEUE LOGIC ---
            // If another pad in the same column is active, we QUEUE this new pad.
            // We do NOT play immediately.
            const isSiblingActive = (activePadInCol !== -1 && activePadInCol !== padId);
            const isLooping = (mode === 'loop' || mode === 'toggle' || mode === 'gate');

            if (isSiblingActive) {
                console.log(`[Queue] Sibling Active (${activePadInCol}) -> Queuing ${padId}`);
                // Simply add to Queue.
                // The Active Pad will detect this in its 'onLoop' or 'onEnded' callback
                // and trigger the Switch (Handoff).
                state.addToQueue(padId);
                return; // Stop execution here.
            }

            // --- STANDARD PLAYBACK (No Sibling Active OR Self-Interaction) ---

            // ONE-SHOT: Play Immediately (Retrigger if self)
            if (!isLooping) {
                playPadNow(padId, mapping, state);
                return;
            }

            // LOOPS: Toggle Logic
            if (isLooping) {
                const isCurrentlyActive = state.activePads[padId];

                if (isCurrentlyActive) {
                    // STOP Action (Quantized to End of Loop Cycle)
                    // We just add to queue. The 'onLoop' handler (checkQueueAndPlayNext)
                    // will see this queued item at the end of the cycle and stop the player.
                    state.addToQueue(padId); // Visual Queue (Flashing)
                    console.log(`[User] Requested Stop for Pad ${padId}. Queued for End of Cycle.`);

                    // NO explicit Transport schedule here.
                    // We rely entirely on the natural loop end event.

                    return;
                }

                // PLAY Action (Start)
                if (!isTransportStarted) {
                    // Auto-Start Transport
                    console.log(`[Pad ${padId}] Auto-Starting Transport for First Loop`);

                    // eslint-disable-next-line
                    if (Tone.context.state !== 'running') await Tone.start();

                    Tone.Transport.start();
                    playPadNow(padId, mapping, state, "0:0:0");
                    return;
                }

                // Schedule Quantized Start
                state.addToQueue(padId);
                const scheduleTime = startTime !== undefined ? startTime : Tone.Transport.nextSubdivision(quantization || '1m');

                Tone.Transport.scheduleOnce((time) => {
                    console.log(`[Scheduler] Quantized START for Pad ${padId} at ${time}`);
                    useStore.getState().shiftQueue(col);
                    playPadNow(padId, mapping, useStore.getState(), time);
                }, scheduleTime);
            }

        }

        // 3. Up Event Logic
        else if (eventType === 'up') {
            if (mode === 'gate') {
                // Gate Stop Logic
                setPadActive(padId, false);
                sampler.stop(padId);
            }
        }

    }, [setPadActive, triggerVisualFX, playPadNow]);

    return { triggerPad };
};

export default usePadTrigger;
