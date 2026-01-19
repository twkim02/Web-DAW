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
            // User said: "Press sub button to replay loop".
            // If playing, maybe Mute/Stop?
            // If stopped, Play.
            // Let's implement Mute Toggle for now, or Restart?
            // "Rec stops... later sub button press -> loop repeats".
            // Usually Loop Station button: Press = Play/Overdub (if supported) or Play/Stop.
            // Let's do Play/Stop (Mute).
            const trackId = `slot-${slotIndex}`;
            this.toggleMute(trackId);

            // Visual Update
            const trackData = this.tracks.get(trackId);
            const isMuted = trackData ? trackData.part.mute : true;
            useStore.getState().setLoopSlotStatus(slotIndex, isMuted ? 'stopped' : 'playing');
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
        useStore.getState().setLoopSlotStatus(index, 'armed'); // CHANGED: recording -> armed
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
        // Priority: Audio Tail > Manual Stop (unless audio is empty)
        let targetDurationTicks = audioDurationTicks;

        // Fallback: If no audio events or very short audio, use manual duration
        // Current manual duration
        const manualDurationTicks = Tone.Transport.ticks - startTick;

        if (!hasAudioEvents || targetDurationTicks < 192) { // Less than 1 beat?
            console.log("[Sequencer] Audio analysis empty or too short. Using manual duration.");
            targetDurationTicks = manualDurationTicks;
            // If manual duration is also tiny, default to 1 bar
            if (targetDurationTicks < 192) targetDurationTicks = 192 * 4;
        }

        // AUTO-CLIP: Snap to NEAREST Bar
        // But what if the user plays a 2-bar loop but stops at 1.9 bars? 
        // We want 2 bars.
        // If they stop at 2.1 bars? We want 2 bars.
        // Rounding usually works.

        const TICKS_PER_BAR = 192 * 4; // 768 ticks
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

            // Set to Stopped (Muted) initially.
            const trackId = `slot-${slotIndex}`;
            const trackData = this.tracks.get(trackId);
            if (trackData) {
                trackData.part.mute = true;
                useStore.getState().updateTrack(trackId, { isMuted: true });
                useStore.getState().setLoopSlotStatus(slotIndex, 'stopped');
            }

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
            console.log(`[Sequencer] Input Detected! Starting Recording at ${currentTick}`);
            this.isWaitingForInput = false;
            this.recordingStartTick = currentTick;

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

        // Store
        this.tracks.set(trackId, { part, events });

        // Update UI
        useStore.getState().setLoopSlotStatus(slotIndex, 'playing');
        console.log(`[Sequencer] Created Loop in Slot ${slotIndex} (${loopLength}) starting at ${startTime}`);
    }

    toggleMute(trackId) {
        const trackData = this.tracks.get(trackId);
        if (trackData) {
            const isMuted = !trackData.part.mute;
            trackData.part.mute = isMuted;
            useStore.getState().updateTrack(trackId, { isMuted });

            // If unmuting, ensure the part is started?
            // Tone.Part runs on Transport. If Transport is running, part runs.
            // But if we stopped the part manually elsewhere?

            // If it's a Loop Slot, update UI status (Playing <-> Stopped)
            if (trackId.startsWith('slot-')) {
                const slotIndex = parseInt(trackId.replace('slot-', ''));

                // If we are unmuting (Playing), make sure Transport is running
                if (!isMuted) {
                    if (Tone.Transport.state !== 'started') {
                        Tone.Transport.start();
                    }
                    // Ensure part is started (in case it was stopped?)
                    // part.start(0) is usually enough.
                    // But mute is just audio silence, part still processes events.
                }

                useStore.getState().setLoopSlotStatus(slotIndex, isMuted ? 'stopped' : 'playing');
            }

            // If we have solos, we need to re-evaluate everyone's mute state.
            this.updateSoloState();
        }
    }

    toggleSolo(trackId) {
        // Toggle UI state first
        const currentTracks = useStore.getState().tracks;
        const track = currentTracks.find(t => t.id === trackId);
        if (!track) return;

        const newSoloState = !track.isSolo;
        useStore.getState().updateTrack(trackId, { isSolo: newSoloState });

        // Apply logic
        this.updateSoloState();
    }

    updateSoloState() {
        const storeTracks = useStore.getState().tracks;
        const soloedTracks = storeTracks.filter(t => t.isSolo);
        const hasSolo = soloedTracks.length > 0;

        storeTracks.forEach(t => {
            const trackData = this.tracks.get(t.id);
            if (!trackData) return;

            if (hasSolo) {
                // If there are solo tracks, mute everyone who is NOT solo
                // AND adhere to their manual mute? 
                // Typically Solo overrides Mute, or effectively mutes non-solos.
                if (t.isSolo) {
                    trackData.part.mute = t.isMuted; // Respect manual mute even in solo? Or force unmute? usually solo = audible
                    trackData.part.mute = false; // Force audible if soloed
                } else {
                    trackData.part.mute = true; // Implicit mute
                }
            } else {
                // No solor, just respect manual mute
                trackData.part.mute = t.isMuted; // Restore manual mute state
            }
        });
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

    /**
     * Stop a specific track (Column 0-7)
     * In reality, tracks might not align 1:1 with columns if created dynamically.
     * But for Launchpad Grid workflow, we assume Column N = Track N.
     * We need to map Column Index to Track ID?
     * For now, let's just stop ALL clips in that column?
     * Or if we have `useStore.tracks` as an array, we can index it.
     */
    stopTrack(colIndex) {
        // 1. Loop Station Logic: If col is 0-5, Stop/Mute that slot
        if (colIndex <= 5) {
            const trackId = `slot-${colIndex}`;
            if (this.tracks.has(trackId)) {
                const trackData = this.tracks.get(trackId);
                // "Stop" for loop station means "Mute" so it stays in sync when unmuted.
                // We do NOT want to actually stop the part or reset transport time.

                if (!trackData.part.mute) {
                    // Manually Mute without toggling (force mute)
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
        // Clear ALL tracks? The user asked to clear sequence before, now we have tracks.
        // Let's interpret "ClearButton" as "Clear All" or maybe remove it in favor of track delete?
        // For now, keep it as "Clear All Tracks"
        this.tracks.forEach((data, id) => {
            data.part.dispose();
        });
        this.tracks.clear();
        useStore.getState().setTracks([]);
        this.events = [];
        console.log('All sequences cleared');
    }

    // Removed createLoop() as it is replaced by createTrack()

    /**
     * Launch a Scene (Row)
     * @param {number} rowIndex 0-7
     */
    playScene(rowIndex) {
        console.log(`[Sequencer] Launching Scene ${rowIndex}`);
        const state = useStore.getState();
        const startPad = rowIndex * 8;
        const endPad = startPad + 7;

        // --- Scheduling Logic (Same as usePadTrigger) ---
        const quantization = state.launchQuantization;
        let startTime = undefined;

        if (quantization && quantization !== 'none') {
            if (Tone.Transport.state !== 'started') {
                console.log('[Scene] Transport Stopped -> Playing Immediately & Starting Transport');
                Tone.Transport.start();
                startTime = undefined;
            } else {
                startTime = Tone.Transport.nextSubdivision(quantization);
                console.log(`[Scene] Scheduled for: ${startTime}`);
            }
        }
        // ------------------------------------------------

        for (let i = startPad; i <= endPad; i++) {
            const mapping = state.padMappings[i];
            if (!mapping || (!mapping.file && !mapping.type)) continue;

            const type = mapping.type || 'sample';
            const note = mapping.note || 'C4';

            // Determine Mode
            const mode = mapping.mode || 'one-shot';

            // Visual Feedback
            useStore.getState().setPadActive(i, true);

            // Only auto-off visuals if NOT looping/toggling
            if (mode !== 'loop' && mode !== 'toggle') {
                setTimeout(() => useStore.getState().setPadActive(i, false), 200);
            }

            // Audio Trigger
            if (['synth', 'piano', 'drums'].includes(type)) {
                instrumentManager.trigger(i, note, '8n', startTime);
            } else {
                const options = {
                    startTime: startTime,
                    // Ensure light turns off when sample stops (for loops or long one-shots if we wanted)
                    onEnded: () => useStore.getState().setPadActive(i, false)
                };

                if (mode === 'loop' || mode === 'gate') options.loop = true;

                sampler.play(i, options);
            }
        }
    }
}

export const sequencer = new Sequencer();
