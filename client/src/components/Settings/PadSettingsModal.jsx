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
    const fileInputRef = useRef(null);

    // Reset step when opening for a new pad
    useEffect(() => {
        if (editingPadId !== null) {
            setStep(1);
        }
    }, [editingPadId]);

    // If no pad is being edited, don't render
    if (editingPadId === null) return null;

    const currentMapping = padMappings[editingPadId] || {};

    const handleClose = () => {
        setEditingPadId(null);
    };

    const nextStep = () => setStep(s => s + 1);
    const prevStep = () => setStep(s => s - 1);

    // Handlers
    const handleTypeChange = (e) => updatePadMapping(editingPadId, { type: e.target.value });
    const handleModeChange = (e) => updatePadMapping(editingPadId, { mode: e.target.value });
    const handleVolumeChange = (e) => updatePadMapping(editingPadId, { volume: parseFloat(e.target.value) });
    const handleColorChange = (color) => {
        updatePadMapping(editingPadId, { color });
        nextStep(); // Auto advance on color pick
    };
    const handleNoteChange = (e) => updatePadMapping(editingPadId, { note: e.target.value });

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const response = await uploadFile(file);
            const fileUrl = `http://localhost:3001/uploads/${response.file.filename}`;
            await sampler.loadSample(editingPadId, fileUrl);
            updatePadMapping(editingPadId, {
                file: fileUrl,
                assetId: response.file.id,
                originalName: response.file.originalName
            });
            alert('File uploaded!');
        } catch (err) {
            console.error(err);
            alert('Upload failed');
        }
    };

    const COLORS = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF', '#FF00FF', '#FFA500', '#800080', '#FFFFFF'];
    const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const OCTAVES = [1, 2, 3, 4, 5, 6];
    const ALL_NOTES = OCTAVES.flatMap(oct => NOTES.map(n => `${n}${oct}`));

    return (
        <div className={styles.overlay} onClick={handleClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <header>
                    <h2>Configure Pad {editingPadId}</h2>
                    <button className={styles.closeBtn} onClick={handleClose}>X</button>
                </header>

                <div className={styles.content}>
                    {/* STEP 1: Format */}
                    {step === 1 && (
                        <div className={styles.stepContainer}>
                            <h3 className={styles.stepTitle}>1. Play Format</h3>
                            <div className={styles.section}>
                                <label>Source Type</label>
                                <select value={currentMapping.type || 'sample'} onChange={handleTypeChange}>
                                    <option value="sample">Sample (Audio File)</option>
                                    <option value="synth">Synthesizer (Note)</option>
                                </select>
                            </div>
                            <div className={styles.section}>
                                <label>Play Mode</label>
                                <select value={currentMapping.mode || 'one-shot'} onChange={handleModeChange}>
                                    <option value="one-shot">One Shot</option>
                                    <option value="gate">Gate (Hold to Play)</option>
                                    <option value="toggle">Toggle (Loop)</option>
                                </select>
                            </div>
                            <div className={styles.section}>
                                <label>Volume ({currentMapping.volume || 0} dB)</label>
                                <input
                                    type="range" min="-60" max="6" step="1"
                                    value={currentMapping.volume || 0} onChange={handleVolumeChange}
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Color */}
                    {step === 2 && (
                        <div className={styles.stepContainer}>
                            <h3 className={styles.stepTitle}>2. Appearance</h3>
                            <label style={{ textAlign: 'center', marginBottom: '15px' }}>Pick a Color</label>
                            <div className={styles.colorGrid}>
                                {COLORS.map(c => (
                                    <button
                                        key={c}
                                        className={styles.colorBtn}
                                        style={{
                                            backgroundColor: c,
                                            border: currentMapping.color === c ? '3px solid white' : '1px solid #333'
                                        }}
                                        onClick={() => handleColorChange(c)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Sound */}
                    {step === 3 && (
                        <div className={styles.stepContainer}>
                            <h3 className={styles.stepTitle}>3. Audio Source</h3>
                            {(!currentMapping.type || currentMapping.type === 'sample') ? (
                                <div className={styles.section} style={{ textAlign: 'center' }}>
                                    <label>Sound File</label>
                                    <div className={styles.fileInfo}>
                                        {currentMapping.originalName || 'No file assigned'}
                                    </div>
                                    <input
                                        type="file" accept="audio/*" ref={fileInputRef}
                                        style={{ display: 'none' }} onChange={handleFileChange}
                                    />
                                    <button onClick={() => fileInputRef.current.click()} className={styles.navBtn}>
                                        Upload New Sound
                                    </button>
                                </div>
                            ) : (
                                <div className={styles.section}>
                                    <label>Synth Note</label>
                                    <select value={currentMapping.note || 'C4'} onChange={handleNoteChange}>
                                        {ALL_NOTES.map(note => (
                                            <option key={note} value={note}>{note}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className={styles.navigation}>
                        {step > 1 ? (
                            <button className={styles.navBtn} onClick={prevStep}>Back</button>
                        ) : (
                            <div></div> // Spacer
                        )}

                        {step < 3 ? (
                            <button className={`${styles.navBtn} ${styles.primary}`} onClick={nextStep}>
                                Next
                            </button>
                        ) : (
                            <button className={`${styles.navBtn} ${styles.primary}`} onClick={handleClose}>
                                Finish
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PadSettingsModal;
