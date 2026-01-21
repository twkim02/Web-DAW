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

    // --- Helper: Visual FX Logic (Delegated to Store) ---
    const triggerVisualFX = useCallback((centerId, effect, color) => {
        useStore.getState().triggerVisualEffect(centerId, effect, color);
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
            const freshState = useStore.getState();

            // CONFLICT RESOLUTION:
            // If Global Quantization is active, we rely on Tone.Transport.scheduleOnce 
            // to handle Stop/Handoff at the correct Bar/Beat.
            // We MUST ignore the 'onLoop' (Sample End) triggered check to prevent double-triggering
            // or premature cut-off if the sample loop is shorter than the quantization interval.
            if (freshState.launchQuantization && freshState.launchQuantization !== 'none' && Tone.Transport.state === 'started') {
                return false;
            }

            const queue = freshState.padQueues[col];
            if (queue && queue.length > 0) {
                const nextPadId = queue[0];
                const cleanPadId = parseInt(padId);
                const cleanNextId = parseInt(nextPadId);

                console.log(`[Queue] Checking Col ${col}: Current=${cleanPadId}, Next=${cleanNextId}`);

                // STOP (Self)
                if (cleanNextId === cleanPadId) {
                    console.log(`[Queue] Self-Stop Executing for ${cleanPadId}`);
                    freshState.shiftQueue(col); // Consume command
                    setPadActive(cleanPadId, false);
                    sampler.stop(cleanPadId);
                    return true;
                }

                // HANDOFF (Different Pad)
                console.log(`[Queue] Handoff: ${cleanPadId} -> ${cleanNextId}`);
                freshState.shiftQueue(col);

                // Stop Current
                setPadActive(cleanPadId, false);
                sampler.stop(cleanPadId);

                // Play Next
                const nextMapping = freshState.padMappings[cleanNextId];
                if (nextMapping) {
                    playPadNow(cleanNextId, nextMapping, freshState);
                }
                return true;
            }
            return false;
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
            sequencer.recordEvent(padId);

            // --- SEQUENCER INTEGRATION ---
            // If this column has a recorded Loop Slot, prioritizing controlling that Loop
            // instead of triggering the raw sample on top.
            const loopSlotStatus = state.loopSlots[col]?.status || 'empty';
            if (loopSlotStatus !== 'empty' && loopSlotStatus !== 'recording') {
                // It has content (Playing or Stopped).
                // Delegate to Sequencer to Toggle (Play/Stop/Queued)
                // This ensures we resume the Loop Track properly.
                console.log(`[PadTrigger] Delegating Pad ${padId} to Sequencer Slot ${col} (${loopSlotStatus})`);
                sequencer.toggleSlot(col);

                // Also fire visual FX
                triggerVisualFX(padId, visualEffect, mapping.color);
                return;
            }

            // A. Visual Feedback (Immediate)
            triggerVisualFX(padId, visualEffect, mapping.color);

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

            // --- SIBLING INTERACTION: HANDOFF LOGIC (Scenario 3) ---
            const isSiblingActive = (activePadInCol !== -1 && activePadInCol !== padId);
            const isLooping = (mode === 'loop' || mode === 'toggle' || mode === 'gate');

            if (isSiblingActive) {
                console.log(`[Queue] Sibling Active (${activePadInCol}) -> Queuing Handoff to ${padId}`);
                state.addToQueue(padId);

                // If Quantized Handoff is desired (User Request: "Next Bar")
                if (quantization && quantization !== 'none' && isTransportStarted) {
                    const qVal = quantization;
                    const handoffTime = Tone.Transport.nextSubdivision(qVal);

                    console.log(`[Handoff] Scheduling Switch ${activePadInCol} -> ${padId} at ${handoffTime}`);

                    Tone.Transport.scheduleOnce((time) => {
                        try {
                            // 1. Stop Old
                            console.log(`[Handoff] Stopping Sibling ${activePadInCol}`);
                            setPadActive(activePadInCol, false);
                            sampler.stop(activePadInCol);

                            // 2. Start New
                            console.log(`[Handoff] Starting New ${padId}`);
                            // Consume queue (since we are executing it now)
                            useStore.getState().shiftQueue(col);
                            playPadNow(padId, mapping, useStore.getState(), time);
                        } catch (err) { console.error(err); }
                    }, handoffTime);
                }

                return; // Stop execution here (Handled via Schedule or Queue-wait)
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

                // STOP Action
                // Case A: Quantized Stop (Transport)
                if (quantization && quantization !== 'none' && isTransportStarted) {
                    console.log(`[Pad ${padId}] STOP Request -> Scheduling at ${quantization}`);

                    // 1. Visual Queue
                    state.addToQueue(padId);

                    // 2. Schedule Stop
                    const stopTime = Tone.Transport.nextSubdivision(quantization);
                    Tone.Transport.scheduleOnce(() => {
                        console.log(`[Scheduler] Quantized STOP Executing for Pad ${padId}`);

                        // Consume Queue (Visual Off)
                        // We explicitly remove self from queue to stop flashing
                        // Note: shiftQueue pulls from head. If we are head, robust.
                        useStore.getState().shiftQueue(col);

                        // Stop Audio & State
                        setPadActive(padId, false);
                        sampler.stop(padId);
                    }, stopTime);
                    return;
                }

                // Case B: Unquantized / End of Cycle Stop (Fallback)
                console.log(`[Pad ${padId}] STOP Request -> Queued for End of Loop Cycle`);
                state.addToQueue(padId);
                return;

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

                // 1. Ensure Transport/Context Running FIRST
                if (Tone.context.state !== 'running') await Tone.start();
                if (Tone.Transport.state !== 'started') {
                    console.log('[PadTrigger] Auto-Starting Transport for Quantized Launch');
                    Tone.Transport.start();
                }

                // 2. Calculate Schedule Time (Now that Transport is verified running)
                const qVal = quantization || '1m';
                const scheduleTime = Tone.Transport.nextSubdivision(qVal);
                console.log(`[Pad ${padId}] Queueing Start. Quant: ${qVal}, SchedTime: ${scheduleTime}, Curr: ${Tone.Transport.seconds}`);

                Tone.Transport.scheduleOnce((time) => {
                    try {
                        console.log(`[Scheduler] Quantized START Executing for Pad ${padId} at ${time}`);
                        useStore.getState().shiftQueue(col);
                        playPadNow(padId, mapping, useStore.getState(), time);
                    } catch (err) {
                        console.error('[PadTrigger] Error in Start Callback:', err);
                    }
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
