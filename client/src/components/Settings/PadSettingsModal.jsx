import React, { useRef, useState, useEffect } from 'react';
import useStore from '../../store/useStore';
import { uploadFile } from '../../api/upload';
import { sampler } from '../../audio/Sampler';
import styles from './PadSettingsModal.module.css';

const PadSettingsModal = () => {
    const editingPadId = useStore((state) => state.editingPadId);
    const setEditingPadId = useStore((state) => state.setEditingPadId);
    const padMappings = useStore((state) => state.padMappings);
    const updatePadMapping = useStore((state) => state.updatePadMapping);

    const [step, setStep] = useState(1);
    const [selectedOctave, setSelectedOctave] = useState(4); // Default Octave 4
    const [padName, setPadName] = useState('');
    const fileInputRef = useRef(null);

    // Initial constants
    const COLORS = [
        '#FF0000', '#FF7F00', '#FFFF00',
        '#00FF00', '#00FFFF', '#0000FF',
        '#8B00FF', '#FF00FF', '#FFFFFF'
    ];
    // C4 is index 0 in Tone.js usually? standard notation.
    const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const OCTAVES = [1, 2, 3, 4, 5, 6];

    // Reset when opening
    useEffect(() => {
        if (editingPadId !== null) {
            setStep(1);
            setPadName(padMappings[editingPadId]?.name || '');
        }
    }, [editingPadId]);

    // Handle File Upload
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const response = await uploadFile(file);
            // Construct URL - in prod, server should return full URL or client needs env config
            const fileUrl = `http://localhost:3001/uploads/${response.file.filename}`;

            await sampler.loadSample(editingPadId, fileUrl);
            updatePadMapping(editingPadId, {
                file: fileUrl,
                assetId: response.file.id,
                originalName: response.file.originalName
            });
            // Auto finish after upload
            handleClose();
        } catch (err) {
            console.error(err);
            alert('Upload failed');
        }
    };

    const handleClose = () => {
        setEditingPadId(null);
        setStep(1);
    };

    const currentMapping = padMappings[editingPadId] || {};

    // Logic for handling selection 1-9
    const handleSelection = (num) => {
        // STEP 1: SOURCE TYPE
        if (step === 1) {
            if (num === 1) {
                updatePadMapping(editingPadId, { type: 'sample', mode: 'one-shot' });
                setStep(2);
            }
            if (num === 2) {
                updatePadMapping(editingPadId, { type: 'synth', mode: 'gate' });
                setStep(2);
            }
        }
        // STEP 2: MODE
        else if (step === 2) {
            const modes = ['one-shot', 'gate', 'toggle'];
            if (num <= modes.length) {
                updatePadMapping(editingPadId, { mode: modes[num - 1] });
                setStep(3);
            }
        }
        // STEP 3: COLOR
        else if (step === 3) {
            if (num <= COLORS.length) {
                updatePadMapping(editingPadId, { color: COLORS[num - 1] });
                setStep(4);
            }
        }
        // STEP 4: AUDIO SOURCE OR OCTAVE
        else if (step === 4) {
            const isSample = (!currentMapping.type || currentMapping.type === 'sample');
            if (isSample) {
                if (num === 1) {
                    if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                        fileInputRef.current.click();
                    }
                } else if (num === 2) {
                    // Go to Naming
                    setStep(6);
                }
            } else {
                // Synth Octave Selection
                if (num <= OCTAVES.length) {
                    setSelectedOctave(OCTAVES[num - 1]);
                    setStep(5);
                }
            }
        }
        // STEP 5: NOTE (Synth Only)
        else if (step === 5) {
            // ... note selection logic handled in main listener ...
            // Actually, selection via click calls this? 
            // Logic in main listener sets note and closes -> change to set Step 6
        }
    };

    // KEYBOARD LISTENER
    useEffect(() => {
        if (editingPadId === null) return;

        const handleKeyDown = (e) => {
            const code = e.code;

            if (code === 'Escape') { handleClose(); return; }
            if (code === 'Backspace') {
                if (step === 1) handleClose();
                else setStep(s => s - 1);
                return;
            }

            // Helper to extract number from code
            let num = -1;
            if (code.startsWith('Digit')) {
                num = parseInt(code.replace('Digit', ''));
            } else if (code.startsWith('Numpad')) {
                num = parseInt(code.replace('Numpad', ''));
            }

            // Normal Steps 1-4
            if (step < 5) {
                if (num >= 1 && num <= 9) {
                    handleSelection(num);
                }
            }
            // Step 5: Notes (12 items)
            else if (step === 5) {
                let noteIndex = -1;

                // 1-9
                if (num >= 1 && num <= 9) noteIndex = num - 1;

                // 0, -, = (Main keyboard)
                if (code === 'Digit0') noteIndex = 9;
                if (code === 'Minus') noteIndex = 10;
                if (code === 'Equal') noteIndex = 11;

                // 0 on Numpad
                if (code === 'Numpad0') noteIndex = 9;
                // Numpad subtract/add/others? 
                // Let's stick to main keyboard for symbols or map numpad math keys?
                if (code === 'NumpadSubtract') noteIndex = 10;
                if (code === 'NumpadAdd') noteIndex = 11;

                if (noteIndex !== -1 && noteIndex < NOTES.length) {
                    const note = NOTES[noteIndex];
                    const fullNote = `${note}${selectedOctave}`;
                    updatePadMapping(editingPadId, { note: fullNote });
                    setStep(6); // Go to Naming
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [editingPadId, step, selectedOctave]);


    if (editingPadId === null) return null;

    // RENDER HELPERS
    const renderOption = (key, label, isActive, extra = null) => (
        <div
            key={key}
            className={`${styles.optionItem} ${isActive ? styles.active : ''}`}
            onClick={() => handleSelection(key)} // Click fallback
        >
            <div className={styles.keyBadge}>{key}</div>
            <div className={styles.optionLabel}>{label}</div>
            {extra}
        </div>
    );

    return (
        <div className={styles.overlay} onClick={handleClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <header className={styles.header}>
                    <h2>Configure Pad {editingPadId}</h2>
                    <div className={styles.subHeader}>Prees Backspace to go back</div>
                </header>

                <div className={styles.content}>

                    {/* STEP 1: SOURCE */}
                    {step === 1 && (
                        <div className={styles.stepContainer}>
                            <h3 className={styles.stepTitle}>
                                1. Source Type
                                <span className={styles.stepIndicator}>Step 1/4</span>
                            </h3>
                            <div className={styles.optionList}>
                                {renderOption(1, 'Sample (Audio File)', currentMapping.type === 'sample')}
                                {renderOption(2, 'Synthesizer (Tone.js)', currentMapping.type === 'synth')}
                            </div>
                        </div>
                    )}

                    {/* STEP 2: MODE */}
                    {step === 2 && (
                        <div className={styles.stepContainer}>
                            <h3 className={styles.stepTitle}>
                                2. Play Mode
                                <span className={styles.stepIndicator}>Step 2/4</span>
                            </h3>
                            <div className={styles.optionList}>
                                {renderOption(1, 'One Shot (Play Once)', currentMapping.mode === 'one-shot')}
                                {renderOption(2, 'Gate (Hold to Play)', currentMapping.mode === 'gate')}
                                {renderOption(3, 'Toggle (Loop On/Off)', currentMapping.mode === 'toggle')}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: COLOR */}
                    {step === 3 && (
                        <div className={styles.stepContainer}>
                            <h3 className={styles.stepTitle}>
                                3. Color
                                <span className={styles.stepIndicator}>Step 3/4</span>
                            </h3>
                            <div className={styles.gridList}>
                                {COLORS.map((c, i) => (
                                    <div
                                        key={i}
                                        className={`${styles.optionItem} ${currentMapping.color === c ? styles.active : ''}`}
                                        onClick={() => handleSelection(i + 1)}
                                    >
                                        <div className={styles.keyBadge}>{i + 1}</div>
                                        <div className={styles.colorPreview} style={{ backgroundColor: c }}></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 4: SOUND (SAMPLE OR OCTAVE) */}
                    {step === 4 && (
                        <div className={styles.stepContainer}>
                            {(!currentMapping.type || currentMapping.type === 'sample') ? (
                                <>
                                    <h3 className={styles.stepTitle}>
                                        4. Audio Source
                                        <span className={styles.stepIndicator}>Step 4/4</span>
                                    </h3>
                                    <div className={styles.optionList}>
                                        {renderOption(1, 'Upload New Sound', false)}
                                        {renderOption(2, 'Keep Current & Finish', false,
                                            <span style={{ fontSize: '0.8rem', color: '#666', marginLeft: 'auto' }}>
                                                {currentMapping.originalName || 'None'}
                                            </span>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        accept="audio/*"
                                        ref={fileInputRef}
                                        className={styles.hiddenInput}
                                        onChange={handleFileChange}
                                    />
                                </>
                            ) : (
                                <>
                                    <h3 className={styles.stepTitle}>
                                        4. Select Octave
                                        <span className={styles.stepIndicator}>Step 4/5</span>
                                    </h3>
                                    <div className={styles.gridList}>
                                        {OCTAVES.map((oct) => (
                                            renderOption(oct, `Octave ${oct}`, selectedOctave === oct)
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* STEP 5: SYNTH NOTE */}
                    {step === 5 && (
                        <div className={styles.stepContainer}>
                            <h3 className={styles.stepTitle}>
                                5. Select Note
                                <span className={styles.stepIndicator}>Step 5/5</span>
                            </h3>
                            <div className={styles.gridList}>
                                {NOTES.map((note, i) => (
                                    <div
                                        key={note}
                                        className={styles.optionItem}
                                        onClick={() => {
                                            // Manual click handler if needed, usually keyboard
                                            // Simulate key press logic
                                            const fullNote = `${note}${selectedOctave}`;
                                            updatePadMapping(editingPadId, { note: fullNote });
                                            handleClose();
                                        }}
                                    >
                                        <div className={styles.keyBadge}>
                                            {i < 9 ? i + 1 : (i === 9 ? '0' : (i === 10 ? '-' : '='))}
                                        </div>
                                        <div className={styles.optionLabel}>{note}{selectedOctave}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 6: NAME (Optional) */}
                    {step === 6 && (
                        <div className={styles.stepContainer}>
                            <h3 className={styles.stepTitle}>
                                6. Name Pad
                                <span className={styles.stepIndicator}>Step 6/6</span>
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                                <input
                                    type="text"
                                    value={padName}
                                    placeholder="Type Name..."
                                    onChange={(e) => setPadName(e.target.value)}
                                    autoFocus
                                    style={{
                                        background: '#222',
                                        border: '1px solid #444',
                                        color: 'white',
                                        fontSize: '1.2rem',
                                        padding: '10px',
                                        borderRadius: '4px',
                                        textAlign: 'center',
                                        width: '80%',
                                        fontFamily: 'Orbitron, sans-serif'
                                    }}
                                    onKeyDown={(e) => {
                                        e.stopPropagation(); // Stop global listener
                                        if (e.key === 'Enter') {
                                            updatePadMapping(editingPadId, { name: padName });
                                            handleClose();
                                        }
                                    }}
                                />
                                <div style={{ fontSize: '0.8rem', color: '#888' }}>
                                    Press <b>ENTER</b> to Finish
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={styles.footer}>
                        <div>
                            <span className={styles.keyHint}>1-9</span> Select Option
                        </div>
                        <div>
                            <span className={styles.keyHint}>⌫</span> Back
                        </div>
                        <div>
                            <span className={styles.keyHint}>ESC</span> Close
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PadSettingsModal;
