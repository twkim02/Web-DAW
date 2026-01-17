import React, { useState, useEffect } from 'react';
import { uploadFile } from '../../api/upload';
import useStore from '../../store/useStore';
import { audioEngine } from '../../audio/AudioEngine';

const VirtualPiano = ({ padId, previewMode, type, preset, instrumentManager, onClose }) => {
    // Global State
    const bpm = useStore(state => state.bpm);
    const setBpm = useStore(state => state.setBpm);
    const isMetronomeOn = useStore(state => state.isMetronomeOn);
    const setIsMetronomeOn = useStore(state => state.setIsMetronomeOn);

    // Generate scale of notes (C3 to B5)
    const OCTAVES = 3;
    const START_OCTAVE = 3;
    const [activeNotes, setActiveNotes] = useState(new Set());

    // Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Initial Load for Preview Mode
    useEffect(() => {
        if (previewMode && type) {
            instrumentManager.loadPreview(type, preset);
            return () => instrumentManager.closePreview();
        }
    }, [previewMode, type, preset]);

    // ... generateKeys ...
    const generateKeys = () => {
        const whiteKeys = [];
        const blackKeys = [];
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const keyMap = "zsxdcvgbhnjm,l.;/q2w3e4r5t6y7u8i9o0p[=]";
        let mapIndex = 0;

        for (let o = 0; o < OCTAVES; o++) {
            const octave = START_OCTAVE + o;
            notes.forEach(noteName => {
                const note = `${noteName}${octave}`;
                const isBlack = noteName.includes('#');
                const keyboardChar = keyMap[mapIndex++] || '';

                if (isBlack) {
                    blackKeys.push({ note, char: keyboardChar, octavePosition: (whiteKeys.length - 1) });
                } else {
                    whiteKeys.push({ note, char: keyboardChar });
                }
            });
        }
        return { whiteKeys, blackKeys };
    };
    const { whiteKeys, blackKeys } = generateKeys();


    // PLAYBACK
    const playNote = (note) => {
        if (!activeNotes.has(note)) {
            if (previewMode) {
                instrumentManager.startPreviewNote(note);
            } else {
                instrumentManager.startNote(padId, note);
            }
            setActiveNotes(prev => new Set(prev).add(note));
        }
    };

    const stopNote = (note) => {
        if (previewMode) {
            instrumentManager.stopPreviewNote(note);
        } else {
            instrumentManager.stopNote(padId, note);
        }
        setActiveNotes(prev => {
            const next = new Set(prev);
            next.delete(note);
            return next;
        });
    };

    const triggerLibraryRefresh = useStore(state => state.triggerLibraryRefresh);

    // RECORDING HANDLER
    const toggleRecording = async () => {
        if (isRecording) { // Stop
            setIsRecording(false);
            setIsUploading(true);
            try {
                const blob = await instrumentManager.stopRecording();
                if (blob) {
                    const file = new File([blob], `recording_${Date.now()}.webm`, { type: 'audio/webm' });
                    await uploadFile(file);
                    triggerLibraryRefresh(); // REFRESH SIDEBAR
                    alert('Recording Saved to Library!');
                }
            } catch (err) {
                console.error(err);
                alert('Save Failed');
            } finally {
                setIsUploading(false);
            }
        } else { // Start
            await instrumentManager.startRecording();
            setIsRecording(true);
        }
    };

    // KEYBOARD HANDLER
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.repeat) return; // Prevent continuous firing
            const char = e.key.toLowerCase();
            const noteObj = [...whiteKeys, ...blackKeys].find(k => k.char === char);
            if (noteObj) playNote(noteObj.note);
            if (e.key === 'Escape') onClose();
        };
        const handleKeyUp = (e) => {
            const char = e.key.toLowerCase();
            const noteObj = [...whiteKeys, ...blackKeys].find(k => k.char === char);
            if (noteObj) stopNote(noteObj.note);
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [activeNotes, previewMode]); // Update listener if mode changes

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(15px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            animation: 'fadeIn 0.2s ease'
        }}>
            {/* Header */}
            <div style={{ marginBottom: '30px', textAlign: 'center' }}>
                <h1 style={{
                    color: '#fff', margin: '0 0 10px 0',
                    fontSize: '2rem', textShadow: '0 0 20px rgba(0,255,255,0.5)'
                }}>
                    {previewMode ? `PREVIEW: ${type.toUpperCase()}` : 'VIRTUAL KEYBOARD'}
                </h1>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    {/* RECORD BUTTON */}
                    {previewMode && (
                        <button
                            onClick={toggleRecording}
                            disabled={isUploading}
                            style={{
                                background: isRecording ? '#ff3333' : '#333',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: '#fff', padding: '10px 30px', borderRadius: '30px',
                                cursor: 'pointer', marginTop: '10px',
                                fontWeight: 'bold',
                                boxShadow: isRecording ? '0 0 15px #ff0000' : 'none',
                                animation: isRecording ? 'pulse 1s infinite' : 'none'
                            }}
                        >
                            {isUploading ? 'SAVING...' : (isRecording ? 'STOP & SAVE' : 'REC ●')}
                        </button>
                    )}

                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                            color: '#fff', padding: '10px 30px', borderRadius: '30px',
                            cursor: 'pointer', marginTop: '10px',
                        }}
                    >
                        CLOSE ESC
                    </button>
                </div>
            </div>

            {/* Piano Container */}
            <div style={{
                position: 'relative',
                height: '240px',
                padding: '20px',
                background: 'rgba(20,20,20,0.8)',
                borderRadius: '15px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.1)',
                display: 'flex',
                userSelect: 'none'
            }}>
                {/* White Keys */}
                {whiteKeys.map((key) => {
                    const isActive = activeNotes.has(key.note);
                    return (
                        <div
                            key={key.note}
                            onMouseDown={() => playNote(key.note)}
                            onMouseUp={() => stopNote(key.note)}
                            onMouseLeave={() => isActive && stopNote(key.note)}
                            style={{
                                width: '60px',
                                height: '100%',
                                background: isActive ? 'linear-gradient(to bottom, #eee, #00ffff)' : 'linear-gradient(to bottom, #fff, #eee)',
                                border: '1px solid #999',
                                borderTop: 'none',
                                borderRadius: '0 0 8px 8px',
                                margin: '0 2px',
                                position: 'relative',
                                cursor: 'pointer',
                                zIndex: 1,
                                boxShadow: isActive ? '0 0 15px #00ffff' : 'inset 0 -5px 10px rgba(0,0,0,0.1)',
                                transformOrigin: 'top',
                                transform: isActive ? 'rotateX(-2deg)' : 'none'
                            }}
                        >
                            <span style={{
                                position: 'absolute', bottom: '10px', width: '100%', textAlign: 'center',
                                color: '#aaa', fontSize: '0.8rem'
                            }}>
                                {key.char.toUpperCase()}
                            </span>
                        </div>
                    );
                })}

                {/* Black Keys (Overlay) */}
                <div style={{
                    position: 'absolute',
                    top: '20px', left: '20px', right: '20px',
                    display: 'flex',
                    pointerEvents: 'none' // Let clicks pass through empty space
                }}>
                    {blackKeys.map((key) => {
                        const isActive = activeNotes.has(key.note);
                        // Calculate position: (White Key Width 60px + margin 4px) * index + offset
                        const leftPos = (key.octavePosition * 64) + 40; // 40 is roughly 2/3 of white key

                        return (
                            <div
                                key={key.note}
                                onMouseDown={() => playNote(key.note)}
                                onMouseUp={() => stopNote(key.note)}
                                onMouseLeave={() => isActive && stopNote(key.note)}
                                style={{
                                    pointerEvents: 'auto',
                                    position: 'absolute',
                                    left: `${leftPos}px`,
                                    width: '40px',
                                    height: '140px',
                                    background: isActive ? '#00ffff' : 'linear-gradient(to bottom, #333, #000)',
                                    borderRadius: '0 0 6px 6px',
                                    zIndex: 2,
                                    cursor: 'pointer',
                                    boxShadow: '2px 2px 5px rgba(0,0,0,0.5)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                <span style={{
                                    position: 'absolute', bottom: '15px', width: '100%', textAlign: 'center',
                                    color: '#fff', fontSize: '0.7rem'
                                }}>
                                    {key.char.toUpperCase()}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default VirtualPiano;
