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
        color: '#FFFFFF'
    });

    useEffect(() => {
        if (editingPadId !== null) {
            const current = padMappings[editingPadId];
            setFormState({
                name: current?.name || current?.originalName || '',
                type: current?.type || 'sample',
                mode: current?.mode || 'one-shot',
                color: current?.color || '#FFFFFF'
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

                    {/* Footer Actions */}
                    <div className={styles.footer}>
                        <button className={styles.cancelBtn} onClick={handleClose}>CANCEL</button>
                        <button className={styles.saveBtn} onClick={handleSave}>SAVE CHANGES</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PadSettingsModal;
