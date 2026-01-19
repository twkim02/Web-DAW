import React, { useEffect, useState, useRef } from 'react';
import client from '../../api/client';
import useStore from '../../store/useStore';
import { uploadFile } from '../../api/upload';

const SynthLibrary = () => {
    // Categorized Presets matching Synths.js
    const presetCategories = {
        'BASS': [
            { id: 'bass_reese', name: 'Reese Bass', type: 'synth', presetId: 'bass_reese' },
            { id: 'bass_acid', name: 'Acid Bass', type: 'synth', presetId: 'bass_acid' },
            { id: 'bass_sub', name: 'Sub Bass', type: 'synth', presetId: 'bass_sub' },
            { id: 'bass_slap', name: 'Slap Bass', type: 'synth', presetId: 'bass_slap' },
        ],
        'LEAD': [
            { id: 'supersaw', name: 'Super Saw (Trance)', type: 'synth', presetId: 'supersaw' },
            { id: 'lead_saw', name: 'Saw Lead', type: 'synth', presetId: 'lead_saw' },
            { id: 'lead_sync', name: 'Sync Lead', type: 'synth', presetId: 'lead_sync' },
            { id: 'lead_theremin', name: 'Theremin', type: 'synth', presetId: 'lead_theremin' },
        ],
        'KEYS / PAD': [
            { id: 'keys_epiano', name: 'E-Piano', type: 'synth', presetId: 'keys_epiano' },
            { id: 'keys_fm', name: 'FM Bell', type: 'synth', presetId: 'keys_fm' },
            { id: 'pad_space', name: 'Space Pad', type: 'synth', presetId: 'pad_space' },
            { id: 'pad_warm', name: 'Warm Pad', type: 'synth', presetId: 'pad_warm' },
        ],
        'FX': [
            { id: 'fx_chiptune', name: 'Chiptune', type: 'synth', presetId: 'fx_chiptune' },
            { id: 'fx_laser', name: 'Laser', type: 'synth', presetId: 'fx_laser' },
            { id: 'fx_drop', name: 'Bass Drop', type: 'synth', presetId: 'fx_drop' },
        ]
    };

    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);
    const lastLibraryUpdate = useStore(state => state.lastLibraryUpdate);

    const setPreviewMode = useStore(state => state.setPreviewMode);

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const res = await client.get('/upload?category=synth');
            if (Array.isArray(res.data)) setAssets(res.data);
            else setAssets([]);
        } catch (err) {
            console.error('Failed to fetch synth assets', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, [lastLibraryUpdate]);

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        try {
            setLoading(true);
            const uploadPromises = files.map(file => uploadFile(file, 'synth'));
            await Promise.all(uploadPromises);
            await fetchAssets();
        } catch (err) {
            alert('Failed to upload synth file');
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDragStart = (e, item, isPreset = false) => {
        if (isPreset) {
            e.dataTransfer.setData('application/json', JSON.stringify({
                type: 'synth',
                preset: { name: item.name, presetId: item.presetId }
            }));
        } else {
            e.dataTransfer.setData('application/json', JSON.stringify({
                type: 'asset',
                asset: item,
                libraryType: 'synth' // Metadata
            }));
        }
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: '#ccc', padding: '16px', boxSizing: 'border-box' }}>

            {/* Presets Section */}
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
                <div style={{ marginBottom: '10px', fontSize: '0.8rem', fontWeight: 'bold', color: '#99ccff', borderBottom: '1px solid #336699', paddingBottom: '5px' }}>
                    FACTORY PRESETS
                </div>

                {Object.entries(presetCategories).map(([category, presets]) => (
                    <div key={category} style={{ marginBottom: '15px' }}>
                        <div style={{ fontSize: '0.7rem', color: '#6688aa', marginBottom: '5px', fontWeight: 'bold' }}>{category}</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                            {presets.map(preset => (
                                <div
                                    key={preset.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, preset, true)}
                                    onClick={() => setPreviewMode(true, preset.type, preset.presetId)}
                                    style={{
                                        background: '#1a1a1a', padding: '8px', borderRadius: '4px', cursor: 'pointer',
                                        fontSize: '0.75rem', border: '1px solid #334455', color: '#99ccff',
                                        textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                        transition: 'all 0.2s'
                                    }}
                                    className="synth-preset-item" // For potential global hover effects
                                    title={preset.name}
                                >
                                    🎹 {preset.name}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* User Synths Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>USER SYNTHS ({assets.length})</span>
                <button
                    onClick={() => fileInputRef.current.click()}
                    style={{
                        background: '#336699', border: 'none', color: '#fff', cursor: 'pointer',
                        fontSize: '1rem', width: '20px', height: '20px', borderRadius: '4px', lineHeight: '20px', padding: 0
                    }}
                    title="Add Synth Rec"
                >
                    +
                </button>
            </div>

            <input type="file" multiple ref={fileInputRef} style={{ display: 'none' }} accept="audio/*" onChange={handleFileUpload} />

            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', alignContent: 'start' }}>
                {loading && <div style={{ padding: '10px', fontSize: '0.8rem' }}>Loading...</div>}
                {!loading && assets.length === 0 && <div style={{ fontSize: '0.8rem', color: '#666', fontStyle: 'italic' }}>No user recordings.</div>}

                {assets.map(asset => (
                    <div
                        key={asset.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, asset, false)}
                        style={{
                            background: '#222', padding: '8px', borderRadius: '4px', cursor: 'grab',
                            fontSize: '0.75rem', border: '1px solid #444', color: '#eee',
                            display: 'flex', alignItems: 'center', gap: '5px', overflow: 'hidden'
                        }}
                    >
                        <span>🎤</span>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{asset.originalName}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SynthLibrary;
