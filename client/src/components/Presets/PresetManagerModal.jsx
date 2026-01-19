import React, { useEffect, useState } from 'react';
import useStore from '../../store/useStore';
import styles from './PresetManagerModal.module.css';
import SharePresetModal from './SharePresetModal';
import { deletePreset as deletePresetAPI } from '../../api/presets';

const PresetManagerModal = ({ onClose }) => {
    const { presets, setPresets, user, deletePreset: deletePresetFromStore } = useStore();
    const [isLoading, setIsLoading] = useState(false);
    const [sharingPreset, setSharingPreset] = useState(null);

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this preset?")) return;

        try {
            await deletePresetAPI(id);
            // Update Store
            deletePresetFromStore(id);
        } catch (err) {
            console.error('Failed to delete preset:', err);
            alert("Failed to delete preset: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>📂 Preset Manager</h2>
                    <button onClick={onClose} className={styles.closeButton}>✕</button>
                </div>

                <div className={styles.listContainer}>
                    {presets.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                            No presets saved yet.
                        </div>
                    ) : (
                        presets.map(preset => (
                            <div key={preset.id}
                                className={styles.presetItem}
                                onClick={() => { /* Optional: Select behavior */ }}
                            >
                                <div className={styles.presetInfo}>
                                    <h3>{preset.title}</h3>
                                    <div className={styles.presetMeta}>
                                        {new Date(preset.createdAt).toLocaleString()} • BPM: {preset.bpm}
                                    </div>
                                </div>
                                <div className={styles.actions}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onClose(); window.dispatchEvent(new CustomEvent('loadPreset', { detail: preset.id })); }}
                                        className={styles.loadBtn}
                                    >
                                        Load
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSharingPreset(preset); }}
                                        style={{
                                            background: '#2196F3', color: '#fff', border: 'none',
                                            padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', fontSize: '0.8rem'
                                        }}
                                    >
                                        Share
                                    </button>
                                    <button
                                        onClick={(e) => handleDelete(preset.id, e)}
                                        className={styles.deleteBtn}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Share Preset Modal */}
            {sharingPreset && (
                <SharePresetModal
                    preset={sharingPreset}
                    isOpen={!!sharingPreset}
                    onClose={() => setSharingPreset(null)}
                    onSuccess={() => {
                        // 게시 성공 후 프리셋 목록 새로고침 (필요시)
                        setSharingPreset(null);
                    }}
                />
            )}
        </div>
    );
};

export default PresetManagerModal;
