import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import * as Tone from 'tone';
import { uploadFile } from '../../api/upload';
import useStore from '../../store/useStore';

const SampleEditor = ({ fileUrl, fileName, onClose, onSave, category = 'sample' }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [buffer, setBuffer] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selection, setSelection] = useState({ start: 0, end: 1 }); // 0.0 to 1.0 normalized
    const [isPlaying, setIsPlaying] = useState(false);
    const playerRef = useRef(null);
    const [isSaving, setIsSaving] = useState(false);

    // Store BPM (Global Sync)
    // Using individual selectors is better for performance
    const bpm = useStore(state => state.bpm);
    const setBpm = useStore(state => state.setBpm);

    // BPM & Snapping
    const [snapToGrid, setSnapToGrid] = useState(true);

    const [error, setError] = useState(null);

    // Load Audio
    useEffect(() => {
        const load = async () => {
            try {
                console.log("[SampleEditor] Loading:", fileUrl);
                // Fix: Custom loading promise since .toPromise() might not exist
                const buff = await new Promise((resolve, reject) => {
                    const b = new Tone.Buffer(fileUrl,
                        () => resolve(b),
                        (err) => reject(new Error("Tone.Buffer load error: " + err))
                    );
                });

                console.log("[SampleEditor] Loaded buffer:", buff);
                setBuffer(buff);
                setIsLoading(false);
            } catch (err) {
                console.error("Failed to load audio", err);
                setError(`Failed to load audio: ${err.message}`);
                setIsLoading(false);
                // Do NOT close automatically, let user see error
            }
        };
        if (fileUrl) load();
    }, [fileUrl]);

    // Draw Waveform & Grid
    useEffect(() => {
        if (!buffer || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        // Draw Background
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, width, height);

        // Draw Waveform
        const data = buffer.getChannelData(0); // Left channel
        const step = Math.ceil(data.length / width);
        const amp = height / 2;

        ctx.beginPath();
        ctx.strokeStyle = '#00ffcc';
        ctx.lineWidth = 1;

        for (let i = 0; i < width; i++) {
            let min = 1.0;
            let max = -1.0;
            for (let j = 0; j < step; j++) {
                const datum = data[(i * step) + j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }
            ctx.moveTo(i, (1 + min) * amp);
            ctx.lineTo(i, (1 + max) * amp);
        }
        ctx.stroke();

        // --- DRAW BPM GRID ---
        const duration = buffer.duration;
        const secondsPerBeat = 60 / bpm;
        const startT = selection.start * duration;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();

        // Draw beat lines starting from Start Point
        // We draw beats forward from start until end of buffer
        let beatTime = startT + secondsPerBeat;
        let beatCount = 1;

        while (beatTime < duration) {
            const beatX = (beatTime / duration) * width;
            ctx.moveTo(beatX, 0);
            ctx.lineTo(beatX, height);

            // Draw Beat Number Label
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.font = '10px sans-serif';
            ctx.fillText(`${beatCount}`, beatX + 2, height - 5);

            beatTime += secondsPerBeat;
            beatCount++;
        }
        ctx.stroke();


        // Draw Selection Overlay
        const startX = selection.start * width;
        const endX = selection.end * width;

        // Excluded regions (Dimmed)
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, startX, height);
        ctx.fillRect(endX, 0, width - endX, height);

        // Selected Region Border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(startX, 0, endX - startX, height);

        // Handles
        ctx.fillStyle = '#ff0055'; // Start Handle
        ctx.fillRect(startX - 2, 0, 4, height);
        ctx.fillStyle = '#0055ff'; // End Handle
        ctx.fillRect(endX - 2, 0, 4, height);

        // Display Current Length in Beats
        const selectedDur = (selection.end - selection.start) * duration;
        const beats = (selectedDur / secondsPerBeat).toFixed(2);

        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.fillText(`${beats} Beats`, startX + 5, 20);

    }, [buffer, selection, bpm]);

    // Mouse Interactions
    const handleMouseDown = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;

        // Determine closest handle (Start or End)
        const distStart = Math.abs(x - selection.start);
        const distEnd = Math.abs(x - selection.end);

        const mode = distStart < distEnd ? 'start' : 'end';

        const handleMouseMove = (ev) => {
            if (!buffer) return;
            const rx = (ev.clientX - rect.left) / rect.width;
            let clamped = Math.max(0, Math.min(1, rx));

            // --- SNAPPING LOGIC ---
            if (snapToGrid && mode === 'end') {
                const duration = buffer.duration;
                const secondsPerBeat = 60 / bpm;
                const startT = selection.start * duration;
                const currentT = clamped * duration;

                // Calculate nearest beat
                const timeFromStart = currentT - startT;
                if (timeFromStart > 0) {
                    // Round to nearest beat index
                    const beatIndex = Math.round(timeFromStart / secondsPerBeat);
                    if (beatIndex > 0) {
                        // Calculate snapped time
                        const snappedT = startT + (beatIndex * secondsPerBeat);
                        const snappedRatio = snappedT / duration;

                        // Apply snap if within valid range (and maybe add threshold?)
                        // User asked "clip to nearest interval", implies strong snap.
                        // Let's check distance. If beatIndex is 0, it means we are closer to start than 1st beat, which is invalid for end.
                        if (snappedRatio <= 1.0) {
                            clamped = snappedRatio;
                        }
                    }
                }
            }

            setSelection(prev => {
                if (mode === 'start') {
                    // When moving start, we strictly move start. End might re-snap on next move, but for now just move start.
                    // Ideally, moving start should shift the grid, so End might technically be "off-grid" relative to new Start until adjusted.
                    // User flow: 1. Select Start. 2. Select End (snaps to grid relative to start).
                    return { ...prev, start: Math.min(clamped, prev.end - 0.001) };
                } else {
                    return { ...prev, end: Math.max(clamped, prev.start + 0.001) };
                }
            });
        };

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    // Preview
    const togglePreview = () => {
        if (isPlaying) {
            playerRef.current?.stop();
            setIsPlaying(false);
        } else {
            if (!buffer) return;
            const duration = buffer.duration;
            const startTime = selection.start * duration;
            // const endTime = selection.end * duration;

            playerRef.current = new Tone.Player(buffer).toDestination();
            playerRef.current.fadeIn = 0.01;
            playerRef.current.fadeOut = 0.01;

            // start(when, offset, duration)
            const playDur = (selection.end - selection.start) * duration;
            playerRef.current.start(Tone.now(), startTime, playDur);

            setIsPlaying(true);
            playerRef.current.onstop = () => setIsPlaying(false);
        }
    };

    // Crop & Save
    const handleCropSave = async () => {
        if (!buffer) return;
        setIsSaving(true);

        try {
            const sampleRate = buffer.sampleRate;
            const totalDuration = buffer.duration;
            const startT = selection.start * totalDuration;
            const endT = selection.end * totalDuration;
            const newDuration = endT - startT;

            if (newDuration <= 0) throw new Error("Invalid duration");

            // Use Native OfflineAudioContext to avoid Tone.js Context Mismatch errors
            const offlineCtx = new OfflineAudioContext(
                buffer.numberOfChannels,
                Math.ceil(newDuration * sampleRate),
                sampleRate
            );

            const source = offlineCtx.createBufferSource();
            source.buffer = buffer.get(); // Get native AudioBuffer from Tone.Buffer
            source.connect(offlineCtx.destination);

            // source.start(when, offset, duration)
            source.start(0, startT, newDuration);

            const renderedBuffer = await offlineCtx.startRendering();

            const wavBlob = await bufferToWav(renderedBuffer);
            const newFile = new File([wavBlob], `cropped_${fileName || 'sample.wav'}`, { type: 'audio/wav' });

            await uploadFile(newFile, category); // Use dynamic category

            if (onSave) onSave();
            alert("File Cropped and Saved!");
            onClose();

        } catch (e) {
            console.error("Crop Save Error:", e);
            alert(`Failed to save cropped audio: ${e.message || e}`);
        } finally {
            setIsSaving(false);
        }
    };

    return ReactDOM.createPortal(
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
            zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
            <div style={{
                background: 'var(--color-bg-panel)', padding: '20px', borderRadius: 'var(--radius-lg)',
                width: '700px', display: 'flex', flexDirection: 'column', gap: '20px',
                border: 'var(--glass-border-medium)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2 style={{ margin: 0, color: '#fff' }}>Edit Sample</h2>

                    {/* BPM Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label style={{ color: '#aaa', fontSize: '0.9rem' }}>BPM Grid:</label>
                        <input
                            type="number" value={bpm} onChange={(e) => setBpm(Number(e.target.value))}
                            style={{ width: '60px', padding: '4px', background: 'var(--glass-bg-subtle)', border: 'var(--glass-border-medium)', color: 'var(--color-text-primary)', borderRadius: 'var(--radius-sm)' }}
                        />
                        <label style={{ color: '#aaa', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                            <input
                                type="checkbox" checked={snapToGrid} onChange={(e) => setSnapToGrid(e.target.checked)}
                            />
                            Snap
                        </label>
                    </div>
                </div>

                {isLoading ? (
                    <div style={{ color: '#888', textAlign: 'center', padding: '50px' }}>Loading Waveform...</div>
                ) : error ? (
                    <div style={{ color: '#ff4444', textAlign: 'center', padding: '50px' }}>
                        {error}<br />
                        <span style={{ fontSize: '0.8rem', color: '#666' }}>URL: {fileUrl}</span>
                    </div>
                ) : (
                    <div
                        ref={containerRef}
                        style={{ width: '100%', height: '250px', background: '#111', cursor: 'ew-resize', position: 'relative', borderRadius: '4px', border: '1px solid #333' }}
                        onMouseDown={handleMouseDown}
                    >
                        <canvas ref={canvasRef} width={660} height={250} />
                    </div>
                )}

                <div style={{ textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>
                    Drag <span style={{ color: '#ff0055' }}>RED</span> for Start, <span style={{ color: '#0055ff' }}>BLUE</span> for End.<br />
                    End handle snaps to BPM grid (white lines).
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                    <button onClick={togglePreview} style={{
                        padding: '10px 30px', borderRadius: 'var(--radius-full)', border: 'none',
                        background: isPlaying ? 'var(--color-accent-secondary)' : 'var(--glass-bg-medium)', color: 'var(--color-text-primary)',
                        cursor: 'pointer', fontWeight: 'bold'
                    }}>
                        {isPlaying ? 'STOP' : 'PREVIEW'}
                    </button>

                    <div style={{ flex: 1 }}></div>

                    <button onClick={onClose} style={{
                        padding: '10px 20px', borderRadius: 'var(--radius-full)', border: 'var(--glass-border-medium)',
                        background: 'transparent', color: 'var(--color-text-muted)', cursor: 'pointer'
                    }}>
                        CANCEL
                    </button>
                    <button onClick={handleCropSave} disabled={isSaving} style={{
                        padding: '10px 30px', borderRadius: 'var(--radius-full)', border: 'none',
                        background: 'var(--color-accent-primary)', color: 'var(--color-bg-dark)', fontWeight: 'bold',
                        cursor: 'pointer', opacity: isSaving ? 0.5 : 1
                    }}>
                        {isSaving ? 'SAVING...' : 'CROP & SAVE'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// Helper: AudioBuffer to WAV Blob
function bufferToWav(buffer) {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const buffer16 = new ArrayBuffer(length);
    const view = new DataView(buffer16);
    const channels = [];
    let i;
    let sample;
    let offset = 0;
    let pos = 0;

    // write WAVE header
    setUint32(0x46464952);                         // "RIFF"
    setUint32(length - 8);                         // file length - 8
    setUint32(0x45564157);                         // "WAVE"

    setUint32(0x20746d66);                         // "fmt " chunk
    setUint32(16);                                 // length = 16
    setUint16(1);                                  // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(buffer.sampleRate);
    setUint32(buffer.sampleRate * 2 * numOfChan);  // avg. bytes/sec
    setUint16(numOfChan * 2);                      // block-align
    setUint16(16);                                 // 16-bit (hardcoded in this loop)

    setUint32(0x61746164);                         // "data" - chunk
    setUint32(length - pos - 4);                   // chunk length

    // write interleaved data
    for (i = 0; i < buffer.numberOfChannels; i++)
        channels.push(buffer.getChannelData(i));

    while (pos < buffer.length) {
        for (i = 0; i < numOfChan; i++) {       // interleave channels
            sample = Math.max(-1, Math.min(1, channels[i][pos])); // clamp
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
            view.setInt16(44 + offset, sample, true);          // write 16-bit sample
            offset += 2;
        }
        pos++;
    }

    // helper for writing header
    function setUint16(data) {
        view.setUint16(pos, data, true);
        pos += 2;
    }
    function setUint32(data) {
        view.setUint32(pos, data, true);
        pos += 4;
    }

    return new Blob([buffer16], { type: "audio/wav" });
}

export default SampleEditor;
