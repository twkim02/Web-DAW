import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import useStore from '../../store/useStore';
import { uploadFile } from '../../api/upload';

const FileLibrary = () => {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [renamingId, setRenamingId] = useState(null);
    const [renameValue, setRenameValue] = useState('');

    const startRename = (e, asset) => {
        e.stopPropagation();
        setRenamingId(asset.id);
        setRenameValue(asset.originalName);
    };

    const confirmRename = async (id) => {
        if (!renameValue.trim()) return;
        try {
            await axios.put('http://localhost:3001/upload/rename', {
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

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setLoading(true);
            console.log('[FileLibrary] Uploading file:', file.name);
            await uploadFile(file);
            console.log('[FileLibrary] Upload success, refreshing list...');
            await fetchAssets();
        } catch (err) {
            console.error('[FileLibrary] Upload failed', err);
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

    const lastLibraryUpdate = useStore(state => state.lastLibraryUpdate);

    useEffect(() => {
        fetchAssets();
    }, [lastLibraryUpdate]);

    const handleDragStart = (e, asset) => {
        if (isSelectionMode) {
            e.preventDefault(); // Disable drag in selection mode
            return;
        }
        e.dataTransfer.setData('application/json', JSON.stringify({
            type: 'asset', // Keep legacy type for compatibility or update Pad to handle both
            asset,         // Pass full asset object
            libraryType: 'file' // Extra metadata
        }));
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: '#ccc', padding: '16px', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>
                    {isSelectionMode ? `${selectedIds.size} SELECTED` : `FILES (${assets.length})`}
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
                    const isRenaming = renamingId === asset.id;

                    return (
                        <div
                            key={asset.id}
                            draggable={!isSelectionMode && !isRenaming}
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
                            {/* Selection Checkbox */}
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

                            {/* Content */}
                            <div style={{ flex: 1, overflow: 'hidden' }}>
                                {isRenaming ? (
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <input
                                            type="text"
                                            value={renameValue}
                                            onChange={(e) => setRenameValue(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') confirmRename(asset.id);
                                                if (e.key === 'Escape') setRenamingId(null);
                                            }}
                                            onClick={(e) => e.stopPropagation()} // Prevent selection toggle
                                            autoFocus
                                            style={{
                                                flex: 1, background: '#111', border: '1px solid #666',
                                                color: '#fff', fontSize: '0.85rem', padding: '2px 4px'
                                            }}
                                        />
                                        <button onClick={(e) => { e.stopPropagation(); confirmRename(asset.id); }} style={{ cursor: 'pointer', background: 'none', border: 'none', color: '#0f0' }}>✔</button>
                                        <button onClick={(e) => { e.stopPropagation(); setRenamingId(null); }} style={{ cursor: 'pointer', background: 'none', border: 'none', color: '#f00' }}>✖</button>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ color: isSelected ? '#00ffcc' : '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {asset.originalName}
                                            </div>

                                            {/* Rename Button (Only on Hover or Always Visible if not selection mode) */}
                                            {!isSelectionMode && (
                                                <button
                                                    onClick={(e) => startRename(e, asset)}
                                                    style={{
                                                        background: 'transparent', border: 'none', color: '#666',
                                                        cursor: 'pointer', fontSize: '0.9rem', padding: '0 4px',
                                                        display: 'none' // Hidden by default, show on parent hover? 
                                                        // Actually, keep it simple: show a small edit icon always or just have it there
                                                    }}
                                                    className="rename-btn"
                                                >
                                                    ✎
                                                </button>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: '#666', marginTop: '2px' }}>
                                            {new Date(asset.createdAt).toLocaleDateString()}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Enable Hover CSS */}
                            <style>{`
                                .rename-btn { display: none !important; }
                                div:hover > div > div > .rename-btn { display: block !important; }
                            `}</style>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default FileLibrary;
