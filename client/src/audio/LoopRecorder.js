import * as Tone from 'tone';
import { audioEngine } from './AudioEngine';

class LoopRecorder {
    constructor() {
        this.recorder = null;
        this.chunks = [];
        this.isRecording = false;
        this.onProgress = null; // (progress 0-1) => void
    }

    // Start recording at the next bar, for a specific duration (in bars)
    async recordLoop(bars = 4, onComplete, onProgress) {
        if (this.isRecording) return;

        // 1. Get Audio Stream
        const stream = audioEngine.getAudioStream();
        if (!stream) {
            console.error('No audio stream available');
            return;
        }

        this.recorder = new MediaRecorder(stream);
        this.chunks = [];
        this.onProgress = onProgress || (() => { });

        this.recorder.ondataavailable = (e) => {
            if (e.data.size > 0) this.chunks.push(e.data);
        };

        this.recorder.onstop = () => {
            const blob = new Blob(this.chunks, { type: 'audio/webm' });
            this.isRecording = false;
            if (onComplete) onComplete(blob);
        };

        // 2. Schedule Start (Next Bar)
        const nextBar = Tone.Transport.nextSubdivision("1m"); // Next Measure

        // Duration in Seconds
        const oneBarDuration = Tone.Time("1m").toSeconds();
        const duration = oneBarDuration * bars;

        // Visual Countdown logic
        // We can't easily animate standard Tone events, so we rely on Transport time checking externally or simplified callbacks?
        // Let's use Tone.Transport.schedule for start/stop

        console.log(`[LoopRecorder] Scheduled to start at ${nextBar} for ${bars} bars`);

        Tone.Transport.scheduleOnce((time) => {
            this.start();
            // Schedule Stop
            Tone.Transport.scheduleOnce((stopTime) => {
                this.stop();
            }, `+${bars}m`); // Relative to now (start time)
        }, nextBar);

        // Progress Ticker
        // Ideally we'd use Tone.Draw or requestAnimationFrame loop that checks Transport.seconds
    }

    start() {
        if (!this.recorder || this.recorder.state === 'recording') return;
        this.recorder.start();
        this.isRecording = true;
        console.log('[LoopRecorder] Started');
    }

    stop() {
        if (!this.recorder || this.recorder.state === 'inactive') return;
        this.recorder.stop();
        console.log('[LoopRecorder] Stopped');
    }

    cancel() {
        if (this.recorder && this.recorder.state === 'recording') {
            this.recorder.stop();
        }
        this.isRecording = false;
        // Optionally clear scheduled events if we tracked their IDs
    }
}

export const loopRecorder = new LoopRecorder();
