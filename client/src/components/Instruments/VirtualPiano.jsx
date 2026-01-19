import React, { useState, useEffect } from 'react';
import { uploadFile } from '../../api/upload';
import useStore from '../../store/useStore';
import { audioEngine } from '../../audio/AudioEngine';
import styles from './VirtualPiano.module.css';

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
            const blob = await instrumentManager.stopRecording();
            setIsRecording(false);

            if (blob) {
                // Prompt for name
                const defaultName = `${type}_${new Date().toISOString().slice(0, 10)}`;
                const name = window.prompt("Enter a name for your recording:", defaultName);

                if (!name) return; // User cancelled

                setIsUploading(true);
                try {
                    const file = new File([blob], `${name}.webm`, { type: 'audio/webm' });
                    // Determine category based on type
                    const category = type === 'synth' ? 'synth' : 'instrument';
                    await uploadFile(file, category);
                    triggerLibraryRefresh(); // REFRESH SIDEBAR
                    alert('Recording Saved to Library!');
                } catch (err) {
                    console.error(err);
                    alert('Save Failed');
                } finally {
                    setIsUploading(false);
                }
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
        <div className={styles.overlay}>
            {/* Header */}
            <div className={styles.headerContainer}>
                <h1 className={styles.title}>
                    {previewMode ? `PREVIEW: ${type.toUpperCase()}` : 'VIRTUAL KEYBOARD'}
                </h1>

                {/* Controls Row */}
                <div className={styles.controlsBar}>

                    {/* OCTAVE CONTROLS */}
                    <div className={styles.octaveControls}>
                        <span className={styles.octaveLabel}>OCTAVE</span>
                        <button
                            onClick={() => setOctaveOffset(p => Math.max(p - 1, MIN_OFFSET))}
                            className={`${styles.controlBtn} ${octaveOffset <= MIN_OFFSET ? styles.disabled : ''}`}
                        >
                            - <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>(↓)</span>
                        </button>

                        <div className={styles.octaveDisplay} style={{
                            color: octaveOffset === 0 ? '#fff' : (octaveOffset > 0 ? '#00ffff' : '#ffaa00')
                        }}>
                            {octaveOffset > 0 ? `+${octaveOffset}` : octaveOffset}
                        </div>

                        <button
                            onClick={() => setOctaveOffset(p => Math.min(p + 1, MAX_OFFSET))}
                            className={`${styles.controlBtn} ${octaveOffset >= MAX_OFFSET ? styles.disabled : ''}`}
                        >
                            + <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>(↑)</span>
                        </button>
                    </div>

                    <div className={styles.divider}></div>

                    {/* RECORD & CLOSE */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {previewMode && (
                            <button
                                onClick={toggleRecording}
                                disabled={isUploading}
                                className={`${styles.actionBtn} ${styles.recordBtn} ${isRecording ? styles.recording : ''}`}
                            >
                                {isUploading ? 'SAVING...' : (isRecording ? 'STOP' : <>REC ●</>)}
                            </button>
                        )}

                        <button
                            onClick={onClose}
                            className={`${styles.actionBtn} ${styles.closeBtn}`}
                        >
                            CLOSE
                        </button>
                    </div>
                </div>
            </div>

            {/* Piano Container */}
            <div className={styles.pianoContainer}>

                {/* Visual Hint */}
                <div className={styles.hintText}>
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
        <div className={styles.pianoRow}>
            {/* White Keys */}
            {whiteKeys.map((key) => {
                const isActive = activeNotes.has(key.note);
                return (
                    <div
                        key={key.note}
                        onMouseDown={() => playNote(key.note)}
                        onMouseUp={() => stopNote(key.note)}
                        onMouseLeave={() => isActive && stopNote(key.note)}
                        className={`${styles.whiteKey} ${isActive ? styles.active : ''}`}
                    >
                        {/* Note Label */}
                        <span className={styles.noteLabel}>
                            {key.note}
                        </span>
                        {/* Key Char Label - ENHANCED VISIBILITY */}
                        <span className={styles.keyCharLabel}>
                            {key.char.toUpperCase()}
                        </span>
                    </div>
                );
            })}

            {/* Black Keys (Overlay) */}
            <div className={styles.blackKeyContainer}>
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
                                className={`${styles.blackKey} ${isActive ? styles.active : ''}`}
                                style={{
                                    left: `${leftPos}px`,
                                }}
                            >
                                {/* Key Char Label - ENHANCED VISIBILITY */}
                                <span className={styles.blackKeyCharLabel}>
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
