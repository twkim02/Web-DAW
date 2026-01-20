import React, { useEffect, useState, useRef } from 'react';
import client from '../../api/client';
import useStore from '../../store/useStore';
import { uploadFile } from '../../api/upload';
import SampleEditor from './SampleEditor';
import styles from './FileLibrary.module.css';

const FileLibrary = ({ category = 'sample' }) => {
    const [assets, setAssets] = React.useState([]);
    const [loading, setLoading] = React.useState(false);

    // Categories (Metadata only for display)
    const categoryInfo = {
        sample: { label: 'Samples', icon: '🎵' },
        synth: { label: 'Synth', icon: '🎹' },
        instrument: { label: 'Instruments', icon: '🎸' },
        recording: { label: 'Recordings', icon: '🎙️' },
        background: { label: 'Backgrounds', icon: '🖼️' }
    };

    const currentCategory = categoryInfo[category] || categoryInfo['sample'];

    const [isSelectionMode, setIsSelectionMode] = React.useState(false);
    const [selectedIds, setSelectedIds] = React.useState(new Set());
    const [renamingId, setRenamingId] = React.useState(null);
    const [renameValue, setRenameValue] = React.useState('');

    // Sample Editor State
    const [editingAsset, setEditingAsset] = React.useState(null); // { url, name, id }

    // Global Store Actions
    const setPreviewMode = useStore(state => state.setPreviewMode);

    // --- SUB-TABS FOR INSTRUMENTS ---
    const [instSubTab, setInstSubTab] = React.useState('ALL'); // ALL, KEYS, STRINGS, WIND, OTHERS

    // --- PRESET DATA ---
    const synthPresets = {
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

    const instruments = [
        { id: 'grand_piano', name: 'Grand Piano', type: 'sampler', preset: 'grand_piano', category: 'KEYS' },
        { id: 'bright_piano', name: 'Bright Piano', type: 'sampler', preset: 'bright_piano', category: 'KEYS' },
        { id: 'electric_grand', name: 'Electric Grand', type: 'sampler', preset: 'electric_grand', category: 'KEYS' },
        { id: 'honky_tonk', name: 'Honky Tonk', type: 'sampler', preset: 'honky_tonk', category: 'KEYS' },
        { id: 'electric_piano', name: 'Electric Piano', type: 'sampler', preset: 'electric_piano', category: 'KEYS' },
        { id: 'rhodes', name: 'Rhodes EP', type: 'sampler', preset: 'rhodes', category: 'KEYS' },
        { id: 'acoustic_guitar', name: 'Acoustic Guitar', type: 'sampler', preset: 'acoustic_guitar', category: 'STRINGS' },
        { id: 'electric_guitar', name: 'Electric Guitar', type: 'sampler', preset: 'electric_guitar', category: 'STRINGS' },
        { id: 'strings', name: 'String Ensemble', type: 'sampler', preset: 'strings', category: 'STRINGS' },
        { id: 'cello', name: 'Cello', type: 'sampler', preset: 'cello', category: 'STRINGS' },
        { id: 'violin', name: 'Violin', type: 'sampler', preset: 'violin', category: 'STRINGS' },
        { id: 'brass', name: 'Brass Section', type: 'sampler', preset: 'brass', category: 'WIND' },
        { id: 'flute', name: 'Flute', type: 'sampler', preset: 'flute', category: 'WIND' },
        { id: 'clarinet', name: 'Clarinet', type: 'sampler', preset: 'clarinet', category: 'WIND' },
        { id: 'marimba', name: 'Marimba (Shape of You)', type: 'sampler', preset: 'marimba', category: 'OTHERS' },
        { id: 'vibraphone', name: 'Vibraphone', type: 'sampler', preset: 'vibraphone', category: 'OTHERS' },
        { id: 'xylophone', name: 'Xylophone', type: 'sampler', preset: 'xylophone', category: 'OTHERS' },
        { id: 'kalimba', name: 'Kalimba', type: 'sampler', preset: 'kalimba', category: 'OTHERS' },
        { id: 'steel_drums', name: 'Steel Drums', type: 'sampler', preset: 'steel_drums', category: 'OTHERS' },
        { id: 'choir', name: 'Choir Aahs', type: 'sampler', preset: 'choir', category: 'OTHERS' },
        { id: 'chiptune', name: 'Chiptune (8-bit)', type: 'synth', preset: 'fx_chiptune', category: 'OTHERS' },
        { id: '808_kit', name: '808 Drum Kit', type: 'drums', preset: '808', category: 'DRUMS' },
        { id: 'acoustic_kit', name: 'Acoustic Kit', type: 'drums', preset: 'acoustic', category: 'DRUMS' },
        { id: 'kpr77_kit', name: 'Vinyl (Lo-Fi) Kit', type: 'drums', preset: 'kpr77', category: 'DRUMS' },
    ];

    const startRename = (e, asset) => {
        e.stopPropagation();
        setRenamingId(asset.id);
        setRenameValue(asset.originalName);
    };

    const confirmRename = async (id) => {
        if (!renameValue.trim()) return;
        try {
            await client.put('/upload/rename', {
                id,
                newName: renameValue.trim()
            });
            setRenamingId(null);
            fetchAssets();
        } catch (err) {
            console.error('Rename failed', err);
            alert('Failed to rename');
        }
    };

    const fileInputRef = useRef(null);

    // Multi-File Upload Handler
    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        try {
            setLoading(true);
            const uploadPromises = files.map(file => uploadFile(file, category));
            await Promise.all(uploadPromises);
            await fetchAssets();
        } catch (err) {
            console.error('[FileLibrary] Upload failed', err);
            alert('Failed to upload one or more files');
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const currentPresetId = useStore(state => state.currentPresetId);
    const user = useStore(state => state.user);

    const fetchAssets = async () => {
        setLoading(true);
        try {
            // Build query params
            const params = new URLSearchParams();
            params.append('category', category);
            // For non-logged-in users, send current preset ID
            if (!user && currentPresetId) {
                params.append('presetId', currentPresetId);
            }

            // Fetch by selected category
            const res = await client.get(`/upload?${params.toString()}`);
            if (Array.isArray(res.data)) {
                // Prepend baseURL to make URLs absolute for AudioEngine
                const baseURL = client.defaults.baseURL || 'http://localhost:3001';
                const mappedAssets = res.data.map(asset => {
                    let finalUrl = asset.url || asset.filePath;
                    if (finalUrl && !finalUrl.startsWith('http')) {
                        finalUrl = `${baseURL}${finalUrl}`;
                    }
                    return {
                        ...asset,
                        url: finalUrl
                    };
                });
                // If the backend returns 'url' (virtual), use it.
                // Our backend now returns { ...asset, url: '/uploads/filename' }

                setAssets(mappedAssets);
            } else {
                setAssets([]);
            }
        } catch (err) {
            console.error('Failed to fetch assets', err);
            setAssets([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Delete ${selectedIds.size} sounds?`)) return;

        try {
            setLoading(true);
            await client.post('/upload/delete', { ids: Array.from(selectedIds) });
            setSelectedIds(new Set());
            setIsSelectionMode(false);
            await fetchAssets();
        } catch (err) {
            console.error('Delete failed', err);
            alert('Failed to delete sounds');
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const lastLibraryUpdate = useStore(state => state.lastLibraryUpdate);

    useEffect(() => {
        fetchAssets();
        setIsSelectionMode(false);
        setSelectedIds(new Set());
    }, [lastLibraryUpdate, category, currentPresetId, user]);

    // Update Drop Logic
    const handleDragStart = (e, item, source) => {
        if (isSelectionMode) {
            e.preventDefault();
            return;
        }

        let payload = {};

        if (source === 'preset-synth') {
            // Built-in Synth
            payload = {
                type: 'synth',
                preset: { name: item.name, presetId: item.presetId }
            };
        } else if (source === 'preset-inst') {
            // Built-in Instrument
            payload = {
                type: 'instrument',
                instrument: {
                    name: item.name,
                    type: item.type, // 'sampler', 'drums'
                    preset: item.preset
                }
            };
        } else {
            // User Asset (Any Type)
            // If dragging a user file in 'synth' category, we might want to treat it as 'asset' type 
            // or if it's a recorded sample used in a synth context. 
            // For now, consistent with legacy: 'asset' type works for standard samplers.
            payload = {
                type: 'asset',
                asset: item,
                libraryType: category // 'sample', 'synth', 'instrument'
            };
        }

        e.dataTransfer.setData('application/json', JSON.stringify(payload));
        e.dataTransfer.effectAllowed = 'copy';
    };

    // --- RENDER HELPERS ---

    // Render Synth Presets
    const renderSynthPresets = () => (
        <div style={{ marginBottom: '20px' }}>
            {Object.entries(synthPresets).map(([grp, items]) => (
                <div key={grp} style={{ marginBottom: '10px' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 'bold', marginBottom: '4px' }}>{grp}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                        {items.map(item => (
                            <div
                                key={item.id}
                                draggable={!isSelectionMode}
                                onDragStart={(e) => handleDragStart(e, item, 'preset-synth')}
                                onClick={() => setPreviewMode(true, item.type, item.presetId)}
                                className={styles.fileItemHover}
                                style={{
                                    background: 'var(--glass-bg-subtle)', padding: '8px', borderRadius: 'var(--radius-md)',
                                    border: 'var(--glass-border-subtle)', cursor: 'pointer',
                                    fontSize: '0.75rem', color: 'var(--color-text-secondary)', textAlign: 'center'
                                }}
                            >
                                {item.name}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );

    // Render Instrument Presets
    const renderInstPresets = () => {
        // Simple Filter
        const filtered = instSubTab === 'ALL'
            ? instruments
            : instruments.filter(i => i.category === instSubTab || (instSubTab === 'OTHERS' && i.category === 'RHYTHMIC')); // Hack to group Rhythmic if needed or show separately

        return (
            <div style={{ marginBottom: '20px' }}>
                {/* Sub Tabs */}
                <div className={styles.subTabContainer}>
                    {['ALL', 'KEYS', 'STRINGS', 'WIND', 'DRUMS', 'OTHERS'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setInstSubTab(tab)}
                            style={{
                                background: instSubTab === tab ? 'var(--color-accent-primary)' : 'transparent',
                                color: instSubTab === tab ? '#000' : 'var(--color-text-muted)',
                                border: instSubTab === tab ? '1px solid var(--color-accent-primary)' : 'var(--glass-border-medium)',
                                borderRadius: '12px', padding: '4px 10px', fontSize: '0.65rem',
                                fontWeight: 'bold', cursor: 'pointer',
                                transition: 'var(--transition-fast)'
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                    {filtered.map(item => (
                        <div
                            key={item.id}
                            draggable={!isSelectionMode}
                            onDragStart={(e) => handleDragStart(e, item, 'preset-inst')}
                            onClick={() => setPreviewMode(true, item.type, item.preset)}
                            className={styles.fileItemHover}
                            style={{
                                background: 'var(--glass-bg-subtle)', padding: '8px', borderRadius: 'var(--radius-md)',
                                border: 'var(--glass-border-subtle)', cursor: 'pointer',
                                fontSize: '0.75rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '8px'
                            }}
                        >
                            <span style={{ fontSize: '1rem' }}>
                                {item.category === 'KEYS' && '🎹'}
                                {item.category === 'STRINGS' && '🎻'}
                                {item.category === 'WIND' && '🎷'}
                                {(item.category === 'RHYTHMIC' || item.category === 'DRUMS') && '🥁'}
                                {item.category === 'OTHERS' && '🎵'}
                            </span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: '#ccc', padding: '16px', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }}>

            {/* 1. Header (No Tabs) */}
            <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '1px', color: '#fff' }}>
                        {currentCategory.icon} {currentCategory.label.toUpperCase()}
                    </span>


                </div>
            </div>

            <input type="file" multiple ref={fileInputRef} style={{ display: 'none' }} accept="audio/*" onChange={handleFileUpload} />

            {/* 2. File List / Content */}
            <div className={styles.scrollContainer}>

                {/* PRESETS SECTION (Only for Synth/Inst) */}
                {category === 'synth' && !isSelectionMode && renderSynthPresets()}
                {category === 'instrument' && !isSelectionMode && renderInstPresets()}

                {/* USER FILES SECTION */}
                <div style={{ marginBottom: '10px', fontSize: '0.8rem', fontWeight: 'bold', color: '#888', borderTop: (category === 'synth' || category === 'instrument') ? '1px solid rgba(255,255,255,0.1)' : 'none', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>MY {currentCategory.label.toUpperCase()}</span>

                    <div style={{ display: 'flex', gap: '5px' }}>
                        {isSelectionMode ? (
                            <>
                                <button onClick={() => { setIsSelectionMode(false); setSelectedIds(new Set()); }} className={styles.glassBtnSmall}>Cancel</button>
                                <button onClick={handleDelete} disabled={selectedIds.size === 0} className={`${styles.glassBtnSmall} ${styles.delete}`}>Delete ({selectedIds.size})</button>
                            </>
                        ) : (
                            <button onClick={() => setIsSelectionMode(true)} className={styles.glassBtnSmall}>Select</button>
                        )}

                        {!isSelectionMode && (
                            <button onClick={() => fileInputRef.current.click()} className={`${styles.glassBtnSmall} ${styles.action}`}>
                                + Import
                            </button>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {loading && <div style={{ padding: '20px', textAlign: 'center', fontSize: '0.8rem', color: '#666' }}>Loading files...</div>}

                    {!loading && assets.length === 0 && (
                        <div style={{ padding: '20px', textAlign: 'center', fontSize: '0.8rem', color: '#444', fontStyle: 'italic' }}>
                            No files in {currentCategory.label}
                        </div>
                    )}

                    {assets.map(asset => {
                        const isSelected = selectedIds.has(asset.id);
                        const isRenaming = renamingId === asset.id;

                        return (
                            <div
                                key={asset.id}
                                draggable={!isSelectionMode && !isRenaming}
                                onDragStart={(e) => handleDragStart(e, asset, 'asset')}
                                onClick={() => { if (isSelectionMode) toggleSelection(asset.id); }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    background: isSelected ? 'rgba(0, 255, 204, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                                    border: isSelected ? '1px solid #00ffcc' : '1px solid rgba(255, 255, 255, 0.05)',
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    cursor: isSelectionMode ? 'pointer' : 'grab',
                                    transition: 'all 0.2s',
                                    backdropFilter: 'blur(5px)',
                                    position: 'relative'
                                }}
                                className={styles.fileItemHover}
                            >
                                {/* Selection Checkbox / Icon */}
                                <div style={{ marginRight: '10px', display: 'flex', alignItems: 'center' }}>
                                    {isSelectionMode ? (
                                        <div style={{
                                            width: '16px', height: '16px',
                                            borderRadius: '4px',
                                            border: isSelected ? '1px solid #00ffcc' : '1px solid #666',
                                            background: isSelected ? '#00ffcc' : 'transparent',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '10px', color: '#000'
                                        }}>
                                            {isSelected && '✓'}
                                        </div>
                                    ) : (
                                        <span style={{ fontSize: '1.2rem', opacity: 0.7 }}>
                                            {currentCategory.icon}
                                        </span>
                                    )}
                                </div>

                                {/* Main Content */}
                                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    {isRenaming ? (
                                        <input
                                            type="text"
                                            value={renameValue}
                                            onChange={(e) => setRenameValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') confirmRename(asset.id);
                                                if (e.key === 'Escape') setRenamingId(null);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            autoFocus
                                            style={{
                                                background: 'rgba(0,0,0,0.5)', border: '1px solid #00ffcc',
                                                color: '#fff', fontSize: '0.8rem', padding: '4px', borderRadius: '4px', width: '100%'
                                            }}
                                        />
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <span style={{
                                                color: isSelected ? '#00ffcc' : '#eee',
                                                fontWeight: '500',
                                                fontSize: '0.85rem',
                                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                            }}>
                                                {asset.originalName}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                {!isSelectionMode && !isRenaming && (
                                    <div style={{ display: 'flex', gap: '8px', marginLeft: '10px' }}>
                                        <button
                                            onClick={(e) => startRename(e, asset)}
                                            style={{
                                                background: 'transparent', border: 'none', cursor: 'pointer',
                                                color: '#aaa', fontSize: '0.9rem', padding: '4px',
                                                borderRadius: '4px', transition: 'color 0.2s, background 0.2s'
                                            }}
                                            title="Rename"
                                            onMouseOver={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                                            onMouseOut={(e) => { e.currentTarget.style.color = '#aaa'; e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            ✎
                                        </button>

                                        {category !== 'background' && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingAsset({ url: asset.url, name: asset.originalName, id: asset.id });
                                                }}
                                                style={{
                                                    background: 'transparent', border: 'none', cursor: 'pointer',
                                                    color: '#00ffcc', fontSize: '0.9rem', padding: '4px',
                                                    borderRadius: '4px', transition: 'color 0.2s, background 0.2s',
                                                    opacity: 0.8
                                                }}
                                                title="Edit / Crop"
                                                onMouseOver={(e) => { e.currentTarget.style.opacity = 1; e.currentTarget.style.background = 'rgba(0, 255, 204, 0.1)'; }}
                                                onMouseOut={(e) => { e.currentTarget.style.opacity = 0.8; e.currentTarget.style.background = 'transparent'; }}
                                            >
                                                ✂️
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Sample Editor Modal */}
            {editingAsset && (
                <SampleEditor
                    fileUrl={editingAsset.url}
                    fileName={editingAsset.name}
                    onClose={() => setEditingAsset(null)}
                    onSave={() => {
                        setEditingAsset(null);
                        fetchAssets();
                    }}
                />
            )}
        </div>
    );
};

export default FileLibrary;

