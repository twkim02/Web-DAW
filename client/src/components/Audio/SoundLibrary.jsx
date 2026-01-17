import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { uploadFile } from '../../api/upload';

const SoundLibrary = () => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());

    const fileInputRef = useRef(null);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setLoading(true);
            console.log('[SoundLibrary] Uploading file:', file.name);
            await uploadFile(file);
            console.log('[SoundLibrary] Upload success, refreshing list...');
            await fetchAssets();
        } catch (err) {
            console.error('[SoundLibrary] Upload failed', err);
            alert('Failed to upload file');
        } finally {
            setLoading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Reset input
            }
        }
    };

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const res = await axios.get('http://localhost:3001/upload');
            if (Array.isArray(res.data)) {
                setAssets(res.data);
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
            await axios.post('http://localhost:3001/upload/delete', {
                ids: Array.from(selectedIds)
            });
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
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    useEffect(() => {
        fetchAssets();
    }, []);

    const handleDragStart = (e, asset) => {
        if (isSelectionMode) {
            e.preventDefault(); // Disable drag in selection mode
            return;
        }
        e.dataTransfer.setData('application/json', JSON.stringify({
            type: 'asset',
            asset
        }));
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: '#ccc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {isSelectionMode ? `${selectedIds.size} SELECTED` : `LIBRARY (${assets.length})`}
                </span>

                <div style={{ display: 'flex', gap: '5px' }}>
                    {/* Selection Toggle / Delete Button */}
                    {isSelectionMode ? (
                        <>
                            <button
                                onClick={() => {
                                    setIsSelectionMode(false);
                                    setSelectedIds(new Set());
                                }}
                                style={{
                                    background: '#444', border: '1px solid #666', color: '#fff',
                                    cursor: 'pointer', fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={selectedIds.size === 0}
                                style={{
                                    background: selectedIds.size > 0 ? '#ff3333' : '#552222',
                                    border: 'none', color: '#fff', cursor: selectedIds.size > 0 ? 'pointer' : 'default',
                                    fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px', fontWeight: 'bold'
                                }}
                            >
                                Delete
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setIsSelectionMode(true)}
                            style={{
                                background: 'transparent', border: '1px solid #666', color: '#888',
                                cursor: 'pointer', fontSize: '0.7rem', padding: '4px 8px', borderRadius: '4px'
                            }}
                        >
                            Select
                        </button>
                    )}

                    {/* Add Button (Hidden in selection mode) */}
                    {!isSelectionMode && (
                        <button
                            onClick={() => fileInputRef.current.click()}
                            style={{
                                background: '#00ffcc', border: 'none', color: '#000', cursor: 'pointer',
                                fontSize: '1.2rem', fontWeight: 'bold', width: '24px', height: '24px',
                                borderRadius: '4px', lineHeight: '24px', padding: 0
                            }}
                            title="Add Sound"
                        >
                            +
                        </button>
                    )}
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="audio/*"
                onChange={handleFileUpload}
            />

            <div style={{ flex: 1, overflowY: 'auto' }}>
                {loading && <div style={{ padding: '10px', fontSize: '0.8rem' }}>Loading...</div>}

                {!loading && assets.length === 0 && (
                    <div style={{ padding: '10px', fontSize: '0.8rem', fontStyle: 'italic' }}>No sounds found.</div>
                )}

                {Array.isArray(assets) && assets.map(asset => {
                    const isSelected = selectedIds.has(asset.id);
                    return (
                        <div
                            key={asset.id}
                            draggable={!isSelectionMode}
                            onDragStart={(e) => handleDragStart(e, asset)}
                            onClick={() => {
                                if (isSelectionMode) toggleSelection(asset.id);
                            }}
                            style={{
                                background: isSelected ? '#334444' : '#222',
                                marginBottom: '4px',
                                padding: '8px',
                                borderRadius: '4px',
                                cursor: isSelectionMode ? 'pointer' : 'grab',
                                fontSize: '0.85rem',
                                border: isSelected ? '1px solid #00ffcc' : '1px solid #333',
                                transition: 'all 0.1s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            {isSelectionMode && (
                                <div style={{
                                    width: '16px', height: '16px',
                                    background: isSelected ? '#00ffcc' : 'transparent',
                                    border: isSelected ? '1px solid #00ffcc' : '1px solid #666',
                                    borderRadius: '3px',
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#000',
                                    fontSize: '12px',
                                    fontWeight: 'bold'
                                }}>
                                    {isSelected && '✔'}
                                </div>
                            )}

                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                <div style={{ color: isSelected ? '#00ffcc' : '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {asset.originalName}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '2px' }}>
                                    {new Date(asset.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SoundLibrary;
