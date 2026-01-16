import * as Tone from 'tone';
import useStore from '../store/useStore';
import { sampler } from './Sampler';

class Sequencer {
    constructor() {
        this.events = []; // Current recording events
        this.isRecording = false;
        this.tracks = new Map(); // Map<id, { part: Tone.Part, ... }>
        this.trackCounter = 1;
    }

    startRecording() {
        this.isRecording = true;
        this.events = [];
        console.log('Recording started...');
        useStore.getState().setIsRecording(true);
    }

    stopRecording() {
        if (!this.isRecording) return;
        this.isRecording = false;
        console.log('Recording stopped. Events:', this.events.length);

        if (this.events.length > 0) {
            this.createTrack(this.events);
        }

        useStore.getState().setIsRecording(false);
    }

    recordEvent(padId) {
        if (!this.isRecording) return;

        const ticks = Tone.Transport.ticks;
        const QUANTIZE_GRID = 48; // 16th note
        let quantizedTicks = Math.round(ticks / QUANTIZE_GRID) * QUANTIZE_GRID;

        const LOOP_LENGTH = 768; // 1 bar
        if (quantizedTicks >= LOOP_LENGTH) quantizedTicks = 0;

        const time = new Tone.Time(quantizedTicks, "i").toBarsBeatsSixteenths();

        // Check for duplicate at same time to avoid flanging?
        // simple push for now
        this.events.push({ time, padId });
        console.log(`Recorded Pad ${padId} at ${time}`);
    }

    createTrack(events) {
        const trackId = `track-${Date.now()}`;
        const trackName = `Loop ${this.trackCounter++}`;

        const part = new Tone.Part((time, event) => {
            // Visual trigger
            useStore.getState().setPadActive(event.padId, true);
            setTimeout(() => useStore.getState().setPadActive(event.padId, false), 100);

            // Audio trigger
            sampler.play(event.padId);
        }, events);

        part.loop = true;
        part.loopEnd = '1m';
        part.start(0);

        // Store internal reference
        this.tracks.set(trackId, { part, events });

        // Update Global Store
        useStore.getState().addTrack({
            id: trackId,
            name: trackName,
            isMuted: false,
            isSolo: false
        });

        console.log(`Created Track: ${trackName}`);
    }

    toggleMute(trackId) {
        const trackData = this.tracks.get(trackId);
        if (trackData) {
            const isMuted = !trackData.part.mute;
            trackData.part.mute = isMuted;
            useStore.getState().updateTrack(trackId, { isMuted });

            // If we are unmuting, we need to check if solo mode is active globally? 
            // Simplified: Mute overrides everything usually.
            // But if Solo is active on OTHER tracks, unmuting this shouldn't necessarily hear it?
            // Let's stick to simple Mute/Solo logic:
            // Mute = silence this.
            // Solo = silence everyone else.

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
}

export const sequencer = new Sequencer();
