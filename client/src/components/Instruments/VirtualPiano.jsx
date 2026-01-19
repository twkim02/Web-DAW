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
    // const OCTAVES = 3; // Deprecated by Dual Row logic

    // OCTAVE SHIFT STATE
    const [octaveOffset, setOctaveOffset] = useState(0); // -2 to +2
    const MIN_OFFSET = -2;
    const MAX_OFFSET = 2;

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

    // Generate Dual Row Layout
    // Row 1 (Bottom): Z X C V B N M (C3 - B3)
    // Row 2 (Top):    Q W E R T Y U (C4 - B4)
    // Plus corresponding black keys
    const generateKeys = () => {
        const whiteKeys = [];
        const blackKeys = [];

        // Definition helper
        const addKey = (noteName, char, visualIndex, rowOffset, baseOctave) => {
            // Apply Octave Offset
            const currentOctave = baseOctave + octaveOffset;
            const note = `${noteName}${currentOctave}`;

            const isBlack = noteName.includes('#');
            if (isBlack) {
                // Black keys position relative to previous white key index
                // We need to find the visual index.
                // Simplified: We store them and render absolutely
                blackKeys.push({ note, char, octaveIndex: visualIndex, rowOffset });
            } else {
                whiteKeys.push({ note, char, octaveIndex: visualIndex, rowOffset });
            }
        };

        // LOWER OCTAVE (C3 - E4 range roughly, let's Stick to C3-B3 for clean row?)
        // Standard "Typing Piano":
        // Row 1 (Lower): Z, X, C, V, B, N, M, ,, ., / -> C3, D3, E3, F3, G3, A3, B3, C4, D4, E4
        // Black 1:       S, D, G, H, J, L, ;           -> C#3, D#3, F#3, G#3, A#3, C#4, D#4

        // UPPER OCTAVE (C4 - E5)
        // Row 2 (Upper): Q, W, E, R, T, Y, U, I, O, P -> C4, D4, E4, F4, G4, A4, B4, C5, D5, E5
        // Black 2:       2, 3, 5, 6, 7, 9, 0          -> C#4, D#4, F#4, G#4, A#4, C#5, D#5

        // NOTE: There is overlap at C4. This is intentional for "Dual Manual" feel.

        // MAPPINGS
        // Row 1 (Lower): Base Octave 3 (C3-E4)
        const LOWER_WHITE = [
            { n: 'C', k: 'z' }, { n: 'D', k: 'x' }, { n: 'E', k: 'c' }, { n: 'F', k: 'v' },
            { n: 'G', k: 'b' }, { n: 'A', k: 'n' }, { n: 'B', k: 'm' },
            { n: 'C', k: ',' }, { n: 'D', k: '.' }, { n: 'E', k: '/' }
        ];
        // Lower octave starts at 3. The notes after B3 are C4, D4, E4.
        // We need careful octave handling for the crossover.

        const LOWER_BLACK = [
            { n: 'C#', k: 's', ref: 0 }, { n: 'D#', k: 'd', ref: 1 },
            { n: 'F#', k: 'g', ref: 3 }, { n: 'G#', k: 'h', ref: 4 }, { n: 'A#', k: 'j', ref: 5 },
            { n: 'C#', k: 'l', ref: 7 }, { n: 'D#', k: ';', ref: 8 }
        ];

        // Row 2 (Upper): Base Octave 4 (C4-E5)
        const UPPER_WHITE = [
            { n: 'C', k: 'q' }, { n: 'D', k: 'w' }, { n: 'E', k: 'e' }, { n: 'F', k: 'r' },
            { n: 'G', k: 't' }, { n: 'A', k: 'y' }, { n: 'B', k: 'u' },
            { n: 'C', k: 'i' }, { n: 'D', k: 'o' }, { n: 'E', k: 'p' }
        ];
        const UPPER_BLACK = [
            { n: 'C#', k: '2', ref: 0 }, { n: 'D#', k: '3', ref: 1 },
            { n: 'F#', k: '5', ref: 3 }, { n: 'G#', k: '6', ref: 4 }, { n: 'A#', k: '7', ref: 5 },
            { n: 'C#', k: '9', ref: 7 }, { n: 'D#', k: '0', ref: 8 }
        ];

        // Process Lower
        LOWER_WHITE.forEach((k, i) => {
            const octaveAdd = i >= 7 ? 1 : 0; // C4, D4, E4 are +1 octave from C3 base
            addKey(k.n, k.k, i, 0, 3 + octaveAdd);
        });
        LOWER_BLACK.forEach((k) => {
            const octaveAdd = k.ref >= 7 ? 1 : 0;
            addKey(k.n, k.k, k.ref, 0, 3 + octaveAdd);
        });

        // Process Upper
        UPPER_WHITE.forEach((k, i) => {
            const octaveAdd = i >= 7 ? 1 : 0;
            addKey(k.n, k.k, i, 1, 4 + octaveAdd);
        });
        UPPER_BLACK.forEach((k) => {
            const octaveAdd = k.ref >= 7 ? 1 : 0;
            addKey(k.n, k.k, k.ref, 1, 4 + octaveAdd);
        });

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
                    // Determine category based on type
                    const category = type === 'synth' ? 'synth' : 'instrument';
                    await uploadFile(file, category);
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

            // Octave Shift
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setOctaveOffset(prev => Math.min(prev + 1, MAX_OFFSET));
                return;
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setOctaveOffset(prev => Math.max(prev - 1, MIN_OFFSET));
                return;
            }

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
    }, [activeNotes, previewMode, octaveOffset]); // Depend on Offset

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(20px)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            animation: 'fadeIn 0.2s ease'
        }}>
            {/* Header */}
            <div style={{ marginBottom: '20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                <h1 style={{
                    color: '#fff', margin: 0,
                    fontSize: '2rem', textShadow: '0 0 20px rgba(0,255,255,0.5)'
                }}>
                    {previewMode ? `PREVIEW: ${type.toUpperCase()}` : 'VIRTUAL KEYBOARD'}
                </h1>

                {/* Controls Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', background: 'rgba(255,255,255,0.05)', padding: '10px 20px', borderRadius: '10px' }}>

                    {/* OCTAVE CONTROLS */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ color: '#aaa', fontSize: '0.8rem', marginRight: '5px', fontWeight: 'bold' }}>OCTAVE</span>
                        <button
                            onClick={() => setOctaveOffset(p => Math.max(p - 1, MIN_OFFSET))}
                            style={{
                                background: '#333', border: '1px solid #555', color: '#fff',
                                padding: '5px 10px', borderRadius: '4px', cursor: 'pointer',
                                opacity: octaveOffset <= MIN_OFFSET ? 0.5 : 1
                            }}
                        >
                            - <span style={{ fontSize: '0.7rem', color: '#888' }}>(↓)</span>
                        </button>

                        <div style={{
                            width: '40px', textAlign: 'center', fontWeight: 'bold',
                            color: octaveOffset === 0 ? '#fff' : (octaveOffset > 0 ? '#00ffff' : '#ffaa00')
                        }}>
                            {octaveOffset > 0 ? `+${octaveOffset}` : octaveOffset}
                        </div>

                        <button
                            onClick={() => setOctaveOffset(p => Math.min(p + 1, MAX_OFFSET))}
                            style={{
                                background: '#333', border: '1px solid #555', color: '#fff',
                                padding: '5px 10px', borderRadius: '4px', cursor: 'pointer',
                                opacity: octaveOffset >= MAX_OFFSET ? 0.5 : 1
                            }}
                        >
                            + <span style={{ fontSize: '0.7rem', color: '#888' }}>(↑)</span>
                        </button>
                    </div>

                    <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.2)' }}></div>

                    {/* RECORD & CLOSE */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {previewMode && (
                            <button
                                onClick={toggleRecording}
                                disabled={isUploading}
                                style={{
                                    background: isRecording ? '#ff3333' : '#333',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    color: '#fff', padding: '5px 20px', borderRadius: '20px',
                                    cursor: 'pointer', fontWeight: 'bold',
                                    boxShadow: isRecording ? '0 0 15px #ff0000' : 'none',
                                    animation: isRecording ? 'pulse 1s infinite' : 'none'
                                }}
                            >
                                {isUploading ? 'SAVING...' : (isRecording ? 'STOP' : 'REC ●')}
                            </button>
                        )}

                        <button
                            onClick={onClose}
                            style={{
                                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                                color: '#fff', padding: '5px 20px', borderRadius: '20px',
                                cursor: 'pointer'
                            }}
                        >
                            CLOSE
                        </button>
                    </div>
                </div>
            </div>

            {/* Piano Container */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Visual Hint */}
                <div style={{ color: '#888', textAlign: 'center', fontSize: '0.9rem', marginBottom: '5px' }}>
                    Upper Row (QWERTY) &nbsp;&nbsp; | &nbsp;&nbsp; Lower Row (ASDF / ZXCV)
                </div>

                {/* ROW 2 (UPPER) - C4-E5 */}
                <PianoRow
                    whiteKeys={whiteKeys.filter(k => k.rowOffset === 1)}
                    blackKeys={blackKeys.filter(k => k.rowOffset === 1)}
                    activeNotes={activeNotes}
                    playNote={playNote}
                    stopNote={stopNote}
                    label="UPPER"
                />

                {/* ROW 1 (LOWER) - C3-E4 */}
                <PianoRow
                    whiteKeys={whiteKeys.filter(k => k.rowOffset === 0)}
                    blackKeys={blackKeys.filter(k => k.rowOffset === 0)}
                    activeNotes={activeNotes}
                    playNote={playNote}
                    stopNote={stopNote}
                    label="LOWER"
                />

            </div>
        </div>
    );
};

// Helper Component for a Single Octave Row
const PianoRow = ({ whiteKeys, blackKeys, activeNotes, playNote, stopNote, label }) => {
    return (
        <div style={{
            position: 'relative',
            height: '180px',
            padding: '10px 20px 20px 20px',
            background: 'rgba(30,30,30,0.8)',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1)',
            display: 'flex',
            userSelect: 'none',
            justifyContent: 'center'
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
                            background: isActive ? 'linear-gradient(to bottom, #eee, #00ffff)' : 'linear-gradient(to bottom, #fff, #ddd)',
                            border: '1px solid #777',
                            borderTop: 'none',
                            borderRadius: '0 0 8px 8px',
                            margin: '0 1px',
                            position: 'relative',
                            cursor: 'pointer',
                            zIndex: 1,
                            boxShadow: isActive ? '0 0 20px #00ffff inset' : 'inset 0 -5px 10px rgba(0,0,0,0.1)',
                            transformOrigin: 'top',
                            transform: isActive ? 'rotateX(-5deg) translateY(2px)' : 'none',
                            transition: 'all 0.05s'
                        }}
                    >
                        {/* Note Label */}
                        <span style={{
                            position: 'absolute', bottom: '25px', width: '100%', textAlign: 'center',
                            color: isActive ? '#000' : '#aaa', fontSize: '0.7rem', fontWeight: 'bold'
                        }}>
                            {key.note}
                        </span>
                        {/* Key Char Label - ENHANCED VISIBILITY */}
                        <span style={{
                            position: 'absolute', bottom: '5px', width: '100%', textAlign: 'center',
                            color: isActive ? '#000' : '#444', fontSize: '1.1rem', fontWeight: '900'
                        }}>
                            {key.char.toUpperCase()}
                        </span>
                    </div>
                );
            })}

            {/* Black Keys (Overlay) */}
            <div style={{
                position: 'absolute',
                top: '10px', left: '20px', right: '20px',
                display: 'flex',
                justifyContent: 'center', // Center alginment matching white keys
                pointerEvents: 'none'
            }}>
                {/* We map relative to the white key container start. 
                    Since we use Flexbox for white keys, absolute positioning needs careful calc.
                    Or better: Put black keys inside the mapped white keys? No, overlap issues.
                    We iterate black keys and calculate Position.
                    Calculation: (Index * (Width + Margin)) + Offset
                    White Key Width: 60px + 2px margin = 62px space.
                    Black Key Center ~= Between White Key i and i+1.
                    Left = (i * 62) + 40 ?
                */}
                <div style={{ position: 'relative', width: `${whiteKeys.length * 62}px`, height: '100%' }}>
                    {blackKeys.map((key) => {
                        const isActive = activeNotes.has(key.note);
                        const leftPos = (key.octaveIndex * 62) + 38; // Adjusted visually

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
                                    width: '42px',
                                    height: '100px',
                                    background: isActive ? '#00ffff' : 'linear-gradient(to bottom, #444, #111)',
                                    borderRadius: '0 0 6px 6px',
                                    zIndex: 2,
                                    cursor: 'pointer',
                                    boxShadow: '3px 3px 8px rgba(0,0,0,0.6)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    transform: isActive ? 'translateY(2px)' : 'none',
                                    transition: 'all 0.05s'
                                }}
                            >
                                {/* Key Char Label - ENHANCED VISIBILITY */}
                                <span style={{
                                    position: 'absolute', bottom: '10px', width: '100%', textAlign: 'center',
                                    color: isActive ? '#000' : '#ffcc00', // Yellow for high contrast on black
                                    fontSize: '1rem', fontWeight: '900',
                                    textShadow: '0px 1px 2px black'
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
