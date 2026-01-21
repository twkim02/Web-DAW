import * as Tone from 'tone';
import useStore from '../store/useStore';
import { sampler } from './Sampler';
import { instrumentManager } from './InstrumentManager';
import { audioEngine } from './AudioEngine';

class Sequencer {
    constructor() {
        this.events = []; // Current recording events
        this.activeSlotIndex = null; // 0-5
        this.tracks = new Map(); // Map<string, { part: Tone.Part, ... }> Key: "slot-0", "slot-1" etc.
        this.trackCounter = 1;
    }

    /**
     * Main Interaction Method for Slot Buttons
     * @param {number} slotIndex 0-5
     */
    toggleSlot(slotIndex) {
        const state = useStore.getState();
        const slotStatus = state.loopSlots[slotIndex]?.status || 'empty';

        console.log(`[Sequencer] Toggle Slot ${slotIndex} (Status: ${slotStatus})`);

        if (slotStatus === 'empty') {
            // Case 1: Start Recording
            this.recordToSlot(slotIndex);
        } else if (slotStatus === 'recording') {
            // Case 2: Stop Recording & Start Looping
            this.stopRecording();
        } else {
            // Case 3: Playing/Stopped (Toggle Playback)
            const trackId = `slot-${slotIndex}`;
            this.toggleMute(trackId);

            // REMOVED: Redundant status update that overwrote 'queued' logic
        }
    }

    recordToSlot(index) {
        // Stop any other recording first
        if (this.activeSlotIndex !== null) {
            this.stopRecording();
        }

        console.log(`[Sequencer] Queue REC -> Slot ${index}`);
        this.activeSlotIndex = index;
        this.events = []; // Reset events

        // Update UI
        useStore.getState().setLoopSlotStatus(index, 'armed');
        useStore.getState().setIsLoopRecording(true);

        // Enter "ARMED" state: Waiting for first input
        this.isWaitingForInput = true;
        this.recordingStartTick = null;

        // Ensure Transport is running for tick counting
        if (Tone.Transport.state !== 'started') {
            Tone.Transport.start();
        }
    }

    stopRecording() {
        if (this.activeSlotIndex === null) return;

        // If we never received input, cancel recording
        if (this.isWaitingForInput) {
            console.log('[Sequencer] No input received. Cancelling recording.');
            useStore.getState().setLoopSlotStatus(this.activeSlotIndex, 'empty');
            this.activeSlotIndex = null;
            this.isWaitingForInput = false;
            useStore.getState().setIsLoopRecording(false);
            return;
        }

        const slotIndex = this.activeSlotIndex;
        console.log(`[Sequencer] STOP REC -> Slot ${slotIndex}`);

        // Calculate "Audio End Time" based on events
        const startTick = this.recordingStartTick;
        let maxDurationSeconds = 0;
        let hasAudioEvents = false;

        this.events.forEach(e => {
            const relTick = e.rawTick - startTick;
            const relTime = Tone.Time(relTick, "i").toSeconds();

            // Get Duration from Sampler
            // Note: If instrument (synth), we assume fixed length or NoteOff?
            // User context assumes Samples mostly. For Synths, assume default 8n (0.25s) + release?
            // Use Sampler.getDuration for samples.
            let duration = 0;
            const mapping = useStore.getState().padMappings[e.padId];
            if (mapping && mapping.type === 'sample') {
                duration = sampler.getDuration(e.padId);
            } else {
                duration = Tone.Time("8n").toSeconds(); // Fallback for instruments
            }

            const endTime = relTime + duration;
            if (endTime > maxDurationSeconds) maxDurationSeconds = endTime;
            hasAudioEvents = true;
        });

        // Convert Max Audio Duration to Ticks
        const audioDurationTicks = Tone.Time(maxDurationSeconds).toTicks();

        // Determines target length
        // Priority: Manual Stop Time (Quantized) > Audio Tail (Only if significantly longer?)
        // Standard Loop Station: The interval between Rec Start and Rec Stop defines the loop.

        const currentTick = Tone.Transport.ticks;
        const manualDurationTicks = currentTick - this.recordingStartTick;

        let targetDurationTicks = manualDurationTicks;

        if (!hasAudioEvents) {
            console.log("[Sequencer] No audio events. Creating silent loop based on manual duration.");
        } else {
            // Optional: If audio tail extends significantly beyond manual stop, maybe warn or extend?
            // But for standard looping, we stick to the user's defined structure.
            // We'll stick to manualDurationTicks.
        }

        // AUTO-CLIP: Snap to NEAREST Bar
        // Behavior:
        // 0.9 bars -> 1 bar
        // 1.1 bars -> 1 bar
        // 3.8 bars -> 4 bars

        // AUTO-CLIP: Snap to NEAREST Bar
        // But what if the user plays a 2-bar loop but stops at 1.9 bars?
        // We want 2 bars.
        // If they stop at 2.1 bars? We want 2 bars.
        // Rounding usually works.

        const TICKS_PER_BAR = new Tone.Time("1m").toTicks(); // Dynamic based on Time Signature
        let loopBars = Math.round(targetDurationTicks / TICKS_PER_BAR);

        // Minimum 1 Bar
        if (loopBars < 1) loopBars = 1;

        const loopLengthTicks = loopBars * TICKS_PER_BAR;
        const loopString = `${loopBars}m`;

        console.log(`[Sequencer] Events: ${this.events.length}. Max Audio Ticks: ${audioDurationTicks}. Manual Ticks: ${manualDurationTicks}. Final: ${loopBars} bars.`);

        // Create Track
        if (this.events.length > 0) {
            // Quantize
            const processedEvents = this.events.map(e => {
                let relTick = e.rawTick - this.recordingStartTick;
                let quantized = relTick % loopLengthTicks;
                if (quantized < 0) quantized += loopLengthTicks;
                return {
                    time: new Tone.Time(quantized, "i").toBarsBeatsSixteenths(),
                    padId: e.padId
                };
            });

            // Pass recordingStartTick to align playback phase
            this.createTrack(processedEvents, loopString, slotIndex, this.recordingStartTick);

            // Previously we muted here. Now we keep it playing (Auto-Play).
            // Visuals are already set to 'playing' in createTrack.
            useStore.getState().setLoopSlotStatus(slotIndex, 'playing');

        } else {
            useStore.getState().setLoopSlotStatus(slotIndex, 'empty');
        }

        // Reset State
        this.activeSlotIndex = null;
        this.isWaitingForInput = false;
        useStore.getState().setIsLoopRecording(false);
    }

    recordEvent(padId) {
        if (this.activeSlotIndex === null) return;

        const currentTick = Tone.Transport.ticks;

        // Auto-Start Logic (Latched)
        if (this.isWaitingForInput) {
            // Quantize Start Time to align with Grid (e.g. 1/16 or Bar)
            // If user is slightly late, this aligns the loop start to the beat.
            const ppq = Tone.Transport.PPQ; // 192 usually
            const quantizeVal = useStore.getState().launchQuantization || '4n';

            // Convert notation to ticks (approximate or use Tone.Time)
            // '1m' = 192*4, '4n' = 192, '8n' = 96, '16n' = 48
            let gridTicks = 192; // Default 4n
            if (quantizeVal === '1m') gridTicks = 192 * 4;
            else if (quantizeVal === '2n') gridTicks = 192 * 2;
            else if (quantizeVal === '8n') gridTicks = 96;
            else if (quantizeVal === '16n') gridTicks = 48;
            else if (quantizeVal === 'none') gridTicks = 1;

            // Snap Current Tick to Nearest Grid
            let snappedTick = Math.round(currentTick / gridTicks) * gridTicks;

            // If Snapped Tick is in the future (user played very early), waiting?
            // Usually user plays LATE (latency). So valid.
            // But if user plays 10ms early (anticipation), snappedTick < currentTick.
            // Events will have (rawTick - startTick) > 0 still?
            // If startTick > rawTick, relTick is Negative. Tone.Part might fail or be weird.
            // We should ensure events are shifted correctly.

            // Fix: If snapped start is AFTER the event, we effectively need to shift the event "back"
            // or consider it "pick up"?
            // Simpler: Just force startTick <= rawTick?
            // No, if I aim for Beat 1 (Tick 768) and play at 760 (Early).
            // Snapped = 768.
            // RelTick = 760 - 768 = -8.
            // Loop Length = 1 Bar (768).
            // Quantized RelTick = -8 % 768 = 760.
            // So resizing puts it at end of bar?
            // Yes! That's what anticipation means (Pickup note at end of previous bar).
            // This is actually CORRECT behavior for looping.

            console.log(`[Sequencer] Input Detected! Raw: ${currentTick}, Snapped: ${snappedTick} (${quantizeVal})`);
            this.isWaitingForInput = false;
            this.recordingStartTick = snappedTick;

            // Visual Feedback: ARMED -> RECORDING
            useStore.getState().setLoopSlotStatus(this.activeSlotIndex, 'recording');
        }

        this.events.push({ rawTick: currentTick, padId });
        console.log(`[Sequencer] Captured Pad ${padId} (Slot ${this.activeSlotIndex})`);
    }

    createTrack(events, loopLength, slotIndex, startTick = 0) {
        // Use fixed track ID for the slot to allow overwriting/managing
        const trackId = `slot-${slotIndex}`;

        // Dispose existing if any
        if (this.tracks.has(trackId)) {
            this.tracks.get(trackId).part.dispose();
        }

        const part = new Tone.Part((time, event) => {
            // Visual trigger
            useStore.getState().setPadActive(event.padId, true);
            setTimeout(() => useStore.getState().setPadActive(event.padId, false), 100);

            // Audio trigger
            const mapping = useStore.getState().padMappings[event.padId];
            if (mapping) {
                if (['synth', 'piano', 'drums'].includes(mapping.type)) {
                    instrumentManager.trigger(event.padId, mapping.note || 'C4', '8n', time);
                } else {
                    sampler.play(event.padId, { startTime: time });
                }
            }
        }, events);

        part.loop = true;
        part.loopEnd = loopLength;

        // Fix: Start part aligned with the original recording start time
        // This ensures the loop phase matches when the user pressed the button
        const startTime = new Tone.Time(startTick, "i").toBarsBeatsSixteenths();
        part.start(startTime);

        // Store with metadata
        this.tracks.set(trackId, {
            part,
            events,
            startTick,
            loopLengthTicks: new Tone.Time(loopLength).toTicks(),
            scheduleId: null // Track pending schedule
        });

        // Update UI
        useStore.getState().setLoopSlotStatus(slotIndex, 'playing');
        console.log(`[Sequencer] Created Loop in Slot ${slotIndex} (${loopLength}) starting at ${startTime}`);
    }

    toggleMute(trackId) {
        // Extract Column Index
        let colIndex = -1;
        if (trackId.startsWith('slot-')) {
            colIndex = parseInt(trackId.replace('slot-', ''));
        } else {
            // Find in tracks? For now assume slot/col workflow for shortcuts
            // If trackId is arbitrary string, we might struggle.
            // But shortcuts pass 'slot-N'.
            return;
        }

        const trackData = this.tracks.get(trackId);
        if (!trackData) return;

        // Current State from STORE (Single Source of Truth)
        const currentMuteState = useStore.getState().trackStates.mute[colIndex];
        const willBeMuted = !currentMuteState;

        console.log(`[Sequencer] Toggle Mute Col ${colIndex}: ${currentMuteState} -> ${willBeMuted}`);

        // Update Store
        useStore.getState().toggleTrackState('mute', colIndex);

        // Apply Audio Logic
        // Ensure Context is Running
        if (Tone.context.state !== 'running') {
            Tone.start();
        }

        // Cancel previous pending schedule if any (Debounce/Fast Toggle)
        if (trackData.scheduleId !== null) {
            console.log(`[Sequencer] Cancelling pending schedule ${trackData.scheduleId}`);
            Tone.Transport.clear(trackData.scheduleId);
            trackData.scheduleId = null;
        }

        const quantization = useStore.getState().launchQuantization || '1m';

        if (willBeMuted) {
            // TARGET: MUTE (Stop)
            // Cycle-Based Stop Logic
            if (quantization === 'none' || Tone.Transport.state !== 'started') {
                trackData.part.mute = true;
                useStore.getState().setLoopSlotStatus(colIndex, 'stopped');
            } else {
                // Calculate Exact Loop Cycle End
                const currentTick = Tone.Transport.ticks;
                const startTick = trackData.startTick || 0;

                // Fallback to 1m if loopLengthTicks missing (shouldn't happen for new recordings)
                let loopLength = trackData.loopLengthTicks;
                if (!loopLength) {
                    console.warn(`[Sequencer] Missing loopLengthTicks for ${trackId}, defaulting to 1m`);
                    loopLength = new Tone.Time('1m').toTicks();
                }

                // Relative time since loop started
                const relTick = currentTick - startTick;

                // Calculate remaining ticks in current cycle
                // (relTick % loopLength) gives position within the loop [0, length)
                // remaining = length - position
                let remaining = loopLength - (relTick % loopLength);
                if (remaining <= 0) remaining = loopLength; // Should not be <= 0 unless math weirdness, but safety.

                const nextStopTick = currentTick + remaining;
                const nextStopTime = new Tone.Time(nextStopTick, 'i').toSeconds();

                console.log(`[Sequencer] Queue STOP (Mute) Col ${colIndex}`);
                console.log(`   > Current: ${currentTick}, Start: ${startTick}, Length: ${loopLength}`);
                console.log(`   > Rel: ${relTick}, Remaining: ${remaining}, Target: ${nextStopTick}`);

                // Visual: Queued
                useStore.getState().setLoopSlotStatus(colIndex, 'queued');

                // Schedule
                trackData.scheduleId = Tone.Transport.scheduleOnce(() => {
                    const currentData = this.tracks.get(trackId);
                    if (currentData) {
                        currentData.part.mute = true;
                        currentData.scheduleId = null; // Clear self
                    }
                    useStore.getState().setLoopSlotStatus(colIndex, 'stopped');
                }, nextStopTime);
            }
        } else {
            // TARGET: UNMUTE (Play)
            // 1. Check Transport
            if (quantization === 'none' || Tone.Transport.state !== 'started') {
                // Immediate
                trackData.part.mute = false;
                useStore.getState().setLoopSlotStatus(colIndex, 'playing');
            } else {
                const nextBar = Tone.Transport.nextSubdivision(quantization);
                console.log(`[Sequencer] Queue PLAY (Unmute) Col ${colIndex} at ${nextBar}`);

                // Set QUEUED state immediately
                useStore.getState().setLoopSlotStatus(colIndex, 'queued');

                // Schedule change
                trackData.scheduleId = Tone.Transport.scheduleOnce((time) => {
                    const currentData = this.tracks.get(trackId);
                    if (currentData) {
                        currentData.part.mute = false;
                        currentData.scheduleId = null;
                    }
                    useStore.getState().setLoopSlotStatus(colIndex, 'playing');
                }, nextBar);
            }
        }

        // Update Solo impacts
        // If we mute explicitly, does it affect solo?
        // Usually Solo overrides Mute.
        this.updateSoloState();
    }

    toggleSolo(trackId) {
        let colIndex = -1;
        if (trackId.startsWith('slot-')) {
            colIndex = parseInt(trackId.replace('slot-', ''));
        } else { return; }

        console.log(`[Sequencer] Toggle Solo Col ${colIndex}`);

        // Update Store
        useStore.getState().toggleTrackState('solo', colIndex);

        // Apply Logic
        this.updateSoloState();
    }

    updateSoloState() {
        const state = useStore.getState();
        const soloStates = state.trackStates.solo; // [false, false, true, ...]
        const muteStates = state.trackStates.mute; // [false, true, ...]

        const hasSolo = soloStates.includes(true);

        // Iterate all 8 columns (assuming 8 tracks max)
        for (let i = 0; i < 8; i++) {
            const trackId = `slot-${i}`;
            const trackData = this.tracks.get(trackId);
            if (!trackData) continue; // No audio for this slot

            const isThisSolo = soloStates[i];
            const isThisMuted = muteStates[i];

            if (hasSolo) {
                // SOLO MODE ACTIVE
                if (isThisSolo) {
                    // This track IS soloed -> FORCE UNMUTE (Audible)
                    trackData.part.mute = false;
                } else {
                    // This track is NOT soloed -> FORCE MUTE (Silent)
                    trackData.part.mute = true;
                }
            } else {
                // NO SOLO ACTIVE
                // Respect Manual Mute State
                trackData.part.mute = isThisMuted;

                // Sync UI Status
                // If isThisMuted is true, status 'stopped'. Else 'playing'.
                const currentStatus = state.loopSlots[i].status;
                if (currentStatus === 'playing' || currentStatus === 'stopped') {
                    // We don't force update here to avoid overriding 'queued'? 
                    // But if we toggle solo off, we should return to correct state.
                    // Let's assume toggleMute handled the visuals.
                }
            }
        }
    }

    deleteTrack(trackId) {
        const trackData = this.tracks.get(trackId);
        if (trackData) {
            trackData.part.dispose();
            this.tracks.delete(trackId);
            useStore.getState().removeTrack(trackId);
            console.log(`Deleted Track: ${trackId}`);
        }
    }

    clearSlot(slotIndex) {
        const trackId = `slot-${slotIndex}`;
        this.deleteTrack(trackId);
        useStore.getState().setLoopSlotStatus(slotIndex, 'empty');
        console.log(`[Sequencer] Cleared Slot ${slotIndex}`);
    }

    stopTrack(colIndex) {
        // 1. Loop Station Logic: If col is 0-5, Stop/Mute that slot
        if (colIndex <= 5) {
            const trackId = `slot-${colIndex}`;
            if (this.tracks.has(trackId)) {
                const trackData = this.tracks.get(trackId);
                // "Stop" for loop station means "Mute" so it stays in sync when unmuted.

                if (!trackData.part.mute) {
                    // Start Quantized Stop Logic Here too? 
                    // Usually "StopTrack" is an Immediate Panic or explicit Stop.
                    // For now, let's keep it immediate mute to avoid complexity in this fallback method.
                    // Or reuse toggleMute if we want quantized.
                    // But stopTrack implies FORCE STOP.
                    trackData.part.mute = true;
                    useStore.getState().updateTrack(trackId, { isMuted: true });
                    useStore.getState().setLoopSlotStatus(colIndex, 'stopped');
                    this.updateSoloState();
                }
                console.log(`[Sequencer] Stopped (Muted) Loop Slot ${colIndex}`);
            }
        }

        // 2. Fallback: Stop active pads in this column (Legacy / One-Shots)
        // Find track by index in store
        const tracks = useStore.getState().tracks;
        if (tracks[colIndex]) {
            const trackId = tracks[colIndex].id;
            const trackData = this.tracks.get(trackId);
            if (trackData) {
                trackData.part.stop();
                console.log(`Stopped Track ${colIndex} (${trackId})`);
            }
        } else {
            // Stop active pads
            const activePads = useStore.getState().activePads;
            Object.keys(activePads).forEach(padId => {
                if (parseInt(padId) % 8 === colIndex) {
                    import('./Sampler').then(({ sampler }) => sampler.stop(padId));
                    useStore.getState().setPadActive(padId, false);
                }
            });
        }
    }

    clearSequence() {
        this.tracks.forEach((data, id) => {
            data.part.dispose();
        });
        this.tracks.clear();
        useStore.getState().setTracks([]);
        this.events = [];
        console.log('All sequences cleared');
    }

    playScene(rowIndex) {
        console.log(`[Sequencer] Launching Scene ${rowIndex}`);
        const state = useStore.getState();
        const startPad = rowIndex * 8;
        const endPad = startPad + 7;

        // --- Scheduling Logic ---
        const quantization = state.launchQuantization;
        let startTime = undefined;
        let isImmediate = true;

        if (quantization && quantization !== 'none') {
            if (Tone.Transport.state !== 'started') {
                console.log('[Scene] Transport Stopped -> Playing Immediately & Starting Transport');
                Tone.Transport.start();
                startTime = undefined;
            } else {
                startTime = Tone.Transport.nextSubdivision(quantization);
                isImmediate = false;
                console.log(`[Scene] Scheduled for: ${startTime}`);
            }
        }

        // --- Execute ---
        for (let i = startPad; i <= endPad; i++) {
            const mapping = state.padMappings[i];
            if (!mapping) continue;

            // Strict Validation: Must have sound
            const isHasSound = mapping.file || (mapping.type && mapping.type !== 'sample');
            if (!isHasSound) continue;

            const col = i % 8;

            // 1. Find Active Sibling (Column Exclusivity)
            let activeSibling = -1;
            for (let r = 0; r < 8; r++) {
                const pId = r * 8 + col;
                if (state.activePads[pId] && pId !== i) {
                    activeSibling = pId;
                    break;
                }
            }

            // 2. Queue Visuals
            const shouldQueue = !isImmediate || activeSibling !== -1;

            if (shouldQueue) {
                // Show as Queued (Yellow/Flashing)
                state.addToQueue(i);
            } else {
                // Immediate Active
                state.setPadActive(i, true);
            }

            // 3. Audio & State Handling
            const type = mapping.type || 'sample';
            const note = mapping.note || 'C4';
            const mode = mapping.mode || 'one-shot';

            // Define The Start Logic
            const doStart = () => {
                // Clear Queue Visual
                if (shouldQueue) state.shiftQueue(col);

                // Set Active Visual
                state.setPadActive(i, true);

                // Synths handled differently (Short Flash)
                if (['synth', 'piano', 'drums'].includes(type)) {
                    instrumentManager.trigger(i, note, '8n', undefined); // Time embedded in schedule
                    setTimeout(() => state.setPadActive(i, false), 200);
                }
                else {
                    // Samples
                    let player = sampler.players.get(i);
                    if (!player) player = sampler.players.get(i.toString());
                    const isLoaded = player && player.loaded;

                    if (isLoaded) {
                        const options = {
                            onEnded: () => state.setPadActive(i, false)
                        };
                        if (mode === 'loop' || mode === 'gate') options.loop = true;

                        // Play
                        sampler.play(i, options);
                    } else {
                        // Empty/Unloaded Flash
                        setTimeout(() => state.setPadActive(i, false), 200);
                        sampler.play(i);
                    }
                }
            };

            // Define The Stop Logic (for sibling)
            const doStopSibling = () => {
                if (activeSibling !== -1) {
                    console.log(`[Scene] Stopping Sibling ${activeSibling}`);
                    sampler.stop(activeSibling);
                    state.setPadActive(activeSibling, false);
                }
            };

            // 4. Scheduling execution
            if (startTime) {
                // SCHEDULED
                Tone.Transport.scheduleOnce((time) => {
                    Tone.Draw.schedule(() => {
                        doStopSibling();
                        doStart();
                    }, time);
                }, startTime);
            } else {
                // IMMEDIATE
                doStopSibling();
                doStart();
            }
        }
    }
}

export const sequencer = new Sequencer();
