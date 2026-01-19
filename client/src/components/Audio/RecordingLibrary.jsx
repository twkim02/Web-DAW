import React, { useState, useRef } from 'react';
import { uploadFile } from '../../api/upload';
import client from '../../api/client';
import SampleEditor from './SampleEditor';
import styles from './FileLibrary.module.css';

const RecordingLibrary = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [recordings, setRecordings] = useState([]);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    const [selectedIds, setSelectedIds] = useState(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const fileInputRef = useRef(null);

    const fetchRecordings = async () => {
        try {
            const res = await client.get('/upload?category=recording');
            if (Array.isArray(res.data)) {
                setRecordings(res.data);
            }
        } catch (err) {
            console.error('Failed to fetch recordings', err);
        }
    };

    React.useEffect(() => {
        fetchRecordings();
    }, []);

    const handleFileUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        try {
            const uploadPromises = files.map(file => uploadFile(file, 'recording')); // category 'recording'
            await Promise.all(uploadPromises);
            await fetchRecordings();
        } catch (err) {
            console.error('Upload failed', err);
            alert('Failed to upload recordings');
        } finally {
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDelete = async () => {
        if (selectedIds.size === 0) return;
        if (!confirm(`Delete ${selectedIds.size} recordings?`)) return;
        try {
            await client.post('/upload/delete', { ids: Array.from(selectedIds) });
            setSelectedIds(new Set());
            setIsSelectionMode(false);
            await fetchRecordings();
        } catch (err) {
            console.error('Delete failed', err);
            alert('Failed to delete recordings');
        }
    };

    const toggleSelection = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const handleRecordToggle = async () => {
        if (!isRecording) {
            // Start Recording
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                mediaRecorderRef.current = new MediaRecorder(stream);
                audioChunksRef.current = [];

                mediaRecorderRef.current.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunksRef.current.push(event.data);
                    }
                };

                mediaRecorderRef.current.onstop = async () => {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const defaultName = `Recording_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}`;
                    const name = window.prompt("Save Recording As:", defaultName);

                    if (!name) {
                        // Cleanup
                        stream.getTracks().forEach(track => track.stop());
                        return;
                    }

                    const file = new File([audioBlob], `${name}.webm`, { type: 'audio/webm' });

                    // Upload
                    try {
                        console.log('Uploading Recording...');
                        const response = await uploadFile(file, 'recording'); // Ensure category is passed
                        const newRec = {
                            id: response.file.id,
                            name: response.file.originalName,
                            date: new Date(),
                            fileUrl: `http://localhost:3001/uploads/${response.file.filename}`,
                            originalName: response.file.originalName,
                            filename: response.file.filename
                        };
                        setRecordings(prev => [newRec, ...prev]);
                        console.log('Recording Saved:', newRec);
                    } catch (err) {
                        console.error('Failed to upload recording', err);
                        alert('Failed to save recording');
                    }

                    // Stop tracks
                    stream.getTracks().forEach(track => track.stop());
                };

                mediaRecorderRef.current.start();
                setIsRecording(true);
            } catch (err) {
                console.error('Error accessing microphone:', err);
                alert('Could not access microphone');
            }
        } else {
            // Stop Recording
            if (mediaRecorderRef.current) {
                mediaRecorderRef.current.stop();
                setIsRecording(false);
            }
        }
    };

    const handleDragStart = (e, rec) => {
        e.dataTransfer.setData('application/json', JSON.stringify({
            type: 'recording',
            // Create a standard asset object that Pad.jsx expects
            asset: {
                id: rec.id,
                originalName: rec.name,
                filename: rec.filename
            }
        }));
    };

    const [renamingId, setRenamingId] = useState(null);
    const [renameValue, setRenameValue] = useState('');
    const [editingAsset, setEditingAsset] = useState(null); // { url, name, id }

    const startRename = (e, rec) => {
        e.stopPropagation();
        setRenamingId(rec.id);
        setRenameValue(rec.name);
    };

    const confirmRename = async (id) => {
        if (!renameValue.trim()) return;
        try {
            await client.put('/upload/rename', {
                id,
                newName: renameValue.trim()
            });
            setRenamingId(null);
            // Refresh list - simplest way is to manually update state or re-fetch if we had a fetch function.
            // Since we don't have a fetch function separate from initial load (which is missing here actually? No, it's just local state for now?)
            // Wait, RecordingLibrary uses local state `recordings` which is initialized empty? 
            // It seems RecordingLibrary DOES NOT fetch existing recordings on mount in the current code! 
            // We should add a fetch effect too while we are at it.
            setRecordings(prev => prev.map(r => r.id === id ? { ...r, name: renameValue.trim(), originalName: renameValue.trim() } : r));
        } catch (err) {
            console.error('Rename failed', err);
            alert('Failed to rename');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: 'var(--color-text-secondary)', padding: '16px', boxSizing: 'border-box' }}>
            <div style={{ marginBottom: '10px', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>MY RECORDINGS</span>
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

            <input type="file" multiple ref={fileInputRef} style={{ display: 'none' }} accept="audio/*" onChange={handleFileUpload} />

            <button
                onClick={handleRecordToggle}
                style={{
                    width: '100%',
                    padding: '15px',
                    borderRadius: 'var(--radius-md)',
                    background: isRecording ? 'var(--color-recording)' : '#333',
                    border: 'none',
                    color: 'var(--color-text-primary)',
                    fontWeight: 'bold',
                    marginBottom: '20px',
                    cursor: 'pointer',
                    boxShadow: isRecording ? '0 0 15px rgba(255, 0, 0, 0.5)' : 'none',
                    transition: 'var(--transition-fast)'
                }}
            >
                {isRecording ? '⏺ STOP RECORDING' : '🔴 START RECORDING'}
            </button>

            <div className={styles.scrollContainer} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {recordings.length === 0 && (
                    <div style={{ fontSize: '0.8rem', color: '#666', textAlign: 'center', marginTop: '20px' }}>No recordings yet.</div>
                )}

                {recordings.map(rec => {
                    const isRenaming = renamingId === rec.id;
                    return (
                        <div
                            key={rec.id}
                            draggable={!isRenaming}
                            onDragStart={(e) => handleDragStart(e, rec)}
                            onClick={() => { if (isSelectionMode) toggleSelection(rec.id); }}
                            className={styles.fileItemHover}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                background: selectedIds.has(rec.id) ? 'var(--color-accent-hover)' : 'var(--glass-bg-subtle)',
                                border: selectedIds.has(rec.id) ? '1px solid var(--color-accent-primary)' : 'var(--glass-border-subtle)',
                                padding: '8px 12px',
                                borderRadius: 'var(--radius-md)',
                                cursor: isSelectionMode ? 'pointer' : 'grab',
                                transition: 'var(--transition-fast)',
                                backdropFilter: 'var(--glass-blur-sm)',
                                position: 'relative'
                            }}
                        >
                            {/* Checkbox / Icon */}
                            <div style={{ marginRight: '10px', display: 'flex', alignItems: 'center' }}>
                                {isSelectionMode ? (
                                    <div style={{
                                        width: '16px', height: '16px',
                                        borderRadius: 'var(--radius-sm)',
                                        border: selectedIds.has(rec.id) ? '1px solid var(--color-accent-primary)' : '1px solid #666',
                                        background: selectedIds.has(rec.id) ? 'var(--color-accent-primary)' : 'transparent',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '10px', color: '#000'
                                    }}>
                                        {selectedIds.has(rec.id) && '✓'}
                                    </div>
                                ) : (
                                    <span style={{ fontSize: '1.2rem', opacity: 0.7 }}>🎙️</span>
                                )}
                            </div>

                            {/* Content */}
                            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                {isRenaming ? (
                                    <input
                                        type="text"
                                        value={renameValue}
                                        onChange={(e) => setRenameValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') confirmRename(rec.id);
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
                                            color: '#eee',
                                            fontWeight: '500',
                                            fontSize: '0.85rem',
                                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                        }}>
                                            {rec.name}
                                        </span>
                                    </div>
                                )}
                                <div style={{ fontSize: '0.65rem', color: '#888' }}>
                                    {new Date(rec.date).toLocaleTimeString()}
                                </div>
                            </div>

                            {/* Actions */}
                            {!isRenaming && (
                                <div style={{ display: 'flex', gap: '8px', marginLeft: '10px' }}>
                                    <button
                                        onClick={(e) => startRename(e, rec)}
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

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Ensure we use the correct URL structure. RecordingLibrary usually has fileUrl or construct it.
                                            // In handleRecordToggle, we set `fileUrl`.
                                            // If fetched from server, it might be constructed differently.
                                            // Let's use rec.fileUrl if available, else construct from filename.
                                            const url = rec.fileUrl || `http://localhost:3001/uploads/${rec.filename}`;
                                            setEditingAsset({ url, name: rec.name, id: rec.id });
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
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Sample Editor Modal */}
            {editingAsset && (
                <SampleEditor
                    fileUrl={editingAsset.url}
                    fileName={editingAsset.name}
                    onClose={() => setEditingAsset(null)}
                    onSave={() => {
                        setEditingAsset(null);
                        // Refresh logic if needed? 
                        // The editor saves to a NEW file or overrides? 
                        // If override, we might need to bust cache or re-fetch.
                        // For now, assume it saves new or handled by server.
                    }}
                />
            )}
        </div>
    );
};

export default RecordingLibrary;
