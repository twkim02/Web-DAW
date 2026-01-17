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

    // Drum Pad Configuration
    const pads = [
        { note: 'U', label: 'KICK', key: 'U', color: '#ff0055' },
        { note: 'I', label: 'SNARE', key: 'I', color: '#00ffff' },
        { note: 'O', label: 'HI-HAT', key: 'O', color: '#ffcc00' },
        { note: 'P', label: 'OPEN HH', key: 'P', color: '#ffaa00' },
        { note: 'H', label: 'TOM L', key: 'H', color: '#00ff55' },
        { note: 'J', label: 'TOM M', key: 'J', color: '#00ff88' },
        { note: 'K', label: 'TOM H', key: 'K', color: '#00ffbb' },
        { note: 'L', label: 'CLAP', key: 'L', color: '#cc00ff' },
    ];

    const playPad = (note) => {
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

    const toggleRecording = async () => {
        if (isRecording) {
            setIsRecording(false);
            setIsUploading(true);
            try {
                const blob = await instrumentManager.stopRecording();
                if (blob) {
                    const file = new File([blob], `drum_beat_${Date.now()}.webm`, { type: 'audio/webm' });
                    await uploadFile(file);
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
            if (pad) playPad(pad.note);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [previewMode, type]);

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
            zIndex: 9999, display: 'flex', flexDirection: 'column',
            justifyContent: 'center', alignItems: 'center', animation: 'fadeIn 0.2s ease'
        }}>
            {/* Header */}
            <div style={{ marginBottom: '40px', textAlign: 'center' }}>
                <h1 style={{ color: '#fff', fontSize: '2.5rem', textShadow: '0 0 20px rgba(0,255,255,0.5)', marginBottom: '10px' }}>
                    DRUM RACK
                </h1>

                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                    {previewMode && (
                        <button onClick={toggleRecording} disabled={isUploading}
                            style={{
                                background: isRecording ? '#ff3333' : '#333',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: '#fff', padding: '12px 30px', borderRadius: '30px',
                                cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem',
                                boxShadow: isRecording ? '0 0 20px #ff0000' : 'none',
                                animation: isRecording ? 'pulse 1s infinite' : 'none'
                            }}>
                            {isUploading ? 'SAVING...' : (isRecording ? 'STOP & SAVE' : 'REC ●')}
                        </button>
                    )}
                    <button onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                            color: '#fff', padding: '12px 30px', borderRadius: '30px', cursor: 'pointer'
                        }}>
                        CLOSE ESC
                    </button>
                </div>
            </div>

            {/* Pads Grid */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px',
                padding: '40px', background: 'rgba(30,30,30,0.8)', borderRadius: '20px',
                boxShadow: '0 30px 60px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1)'
            }}>
                {pads.map(pad => (
                    <div key={pad.note}
                        onMouseDown={() => playPad(pad.note)}
                        style={{
                            width: '120px', height: '120px',
                            background: activePads.has(pad.note) ? pad.color : 'linear-gradient(145deg, #2a2a2a, #222)',
                            borderRadius: '12px',
                            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                            cursor: 'pointer',
                            boxShadow: activePads.has(pad.note)
                                ? `0 0 30px ${pad.color}, inset 0 0 10px rgba(255,255,255,0.5)`
                                : '5px 5px 10px rgba(0,0,0,0.3), -2px -2px 5px rgba(255,255,255,0.05)',
                            transform: activePads.has(pad.note) ? 'scale(0.95)' : 'none',
                            transition: 'all 0.05s',
                            border: `1px solid ${activePads.has(pad.note) ? '#fff' : 'rgba(255,255,255,0.05)'}`
                        }}>
                        <span style={{
                            color: activePads.has(pad.note) ? '#000' : pad.color,
                            fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '5px',
                            textShadow: activePads.has(pad.note) ? 'none' : `0 0 10px ${pad.color}`
                        }}>
                            {pad.label}
                        </span>
                        <span style={{ color: '#666', fontSize: '0.9rem' }}>
                            [{pad.key}]
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VirtualDrums;
