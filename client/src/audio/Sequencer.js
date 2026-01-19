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
        useStore.getState().setLoopSlotStatus(index, 'recording');
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

        const recordingEndTick = Tone.Transport.ticks;
        // Logic: Duration = End - Start
        const durationTicks = recordingEndTick - this.recordingStartTick;

        // Smart Length Calculation: Snap to NEAREST Bar
        const TICKS_PER_BAR = 192 * 4; // 768 ticks
        let loopBars = Math.round(durationTicks / TICKS_PER_BAR);

        // Minimum 1 Bar
        if (loopBars < 1) loopBars = 1;

        const loopLengthTicks = loopBars * TICKS_PER_BAR;
        const loopString = `${loopBars}m`;

        console.log(`[Sequencer] Raw Duration: ${durationTicks}. Snapped to ${loopBars} bars (${loopLengthTicks} ticks).`);

        if (this.events.length > 0) {
            // Quantize and Normalize Events
            const processedEvents = this.events.map(e => {
                let relTick = e.rawTick - this.recordingStartTick;

                // NO QUANTIZATION (Human Feel)
                // Just keep relative tick
                let quantized = relTick;

                // 2. Wrap/Clamp to Loop Length
                quantized = quantized % loopLengthTicks;

                // Safety
                if (quantized < 0) quantized += loopLengthTicks;

                return {
                    time: new Tone.Time(quantized, "i").toBarsBeatsSixteenths(),
                    padId: e.padId
                };
            });

            this.createTrack(processedEvents, loopString, slotIndex);
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

        // Auto-Start Logic
        if (this.isWaitingForInput) {
            console.log(`[Sequencer] Input Detected! Starting Recording at ${currentTick}`);
            this.isWaitingForInput = false;
            this.recordingStartTick = currentTick;
            // The first event is effectively at 0 relative time, but we store raw tick.
        }

        this.events.push({ rawTick: currentTick, padId });
        console.log(`[Sequencer] Captured Pad ${padId} (Slot ${this.activeSlotIndex})`);
    }

    createTrack(events, loopLength, slotIndex) {
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
        part.start(0);

        // Store
        this.tracks.set(trackId, { part, events });

        // Update UI
        useStore.getState().setLoopSlotStatus(slotIndex, 'playing');
        console.log(`[Sequencer] Created Loop in Slot ${slotIndex} (${loopLength})`);
    }

    toggleMute(trackId) {
        const trackData = this.tracks.get(trackId);
        if (trackData) {
            const isMuted = !trackData.part.mute;
            trackData.part.mute = isMuted;
            useStore.getState().updateTrack(trackId, { isMuted });

            // If it's a Loop Slot, update UI status (Playing <-> Stopped)
            if (trackId.startsWith('slot-')) {
                const slotIndex = parseInt(trackId.replace('slot-', ''));
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
                // "Stop" usually means Stop Playback & Reset
                // For Loop Station in this UI, we treat "Stopped" as "Muted/Paused".
                // Let's force Mute = true (Status = Stopped)
                if (!trackData.part.mute) {
                    this.toggleMute(trackId); // Use toggle logic to sync UI
                }
                console.log(`[Sequencer] Stopped Loop Slot ${colIndex}`);
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

            // Visual Feedback (Immediate or Scheduled? Visuals usually immediate for "pressed" state)
            useStore.getState().setPadActive(i, true);
            // If scheduled, maybe keep it active until play starts? 
            // For now, simple flash.
            setTimeout(() => useStore.getState().setPadActive(i, false), 200);

            // Audio Trigger
            if (['synth', 'piano', 'drums'].includes(type)) {
                instrumentManager.trigger(i, note, '8n', startTime);
            } else {
                // Check if sample handles startTime
                // If it's a loop mode, we might want to loop it?
                // Scene launch usually plays loops.
                // For now, respect pad mode.
                const mode = mapping.mode || 'one-shot';
                const options = { startTime: startTime };
                if (mode === 'loop' || mode === 'gate') options.loop = true;

                sampler.play(i, options);
            }
        }
    }
}

export const sequencer = new Sequencer();
