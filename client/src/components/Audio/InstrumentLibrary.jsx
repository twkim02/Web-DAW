import React, { useEffect, useState, useRef } from 'react';
import useStore from '../../store/useStore';
import client from '../../api/client';
import { uploadFile } from '../../api/upload';

const InstrumentLibrary = () => {
    // REAL VIRTUAL INSTRUMENTS (Updated Definitions)
    const instruments = [
        // KEYBOARDS
        { id: 'grand_piano', name: 'Grand Piano', type: 'sampler', preset: 'grand_piano', category: 'KEYS' },
        { id: 'electric_piano', name: 'Electric Piano', type: 'sampler', preset: 'electric_piano', category: 'KEYS' },

        // STRINGS (Guitars + Orch)
        { id: 'acoustic_guitar', name: 'Acoustic Guitar', type: 'sampler', preset: 'acoustic_guitar', category: 'STRINGS' },
        { id: 'electric_guitar', name: 'Electric Guitar', type: 'sampler', preset: 'electric_guitar', category: 'STRINGS' },
        { id: 'strings', name: 'String Ensemble', type: 'sampler', preset: 'strings', category: 'STRINGS' },
        { id: 'cello', name: 'Cello', type: 'sampler', preset: 'cello', category: 'STRINGS' },

        // WIND
        { id: 'brass', name: 'Brass Section', type: 'sampler', preset: 'brass', category: 'WIND' },
        { id: 'flute', name: 'Flute', type: 'sampler', preset: 'flute', category: 'WIND' },
        { id: 'clarinet', name: 'Clarinet', type: 'sampler', preset: 'clarinet', category: 'WIND' },

        // OTHERS
        { id: 'choir', name: 'Choir Aahs', type: 'sampler', preset: 'choir', category: 'OTHERS' },
        { id: 'chiptune', name: 'Chiptune (8-bit)', type: 'synth', preset: 'fx_chiptune', category: 'OTHERS' },

        // RHYTHMIC (Percussion)
        { id: '808_kit', name: '808 Drum Kit', type: 'drums', preset: '808', category: 'RHYTHMIC' },
        { id: 'acoustic_kit', name: 'Acoustic Kit', type: 'drums', preset: 'acoustic', category: 'RHYTHMIC' },
        { id: 'kpr77_kit', name: 'Vinyl (Lo-Fi) Kit', type: 'drums', preset: 'kpr77', category: 'RHYTHMIC' },
    ];

    const setPreviewMode = useStore(state => state.setPreviewMode);

    // UI STATE
    const [mainTab, setMainTab] = useState('MELODIC'); // MELODIC vs RHYTHMIC
    const [subTab, setSubTab] = useState('KEYS');      // KEYS, STRINGS, WIND, OTHERS (For Melodic)

    // Dynamic Assets State
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);
    const lastLibraryUpdate = useStore(state => state.lastLibraryUpdate);

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const res = await client.get('/upload?category=instrument');
            if (Array.isArray(res.data)) setAssets(res.data);
            else setAssets([]);
        } catch (err) {
            console.error('Failed to fetch instrument assets', err);
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
            const uploadPromises = files.map(file => uploadFile(file, 'instrument'));
            await Promise.all(uploadPromises);
            await fetchAssets();
        } catch (err) {
            alert('Failed to upload instrument file');
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDragStart = (e, item, isPreset = false) => {
        if (isPreset) {
            e.dataTransfer.setData('application/json', JSON.stringify({
                type: 'instrument',
                instrument: {
                    name: item.name,
                    type: item.type, // 'piano', 'drums'
                    preset: item.preset
                }
            }));
        } else {
            // Treat uploaded instrument files as samples meant for pads
            e.dataTransfer.setData('application/json', JSON.stringify({
                type: 'asset',
                asset: item,
                libraryType: 'instrument'
            }));
        }
        e.dataTransfer.effectAllowed = 'copy';
    };

    // Filter Logic
    const getFilteredInstruments = () => {
        if (mainTab === 'RHYTHMIC') {
            return instruments.filter(i => i.category === 'RHYTHMIC');
        } else {
            return instruments.filter(i => i.category === subTab);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: '#ccc', padding: '16px', boxSizing: 'border-box' }}>

            <div style={{ marginBottom: '15px', fontSize: '0.9rem', fontWeight: 'bold', color: '#fff', textAlign: 'center' }}>
                VIRTUAL INSTRUMENTS
            </div>

            {/* LEVEL 1: MELODIC vs RHYTHMIC */}
            <div style={{ display: 'flex', marginBottom: '10px', background: '#222', padding: '4px', borderRadius: '8px' }}>
                {['MELODIC', 'RHYTHMIC'].map((tab) => (
                    <div
                        key={tab}
                        onClick={() => setMainTab(tab)}
                        style={{
                            flex: 1, textAlign: 'center', padding: '6px', fontSize: '0.8rem', cursor: 'pointer',
                            borderRadius: '6px', fontWeight: 'bold',
                            background: mainTab === tab ? '#444' : 'transparent',
                            color: mainTab === tab ? '#fff' : '#888',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab === 'MELODIC' ? '🎵 MELODY' : '🥁 RHYTHM'}
                    </div>
                ))}
            </div>

            {/* LEVEL 2: SUB-CATEGORIES (Only for Melodic) */}
            {mainTab === 'MELODIC' && (
                <div style={{ display: 'flex', gap: '5px', marginBottom: '15px', overflowX: 'auto', paddingBottom: '5px' }}>
                    {['KEYS', 'STRINGS', 'WIND', 'OTHERS'].map(cat => (
                        <div
                            key={cat}
                            onClick={() => setSubTab(cat)}
                            style={{
                                padding: '4px 10px', fontSize: '0.7rem', cursor: 'pointer',
                                borderRadius: '15px', whiteSpace: 'nowrap',
                                border: subTab === cat ? '1px solid #00ffff' : '1px solid #444',
                                color: subTab === cat ? '#00ffff' : '#888',
                                background: subTab === cat ? 'rgba(0, 255, 255, 0.1)' : 'transparent'
                            }}
                        >
                            {cat}
                        </div>
                    ))}
                </div>
            )}

            {/* Instrument Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px', overflowY: 'auto', maxHeight: '300px' }}>
                {getFilteredInstruments().map(inst => (
                    <div
                        key={inst.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, inst, true)}
                        onClick={() => setPreviewMode(true, inst.type, inst.preset)}
                        style={{
                            background: '#2a2a2a', padding: '10px', borderRadius: '6px', cursor: 'pointer',
                            fontSize: '0.8rem', border: '1px solid #444', color: '#ddd',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            transition: 'all 0.2s'
                        }}
                        title={inst.name}
                    >
                        <span style={{ fontSize: '1.2rem' }}>
                            {inst.category === 'KEYS' && '🎹'}
                            {inst.category === 'STRINGS' && '🎻'}
                            {inst.category === 'WIND' && '🎷'}
                            {(inst.category === 'OTHERS' || inst.category === 'RHYTHMIC') && '🎵'}
                        </span>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {inst.name}
                        </div>
                    </div>
                ))}
            </div>


            {/* User Recordings Section */}
            <div style={{ marginTop: 'auto', borderTop: '1px solid #333', paddingTop: '10px' }}>
                <div style={{ marginBottom: '10px', fontSize: '0.8rem', fontWeight: 'bold', color: '#aaa', display: 'flex', justifyContent: 'space-between' }}>
                    <span>USER RECORDINGS</span>
                    <label style={{ cursor: 'pointer', color: '#00ffff', fontSize: '0.7rem' }}>
                        + UPLOAD
                        <input
                            type="file" multiple accept="audio/*"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileUpload}
                        />
                    </label>
                </div>
                {loading ? (
                    <div style={{ textAlign: 'center', color: '#666', fontSize: '0.8rem' }}>Loading...</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '150px', overflowY: 'auto' }}>
                        {assets.map(asset => (
                            <div
                                key={asset.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, asset, false)}
                                style={{
                                    background: '#1a1a1a', padding: '6px 10px', borderRadius: '4px',
                                    fontSize: '0.75rem', color: '#999', border: '1px solid #333',
                                    cursor: 'grab', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                }}
                            >
                                🎤 {asset.originalName}
                            </div>
                        ))}
                        {assets.length === 0 && (
                            <div style={{ textAlign: 'center', color: '#444', fontSize: '0.7rem', fontStyle: 'italic' }}>
                                No recordings yet
                            </div>
                        )}
                    </div>
                )}
            </div>

        </div>
    );
};

export default InstrumentLibrary;
