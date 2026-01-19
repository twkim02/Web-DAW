import React, { useEffect, useState } from 'react';
import useStore from '../../store/useStore';
import styles from './PresetManagerModal.module.css';

const PresetManagerModal = ({ onClose }) => {
    const { presets, setPresets, user, deletePreset } = useStore();
    const [isLoading, setIsLoading] = useState(false);

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this preset?")) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`http://localhost:3001/presets/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                deletePreset(id);
            } else {
                alert("Failed to delete preset");
            }
        } catch (err) {
            console.error(err);
            alert("Error deleting preset");
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
        </div>
    );
};

export default PresetManagerModal;
