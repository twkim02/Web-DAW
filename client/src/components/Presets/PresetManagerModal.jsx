import React, { useEffect, useState, useMemo } from 'react';
import useStore from '../../store/useStore';
import styles from './PresetManagerModal.module.css';
import SharePresetModal from './SharePresetModal';
import { deletePreset as deletePresetAPI } from '../../api/presets';

const PresetManagerModal = ({ onClose }) => {
    const { presets, setPresets, user, deletePreset: deletePresetFromStore } = useStore();
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'mine', 'saved'
    const [searchQuery, setSearchQuery] = useState('');
    const [sharingPreset, setSharingPreset] = useState(null);

    // Filter Logic
    const filteredPresets = useMemo(() => {
        let result = presets;

        // 1. Tab Filter
        if (activeTab === 'mine') {
            result = result.filter(p => p.userId === user?.id);
        } else if (activeTab === 'saved') {
            // "Saved" logic usually implies 'forked' or specific flag. 
            // For now, let's assume 'saved' = NOT mine.
            result = result.filter(p => p.userId !== user?.id);
        }

        // 2. Search Filter
        if (searchQuery.trim()) {
            const lowerQ = searchQuery.toLowerCase();
            result = result.filter(p => p.title.toLowerCase().includes(lowerQ));
        }

        // Sort by Date Descending
        return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [presets, activeTab, searchQuery, user]);


    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this preset?")) return;

        try {
            await deletePresetAPI(id);
            deletePresetFromStore(id);
        } catch (err) {
            console.error('Failed to delete preset:', err);
            alert("Failed to delete preset: " + (err.response?.data?.message || err.message));
        }
    };

    const handleLoad = (preset) => {
        onClose();
        window.dispatchEvent(new CustomEvent('loadPreset', { detail: preset.id }));
    }

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.topRow}>
                        <h2 className={styles.title}>
                            <span style={{ fontSize: '1.2em' }}>📂</span> Library
                        </h2>
                        <button onClick={onClose} className={styles.closeButton}>✕</button>
                    </div>

                    <div className={styles.controlsRow}>
                        {/* Tabs */}
                        <div className={styles.tabContainer}>
                            <button
                                className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`}
                                onClick={() => setActiveTab('all')}
                            >
                                All
                            </button>
                            <button
                                className={`${styles.tab} ${activeTab === 'mine' ? styles.active : ''}`}
                                onClick={() => setActiveTab('mine')}
                            >
                                My Presets
                            </button>
                            <button
                                className={`${styles.tab} ${activeTab === 'saved' ? styles.active : ''}`}
                                onClick={() => setActiveTab('saved')}
                            >
                                Saved
                            </button>
                        </div>

                        {/* Search */}
                        <div className={styles.searchContainer}>
                            <span className={styles.searchIcon}>🔍</span>
                            <input
                                type="text"
                                className={styles.searchInput}
                                placeholder="Search presets..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                {/* List Content */}
                <div className={styles.listContainer}>
                    {filteredPresets.length === 0 ? (
                        <div className={styles.emptyState}>
                            <span style={{ fontSize: '3rem', opacity: 0.2 }}>📭</span>
                            <p>No presets found.</p>
                        </div>
                    ) : (
                        filteredPresets.map(preset => (
                            <div key={preset.id} className={styles.presetItem} onClick={() => handleLoad(preset)}>
                                <div className={styles.presetInfo}>
                                    <h3 className={styles.presetTitle}>{preset.title}</h3>
                                    <div className={styles.presetMeta}>
                                        <span className={styles.tag}>BPM {preset.bpm}</span>
                                        <span>{new Date(preset.createdAt).toLocaleDateString()}</span>
                                        {preset.userId === user?.id && <span className={styles.tag} style={{ background: 'rgba(255,255,255,0.05)' }}>Mine</span>}
                                    </div>
                                </div>

                                <div className={styles.actions}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleLoad(preset); }}
                                        className={`${styles.actionBtn} ${styles.loadBtn}`}
                                    >
                                        Load
                                    </button>

                                    {/* Share Button (Only for own presets OR if we allow re-sharing) */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSharingPreset(preset); }}
                                        className={`${styles.actionBtn} ${styles.shareBtn}`}
                                        title="Share to Community"
                                    >
                                        Share
                                    </button>

                                    {/* Delete Button (Only for own presets) */}
                                    {preset.userId === user?.id && (
                                        <button
                                            onClick={(e) => handleDelete(preset.id, e)}
                                            className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Share Modal */}
            {sharingPreset && (
                <SharePresetModal
                    preset={sharingPreset}
                    isOpen={!!sharingPreset}
                    onClose={() => setSharingPreset(null)}
                    onSuccess={() => setSharingPreset(null)}
                />
            )}
        </div>
    );
};

export default PresetManagerModal;
