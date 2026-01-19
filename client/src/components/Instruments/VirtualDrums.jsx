import React, { useState, useEffect } from 'react';
import { uploadFile } from '../../api/upload';
import useStore from '../../store/useStore';
import { DRUM_NOTE_MAP } from '../../audio/instruments/Drums';

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
            setIsRecording(false);
            setIsUploading(true);
            try {
                const blob = await instrumentManager.stopRecording();
                if (blob) {
                    const file = new File([blob], `drum_beat_${Date.now()}.webm`, { type: 'audio/webm' });
                    await uploadFile(file, 'instrument');
                    triggerLibraryRefresh();
                    alert('Beat Saved to Library!');
                }
            } catch (err) {
                console.error(err);
                alert('Save Failed');
            } finally {
                setIsUploading(false);
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
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(15px)',
            zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center',
            animation: 'fadeIn 0.2s ease'
        }}>
            <div style={{ display: 'flex', gap: '40px', background: 'rgba(30,30,30,0.6)', padding: '30px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>

                {/* LEFT: DRUM PADS */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                        <h1 style={{ color: '#fff', fontSize: '2rem', textShadow: '0 0 20px rgba(0,255,255,0.5)', margin: 0 }}>
                            DRUM RACK
                        </h1>
                        <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '5px' }}>
                            Shift + Click to Select & Tune
                        </div>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)', // 5 Columns
                        gap: '15px'
                    }}>
                        {pads.map((pad) => {
                            const isActive = activePads.has(pad.note);
                            const isSelected = selectedPad?.key === pad.key;
                            return (
                                <div
                                    key={pad.key}
                                    onMouseDown={(e) => handlePlay(pad.note, e.shiftKey)}
                                    style={{
                                        width: '80px', height: '80px',
                                        background: isActive ? pad.color : 'rgba(50,50,50,0.5)',
                                        border: isSelected ? `2px solid ${pad.color}` : '1px solid #444',
                                        borderRadius: '8px',
                                        display: 'flex', flexDirection: 'column',
                                        justifyContent: 'center', alignItems: 'center',
                                        cursor: 'pointer',
                                        boxShadow: isActive ? `0 0 30px ${pad.color}` : (isSelected ? `0 0 15px ${pad.color}44` : 'none'),
                                        transform: isActive ? 'scale(0.95)' : 'scale(1)',
                                        transition: 'all 0.05s'
                                    }}
                                >
                                    <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: isActive ? '#000' : pad.color }}>{pad.key}</span>
                                    <span style={{ fontSize: '0.7rem', color: isActive ? '#000' : '#ccc' }}>{pad.label}</span>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
                        {previewMode && (
                            <button
                                onClick={toggleRecording}
                                disabled={isUploading}
                                style={{
                                    background: isRecording ? '#ff3333' : '#333',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    color: '#fff', padding: '10px 30px', borderRadius: '30px',
                                    cursor: 'pointer', fontWeight: 'bold',
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
                                cursor: 'pointer'
                            }}
                        >
                            CLOSE
                        </button>
                    </div>
                </div>

                {/* RIGHT: TUNING SIDEBAR */}
                <div style={{
                    width: '180px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '20px',
                    display: 'flex', flexDirection: 'column', borderLeft: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <div style={{ color: '#aaa', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '20px', textAlign: 'center' }}>
                        PAD TUNING
                    </div>

                    {selectedPad ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
                            <div style={{ textAlign: 'center', color: selectedPad.color, fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '10px' }}>
                                {selectedPad.label}
                            </div>

                            {/* Pitch Control */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ccc', fontSize: '0.8rem', marginBottom: '5px' }}>
                                    <span>Pitch</span>
                                    <span>{tuning[selectedPad.sample]?.pitch || 0} st</span>
                                </div>
                                <input
                                    type="range" min="-12" max="12" step="1"
                                    value={tuning[selectedPad.sample]?.pitch || 0}
                                    onChange={(e) => handleTuneChange('pitch', e.target.value)}
                                    style={{ width: '100%', cursor: 'pointer' }}
                                />
                            </div>

                            {/* Volume Control */}
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ccc', fontSize: '0.8rem', marginBottom: '5px' }}>
                                    <span>Volume</span>
                                    <span>{tuning[selectedPad.sample]?.volume || 0} dB</span>
                                </div>
                                <input
                                    type="range" min="-24" max="6" step="1"
                                    value={tuning[selectedPad.sample]?.volume || 0}
                                    onChange={(e) => handleTuneChange('volume', e.target.value)}
                                    style={{ width: '100%', cursor: 'pointer' }}
                                />
                            </div>

                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '0.8rem', textAlign: 'center', height: '150px', border: '1px dashed #444', borderRadius: '8px' }}>
                            Select a pad<br />(Shift+Click)<br />to tune
                        </div>
                    )}

                    {/* GLOBAL EFFECTS SECTION */}
                    <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ color: '#aaa', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '15px', textAlign: 'center' }}>
                            GLOBAL EFFECTS
                        </div>

                        {/* Distortion */}
                        <div style={{ marginBottom: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff5500', fontSize: '0.8rem', marginBottom: '5px' }}>
                                <span>Distortion</span>
                                <span>{Math.round(globalEffects?.distortion * 100) || 0}%</span>
                            </div>
                            <input
                                type="range" min="0" max="1" step="0.01"
                                value={globalEffects?.distortion || 0}
                                onChange={(e) => handleGlobalEffectChange('distortion', e.target.value)}
                                style={{ width: '100%', cursor: 'pointer', accentColor: '#ff5500' }}
                            />
                        </div>

                        {/* Reverb */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#00ccff', fontSize: '0.8rem', marginBottom: '5px' }}>
                                <span>Reverb</span>
                                <span>{Math.round(globalEffects?.reverb * 100) || 0}%</span>
                            </div>
                            <input
                                type="range" min="0" max="1" step="0.01"
                                value={globalEffects?.reverb || 0}
                                onChange={(e) => handleGlobalEffectChange('reverb', e.target.value)}
                                style={{ width: '100%', cursor: 'pointer', accentColor: '#00ccff' }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VirtualDrums;
