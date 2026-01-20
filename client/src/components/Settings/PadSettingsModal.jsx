import React, { useState, useEffect } from 'react';
import useStore from '../../store/useStore';
import styles from './PadSettingsModal.module.css';
import { instrumentManager } from '../../audio/InstrumentManager';
import { SAMPLER_PRESETS } from '../../audio/instruments/Samplers';
import { SYNTH_PRESETS } from '../../audio/instruments/Synths';
import { uploadFile } from '../../api/upload';
import client from '../../api/client';

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
        chokeGroup: '',
        preset: '', // New Preset Field
        image: null // New Image Field
    });

    useEffect(() => {
        if (editingPadId !== null) {
            const current = padMappings[editingPadId];
            setFormState({
                name: current?.name || current?.originalName || '',
                type: current?.type || 'sample',
                mode: current?.mode || 'one-shot',
                color: current?.color || '#FFFFFF',
                chokeGroup: current?.chokeGroup || '',
                preset: current?.preset || '',
                effects: current?.effects || (current?.effect ? [current.effect] : []),
                image: current?.image || null
            });
        }
    }, [editingPadId, padMappings]);

    const handleChange = (field, value) => {
        setFormState(prev => {
            const newState = { ...prev, [field]: value };
            // Auto-set default preset if switching type and no preset selected
            if (field === 'type') {
                if (value === 'instrument' && !SAMPLER_PRESETS[newState.preset]) {
                    newState.preset = 'grand_piano';
                } else if (value === 'synth' && !SYNTH_PRESETS[newState.preset]) {
                    newState.preset = 'default';
                }
            }
            return newState;
        });
    };

    const handleSave = () => {
        const updates = { ...formState };
        updatePadMapping(editingPadId, updates);

        // Trigger Audio Engine Load
        if (updates.type === 'instrument' || updates.type === 'synth' || updates.type === 'piano' || updates.type === 'drums') {
            instrumentManager.loadInstrument(editingPadId, updates.type, updates.preset);
        }

        // Trigger Effects Chain Update Explicitly
        instrumentManager.applyEffectChain(editingPadId, updates.effects || []);

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
                                <option value="sample">Sample (Audio File)</option>
                                <option value="instrument">Virtual Instrument (Piano/Keys)</option>
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

                    {/* 2.5 Instrument Preset Selector (New) */}
                    {(formState.type === 'instrument' || formState.type === 'piano') && (
                        <div className={styles.fieldGroup}>
                            <label>INSTRUMENT PRESET</label>
                            <select
                                value={formState.preset}
                                onChange={(e) => handleChange('preset', e.target.value)}
                                className={styles.select}
                            >
                                {Object.keys(SAMPLER_PRESETS).map(key => (
                                    <option key={key} value={key}>
                                        {key.replace(/_/g, ' ').toUpperCase()}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* 2.6 Synth Preset Selector (New) */}
                    {formState.type === 'synth' && (
                        <div className={styles.fieldGroup}>
                            <label>SYNTH PRESET</label>
                            <select
                                value={formState.preset}
                                onChange={(e) => handleChange('preset', e.target.value)}
                                className={styles.select}
                            >
                                {Object.keys(SYNTH_PRESETS).map(key => (
                                    <option key={key} value={key}>
                                        {key.replace(/_/g, ' ').toUpperCase()}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* 2.7 Choke Group */}
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

                    {/* Pad Image (Custom) */}
                    <div className={styles.fieldGroup}>
                        <label>PAD IMAGE (CUSTOM)</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {/* Preview */}
                            <div style={{
                                width: '60px', height: '60px', borderRadius: '8px',
                                background: '#333', overflow: 'hidden',
                                border: '1px solid #555',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {formState.image ? (
                                    <img src={formState.image} alt="Pad" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <span style={{ fontSize: '0.7rem', color: '#666' }}>None</span>
                                )}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    id="pad-image-upload"
                                    style={{ display: 'none' }}
                                    onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;
                                        try {
                                            const response = await uploadFile(file);
                                            const baseURL = client.defaults.baseURL || 'http://localhost:3001';
                                            const fileUrl = response.file.url ? `${baseURL}${response.file.url}` : `${baseURL}/uploads/${encodeURIComponent(response.file.filename)}`;
                                            handleChange('image', fileUrl);
                                        } catch (err) {
                                            console.error(err);
                                            alert('Failed to upload image');
                                        }
                                    }}
                                />
                                <button
                                    className={styles.glassBtnSmall}
                                    style={{ padding: '4px 10px', fontSize: '0.8rem', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    onClick={() => document.getElementById('pad-image-upload').click()}
                                >
                                    Upload Image
                                </button>

                                {formState.image && (
                                    <button
                                        style={{ padding: '4px 10px', fontSize: '0.8rem', background: 'rgba(255,0,0,0.2)', color: '#ffaaaa', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                        onClick={() => handleChange('image', null)}
                                    >
                                        Remove Image
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. Effects Chain Editor (New) */}
                <div className={styles.fieldGroup}>
                    <label>EFFECTS CHAIN</label>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px' }}>

                        {/* List of Active Effects */}
                        {(formState.effects || []).map((fx, idx) => (
                            <div key={idx} style={{
                                display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px',
                                background: 'var(--glass-bg-subtle)', padding: '6px', borderRadius: '4px'
                            }}>
                                <span style={{ fontWeight: 'bold', fontSize: '0.8rem', width: '80px' }}>
                                    {fx.type.toUpperCase()}
                                </span>

                                {/* Simple Params (Mockup for now - usually needs specific knobs) */}
                                <span style={{ fontSize: '0.7rem', color: '#aaa', flex: 1 }}>
                                    {/* Show key params */}
                                    {fx.type === 'reverb' && `Mix: ${fx.params.mix || 0.5}`}
                                    {fx.type === 'distortion' && `Amt: ${fx.params.distortion || 0.4}`}
                                    {fx.type === 'feedbackDelay' && `Time: ${fx.params.delayTime || '8n'}`}
                                </span>

                                <button
                                    onClick={() => {
                                        const newEffects = [...(formState.effects || [])];
                                        newEffects.splice(idx, 1);
                                        handleChange('effects', newEffects);
                                    }}
                                    style={{
                                        background: 'transparent', border: 'none', color: '#ff5555', cursor: 'pointer'
                                    }}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}

                        {/* Add Effect Dropdown */}
                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                            <select
                                id="add-fx-select"
                                className={styles.select}
                                style={{ flex: 1 }}
                            >
                                <option value="">+ Add Effect...</option>
                                <option value="distortion">Distortion</option>
                                <option value="reverb">Reverb (Hall)</option>
                                <option value="feedbackDelay">Delay (Feedback)</option>
                                <option value="pingPongDelay">Delay (Ping Pong)</option>
                                <option value="chorus">Chorus</option>
                                <option value="phaser">Phaser</option>
                                <option value="flanger">Flanger</option>
                                <option value="bitcrusher">BitCrusher</option>
                                <option value="autowah">AutoWah</option>
                                <option value="autoFilter">Auto Filter</option>
                                <option value="tremolo">Tremolo</option>
                                <option value="vibrato">Vibrato</option>
                                <option value="stereoWidener">Stereo Widener</option>
                                <option value="compressor">Compressor</option>
                                <option value="limiter">Limiter</option>
                                <option value="eq3">EQ (3-Band)</option>
                                <option value="intro_lowpass">Filter Sweep (Lowpass)</option>
                                <option value="pitchshift">Pitch Shift</option>
                            </select>
                            <button
                                className={styles.toolBtn}
                                style={{ width: 'auto', padding: '0 15px' }}
                                onClick={() => {
                                    const select = document.getElementById('add-fx-select');
                                    const type = select.value;
                                    if (!type) return;

                                    // Default Params for each type
                                    let params = {};
                                    if (type === 'distortion') params = { distortion: 0.4 };
                                    if (type === 'reverb') params = { decay: 2.5, mix: 0.4 };
                                    if (type === 'feedbackDelay') params = { delayTime: '8n', feedback: 0.5 };
                                    if (type === 'pingPongDelay') params = { delayTime: '8n', feedback: 0.3 };
                                    if (type === 'chorus') params = { frequency: 4, delayTime: 2.5, depth: 0.5 };
                                    if (type === 'phaser') params = { frequency: 15, octaves: 5, baseFrequency: 1000 };
                                    if (type === 'flanger') params = { delayTime: 0.005, depth: 0.1, feedback: 0.1 };
                                    if (type === 'bitcrusher') params = { bits: 4 };
                                    if (type === 'autowah') params = { baseFrequency: 100, octaves: 6, sensitivity: 0 };
                                    if (type === 'autoFilter') params = { frequency: 2, baseFrequency: 200, octaves: 2.6 };
                                    if (type === 'tremolo') params = { frequency: 9, depth: 0.75 };
                                    if (type === 'vibrato') params = { frequency: 5, depth: 0.1 };
                                    if (type === 'stereoWidener') params = { width: 0.7 };
                                    if (type === 'compressor') params = { threshold: -20, ratio: 4, attack: 0.05, release: 0.2 };
                                    if (type === 'limiter') params = { threshold: -5 };
                                    if (type === 'eq3') params = { low: 0, mid: 0, high: 0 };
                                    if (type === 'intro_lowpass') {
                                        // Special Preset Case: internally mapped to Filter or AutoFilter
                                        // But here we just set it as a 'filter' type
                                        // Actually let's map it to 'filter' with specific params if manual
                                        // Or keep it simple
                                    }

                                    const newFx = { type, params };
                                    handleChange('effects', [...(formState.effects || []), newFx]);
                                    select.value = ""; // Reset
                                }}
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>

                {/* 4. Audio Tools (Quantize) - Only for Samples */}
                {formState.type === 'sample' && (
                    <div className={styles.fieldGroup}>
                        <label>AUDIO TOOLS</label>
                        <div className={styles.row}>
                            <button
                                className={styles.toolBtn}
                                onClick={() => {
                                    const bpm = useStore.getState().bpm;
                                    import('../../audio/Sampler').then(({ sampler }) => {
                                        const result = sampler.quantizeSample(editingPadId, bpm);
                                        if (result) {
                                            alert(`Quantized to ${result.numBars} Bar(s).\nTrimmed Start: ${result.startOffset.toFixed(3)}s`);
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
