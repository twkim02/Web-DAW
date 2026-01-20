import React, { useState, useEffect } from 'react';
import { uploadFile } from '../../api/upload';
import useStore from '../../store/useStore';
import { DRUM_NOTE_MAP } from '../../audio/instruments/Drums';
import styles from './VirtualDrums.module.css';

const VirtualDrums = ({ padId, previewMode, type, preset, instrumentManager, onClose }) => {
    const [activePads, setActivePads] = useState(new Set());
    const [isRecording, setIsRecording] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const triggerLibraryRefresh = useStore(state => state.triggerLibraryRefresh);

    // Initial Load
    useEffect(() => {
        if (previewMode && type) {
            instrumentManager.loadPreview(type, preset);
            return () => instrumentManager.closePreview();
        }
    }, [previewMode, type, preset]);

    // Drum Pad Configuration (Extended to 10)
    const pads = [
        { note: 'U', label: 'KICK', key: 'U', color: '#ff0055', sample: 'kick' },
        { note: 'I', label: 'SNARE', key: 'I', color: '#00ffff', sample: 'snare' },
        { note: 'O', label: 'HI-HAT', key: 'O', color: '#ffcc00', sample: 'hh_closed' },
        { note: 'P', label: 'OPEN HH', key: 'P', color: '#ffaa00', sample: 'hh_open' },
        { note: '[', label: 'CRASH', key: '[', color: '#ff0000', sample: 'crash' }, // NEW

        { note: 'H', label: 'TOM L', key: 'H', color: '#00ff55', sample: 'tom_low' },
        { note: 'J', label: 'TOM M', key: 'J', color: '#00ff88', sample: 'tom_mid' },
        { note: 'K', label: 'TOM H', key: 'K', color: '#00ffbb', sample: 'tom_high' },
        { note: 'L', label: 'CLAP', key: 'L', color: '#cc00ff', sample: 'clap' },
        { note: "'", label: 'RIDE', key: "'", color: '#aa00ff', sample: 'ride' },  // NEW
    ];

    // TUNING STATE
    const [selectedPad, setSelectedPad] = useState(null); // { label, sample }
    const [tuning, setTuning] = useState({}); // { sampleName: { volume: 0, pitch: 0 } }
    const [globalEffects, setGlobalEffects] = useState({ reverb: 0, distortion: 0 }); // Global Effects

    const handlePlay = (note, isShift = false) => {
        const pad = pads.find(p => p.note === note);
        if (!pad) return;

        // SELECTION LOGIC
        if (isShift) {
            setSelectedPad(pad);
            // Initialize tuning state for this sample if not exists
            if (!tuning[pad.sample]) {
                setTuning(prev => ({ ...prev, [pad.sample]: { volume: 0, pitch: 0 } }));
            }
            return; // Don't play sound if selecting
        }

        // PLAY LOGIC
        if (previewMode) {
            instrumentManager.triggerPreview(note);
        } else {
            instrumentManager.trigger(padId, note);
        }

        // Visual Feedback
        setActivePads(prev => new Set(prev).add(note));
        setTimeout(() => {
            setActivePads(prev => {
                const next = new Set(prev);
                next.delete(note);
                return next;
            });
        }, 150);
    };

    const handleTuneChange = (param, value) => {
        if (!selectedPad) return;
        const sample = selectedPad.sample;
        const newTuning = { ...tuning[sample], [param]: parseFloat(value) };

        setTuning(prev => ({ ...prev, [sample]: newTuning }));

        // Apply immediately
        if (previewMode) {
            instrumentManager.tunePreviewDrum(sample, { [param]: parseFloat(value) });
        } else {
            instrumentManager.tuneDrum(padId, sample, { [param]: parseFloat(value) });
        }
    };

    const handleGlobalEffectChange = (effect, value) => {
        const val = parseFloat(value);
        setGlobalEffects(prev => ({ ...prev, [effect]: val }));

        if (previewMode) {
            instrumentManager.tunePreviewEffect(effect, val);
        }
        // Note: For live playing (non-preview), we'd need to update the actual instrument chain.
        // Currently InstrumentManager structure puts effects on *chain*, not inside instrument wrapper usually.
        // But for drums, global FX are best inside the wrapper or applied to the bus.
        // For this task, we focus on Preview as requested for "recording popup".
    };

    const toggleRecording = async () => {
        if (isRecording) {
            const blob = await instrumentManager.stopRecording();
            setIsRecording(false);

            if (blob) {
                const defaultName = `DrumBeat_${new Date().toISOString().slice(0, 10)}`;
                const name = window.prompt("Enter a name for your beat:", defaultName);

                if (!name) return;

                setIsUploading(true);
                try {
                    const file = new File([blob], `${name}.webm`, { type: 'audio/webm' });
                    await uploadFile(file, 'instrument');
                    triggerLibraryRefresh();
                    alert('Beat Saved to Library!');
                } catch (err) {
                    console.error(err);
                    alert('Save Failed');
                } finally {
                    setIsUploading(false);
                }
            }
        } else {
            await instrumentManager.startRecording();
            setIsRecording(true);
        }
    };

    // Keyboard Handler
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.repeat) return;
            const key = e.key.toUpperCase();
            if (key === 'ESCAPE') onClose();

            const pad = pads.find(p => p.key === key);
            if (pad) handlePlay(pad.note, e.shiftKey);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [previewMode, type, selectedPad, tuning]); // Depend on tuning state

    return (
        <div className={styles.overlay}>
            <div className={styles.mainPanel}>

                {/* LEFT: DRUM PADS */}
                <div className={styles.leftSection}>
                    <div className={styles.header}>
                        <h1 className={styles.title}>
                            DRUM RACK
                        </h1>
                        <div className={styles.subtitle}>
                            Shift + Click to Select & Tune
                        </div>
                    </div>

                    <div className={styles.padsGrid}>
                        {pads.map((pad) => {
                            const isActive = activePads.has(pad.note);
                            const isSelected = selectedPad?.key === pad.key;
                            return (
                                <div
                                    key={pad.key}
                                    onMouseDown={(e) => handlePlay(pad.note, e.shiftKey)}
                                    className={`${styles.pad} ${isActive ? styles.active : ''} ${isSelected ? styles.selected : ''}`}
                                    style={{
                                        background: isActive ? pad.color : 'rgba(50,50,50,0.5)',
                                        borderColor: isSelected ? pad.color : '#444',
                                        boxShadow: isActive ? `0 0 30px ${pad.color}` : (isSelected ? `0 0 15px ${pad.color}44` : 'none'),
                                    }}
                                >
                                    <span className={styles.padKey} style={{ color: isActive ? '#000' : pad.color }}>{pad.key}</span>
                                    <span className={styles.padLabel} style={{ color: isActive ? '#000' : '#ccc' }}>{pad.label}</span>
                                </div>
                            );
                        })}
                    </div>

                    <div className={styles.controlsRow}>
                        {/* METRONOME */}
                        <button
                            onClick={() => useStore.getState().setIsMetronomeOn(!useStore.getState().isMetronomeOn)}
                            className={styles.closeBtn}
                            style={{
                                background: useStore(state => state.isMetronomeOn) ? 'var(--color-accent-primary)' : '#444',
                                marginRight: '10px',
                                minWidth: '40px'
                            }}
                            title="Toggle Metronome"
                        >
                            ⏰
                        </button>

                        {previewMode && (
                            <button
                                onClick={toggleRecording}
                                disabled={isUploading}
                                className={`${styles.recordBtn} ${isRecording ? styles.recording : ''}`}
                            >
                                {isUploading ? 'SAVING...' : (isRecording ? 'STOP & SAVE' : <>REC ●</>)}
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className={styles.closeBtn}
                        >
                            CLOSE
                        </button>
                    </div>
                </div>

                {/* RIGHT: TUNING SIDEBAR */}
                <div className={styles.tuningSidebar}>
                    <div className={styles.sidebarTitle}>
                        PAD TUNING
                    </div>

                    {selectedPad ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                            <div className={styles.selectedPadInfo} style={{ color: selectedPad.color }}>
                                {selectedPad.label}
                            </div>

                            {/* Pitch Control */}
                            <div className={styles.tuningControl}>
                                <div className={styles.controlHeader}>
                                    <span>Pitch</span>
                                    <span>{tuning[selectedPad.sample]?.pitch || 0} st</span>
                                </div>
                                <input
                                    type="range" min="-12" max="12" step="1"
                                    value={tuning[selectedPad.sample]?.pitch || 0}
                                    onChange={(e) => handleTuneChange('pitch', e.target.value)}
                                    className={styles.rangeInput}
                                />
                            </div>

                            {/* Volume Control */}
                            <div className={styles.tuningControl}>
                                <div className={styles.controlHeader}>
                                    <span>Volume</span>
                                    <span>{tuning[selectedPad.sample]?.volume || 0} dB</span>
                                </div>
                                <input
                                    type="range" min="-24" max="6" step="1"
                                    value={tuning[selectedPad.sample]?.volume || 0}
                                    onChange={(e) => handleTuneChange('volume', e.target.value)}
                                    className={styles.rangeInput}
                                />
                            </div>

                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            Select a pad<br />(Shift+Click)<br />to tune
                        </div>
                    )}

                    {/* GLOBAL EFFECTS SECTION */}
                    <div className={styles.globalFxSection}>
                        <div className={styles.sidebarTitle}>
                            GLOBAL EFFECTS
                        </div>

                        {/* Distortion */}
                        <div className={styles.tuningControl}>
                            <div className={styles.controlHeader} style={{ color: '#ff5500' }}>
                                <span>Distortion</span>
                                <span>{Math.round(globalEffects?.distortion * 100) || 0}%</span>
                            </div>
                            <input
                                type="range" min="0" max="1" step="0.01"
                                value={globalEffects?.distortion || 0}
                                onChange={(e) => handleGlobalEffectChange('distortion', e.target.value)}
                                className={styles.rangeInput}
                                style={{ accentColor: '#ff5500' }}
                            />
                        </div>

                        {/* Reverb */}
                        <div className={styles.tuningControl}>
                            <div className={styles.controlHeader} style={{ color: '#00ccff' }}>
                                <span>Reverb</span>
                                <span>{Math.round(globalEffects?.reverb * 100) || 0}%</span>
                            </div>
                            <input
                                type="range" min="0" max="1" step="0.01"
                                value={globalEffects?.reverb || 0}
                                onChange={(e) => handleGlobalEffectChange('reverb', e.target.value)}
                                className={styles.rangeInput}
                                style={{ accentColor: '#00ccff' }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VirtualDrums;
