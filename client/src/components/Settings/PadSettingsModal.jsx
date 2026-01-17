import React, { useState, useEffect } from 'react';
import useStore from '../../store/useStore';
import styles from './PadSettingsModal.module.css';

const PadSettingsModal = () => {
    const editingPadId = useStore((state) => state.editingPadId);
    const setEditingPadId = useStore((state) => state.setEditingPadId);
    const padMappings = useStore((state) => state.padMappings);
    const updatePadMapping = useStore((state) => state.updatePadMapping);

    const [formState, setFormState] = useState({
        name: '',
        type: 'sample',
        mode: 'one-shot',
        color: '#FFFFFF',
        chokeGroup: ''
    });

    useEffect(() => {
        if (editingPadId !== null) {
            const current = padMappings[editingPadId];
            setFormState({
                name: current?.name || current?.originalName || '',
                type: current?.type || 'sample',
                mode: current?.mode || 'one-shot',
                color: current?.color || '#FFFFFF',
                chokeGroup: current?.chokeGroup || ''
            });
        }
    }, [editingPadId, padMappings]);

    const handleChange = (field, value) => {
        setFormState(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        updatePadMapping(editingPadId, formState);
        setEditingPadId(null);
    };

    const handleClose = () => {
        setEditingPadId(null);
    };

    if (editingPadId === null) return null;

    const COLORS = [
        '#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#8B00FF', '#FF00FF', '#FFFFFF',
        '#00ffcc', '#ff99cc', '#ccff00', '#333333'
    ];

    return (
        <div className={styles.overlay} onClick={handleClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <header className={styles.header}>
                    <h2>PAD {editingPadId + 1} SETTINGS</h2>
                    <button className={styles.closeBtn} onClick={handleClose}>×</button>
                </header>

                <div className={styles.content}>
                    {/* 1. Name */}
                    <div className={styles.fieldGroup}>
                        <label>PAD NAME</label>
                        <input
                            type="text"
                            value={formState.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="Enter Pad Name..."
                            className={styles.input}
                            autoFocus
                        />
                    </div>

                    {/* 2. Type & Mode Row */}
                    <div className={styles.row}>
                        <div className={styles.fieldGroup} style={{ flex: 1 }}>
                            <label>TYPE</label>
                            <select
                                value={formState.type}
                                onChange={(e) => handleChange('type', e.target.value)}
                                className={styles.select}
                            >
                                <option value="sample">Sample (Audio)</option>
                                <option value="synth">Synthesizer</option>
                            </select>
                        </div>
                        <div className={styles.fieldGroup} style={{ flex: 1 }}>
                            <label>PLAYBACK MODE</label>
                            <select
                                value={formState.mode}
                                onChange={(e) => handleChange('mode', e.target.value)}
                                className={styles.select}
                            >
                                <option value="one-shot">One Shot (Hit)</option>
                                <option value="gate">Gate (Hold)</option>
                                <option value="toggle">Toggle (Loop)</option>
                                <option value="loop">Loop (Repeat)</option>
                            </select>
                        </div>
                    </div>

                    {/* 2.5 Choke Group (New) */}
                    <div className={styles.fieldGroup}>
                        <label>CHOKE GROUP (MUTE GROUP)</label>
                        <select
                            value={formState.chokeGroup}
                            onChange={(e) => handleChange('chokeGroup', e.target.value)}
                            className={styles.select}
                        >
                            <option value="">None</option>
                            <option value="1">Group 1 (Vocals)</option>
                            <option value="2">Group 2 (Drums)</option>
                            <option value="3">Group 3</option>
                            <option value="4">Group 4</option>
                        </select>
                        <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '5px' }}>
                            Pads in the same group will cut each other off.
                        </div>
                    </div>

                    {/* 3. Color Grid */}
                    <div className={styles.fieldGroup}>
                        <label>LED COLOR</label>
                        <div className={styles.colorGrid}>
                            {COLORS.map((c) => (
                                <div
                                    key={c}
                                    className={`${styles.colorSwatch} ${formState.color === c ? styles.activeSwatch : ''}`}
                                    style={{ backgroundColor: c, boxShadow: `0 0 10px ${c}` }}
                                    onClick={() => handleChange('color', c)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* 4. Audio Tools (Quantize) */}
                {formState.type === 'sample' && (
                    <div className={styles.fieldGroup}>
                        <label>AUDIO TOOLS</label>
                        <div className={styles.row}>
                            <button
                                className={styles.toolBtn}
                                onClick={() => {
                                    // Dynamic Import to avoid circular deps if any, though explicit import is usually fine.
                                    // We need current BPM from store
                                    const bpm = useStore.getState().bpm;
                                    import('../../audio/Sampler').then(({ sampler }) => {
                                        const result = sampler.quantizeSample(editingPadId, bpm);
                                        if (result) {
                                            alert(`Quantized to ${result.numBars} Bar(s).\nTrimmed Start: ${result.startOffset.toFixed(3)}s`);
                                            // Update mode to loop automatically?
                                            handleChange('mode', 'loop');
                                        } else {
                                            alert('Failed to quantize. Sample not loaded?');
                                        }
                                    });
                                }}
                            >
                                AUTO QUANTIZE (TRIM & LOOP)
                            </button>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '5px' }}>
                            Trims silence and loops to nearest bar based on global BPM.
                        </div>
                    </div>
                )}

                {/* Footer Actions */}
                <div className={styles.footer}>
                    <button className={styles.cancelBtn} onClick={handleClose}>CANCEL</button>
                    <button className={styles.saveBtn} onClick={handleSave}>SAVE CHANGES</button>
                </div>
            </div>
        </div>
    );
};

export default PadSettingsModal;
