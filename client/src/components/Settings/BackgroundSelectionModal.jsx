import React, { useRef } from 'react';
import ReactDOM from 'react-dom';
import useStore from '../../store/useStore';
import { THEMES } from '../../constants/themes';
import styles from './BackgroundSelectionModal.module.css';

const BackgroundSelectionModal = ({ onClose }) => {
    const currentThemeId = useStore((state) => state.currentThemeId);
    const setThemeId = useStore((state) => state.setThemeId);
    const customBackgroundImage = useStore((state) => state.customBackgroundImage);
    const setCustomBackgroundImage = useStore((state) => state.setCustomBackgroundImage);

    const showVisualizer = useStore((state) => state.showVisualizer);
    const setShowVisualizer = useStore((state) => state.setShowVisualizer);
    const visualizerMode = useStore((state) => state.visualizerMode);
    const setVisualizerMode = useStore((state) => state.setVisualizerMode);

    const fileInputRef = useRef(null);

    const handleThemeSelect = (themeId) => {
        setThemeId(themeId);
        // Use requested behavior: Do NOT clear custom BG when selecting a theme.
        // The custom BG should overlay/persist. User can manually remove it.
        // setCustomBackgroundImage(null); 
    };

    const handleFileUpload = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const formData = new FormData();
            formData.append('file', file);
            formData.append('category', 'background');

            try {
                // Assuming same backend logic as App.jsx
                const response = await fetch('http://localhost:3001/upload', { method: 'POST', body: formData });
                const data = await response.json();
                if (data.file) {
                    const timestamp = Date.now();
                    setCustomBackgroundImage(`http://localhost:3001/uploads/${data.file.filename}?t=${timestamp}`);
                }
            } catch (err) {
                alert('Upload Failed');
                console.error(err);
            }
            e.target.value = '';
        }
    };

    const modalContent = (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Settings</h2>
                    <button className={styles.closeBtn} onClick={onClose}>×</button>
                </div>

                <div className={styles.content}>

                    {/* 1. Visualizer Settings */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h3>Sound Visualizer</h3>
                            <button
                                className={`${styles.toggleBtn} ${showVisualizer ? styles.active : ''}`}
                                onClick={() => setShowVisualizer(!showVisualizer)}
                            >
                                {showVisualizer ? 'ON' : 'OFF'}
                            </button>
                        </div>

                        {showVisualizer && (
                            <div className={styles.modeGrid}>
                                {[
                                    { id: 'default', name: 'Standard' },
                                    { id: 'particles', name: 'Particles' },
                                    { id: 'circular_wave', name: 'Sonar' },
                                    { id: 'bass', name: 'Bass Reactive' },
                                    { id: 'rainbow', name: 'Rainbow' },
                                    { id: 'gradient', name: 'Gradient' }
                                ].map(mode => (
                                    <button
                                        key={mode.id}
                                        className={`${styles.modeBtn} ${visualizerMode === mode.id ? styles.selected : ''}`}
                                        onClick={() => setVisualizerMode(mode.id)}
                                    >
                                        {mode.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 2. Custom Upload Section */}
                    <div className={styles.section}>
                        <h3>Background Image</h3>
                        <div className={styles.uploadRow}>
                            <div
                                className={`${styles.previewBox} ${customBackgroundImage ? styles.active : ''}`}
                                style={{ backgroundImage: customBackgroundImage ? `url(${customBackgroundImage})` : 'none' }}
                                onClick={() => fileInputRef.current.click()}
                            >
                                {!customBackgroundImage && <span>+ Upload Image</span>}
                            </div>

                            {customBackgroundImage && (
                                <button
                                    className={styles.clearBtn}
                                    onClick={() => setCustomBackgroundImage(null)}
                                >
                                    Remove Custom BG
                                </button>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileUpload}
                            />
                        </div>
                    </div>

                    {/* 3. Preset Themes Section */}
                    <div className={styles.section}>
                        <h3>Preset Themes</h3>
                        <div className={styles.grid}>
                            {THEMES.map((theme) => (
                                <div
                                    key={theme.id}
                                    className={`${styles.themeCard} ${currentThemeId === theme.id && !customBackgroundImage ? styles.selected : ''}`}
                                    onClick={() => handleThemeSelect(theme.id)}
                                >
                                    <div
                                        className={styles.themePreview}
                                        style={{ background: theme.background }}
                                    >
                                        <div className={styles.colorSwatches}>
                                            <div style={{ background: theme.primaryColor }} />
                                            <div style={{ background: theme.secondaryColor }} />
                                        </div>
                                    </div>
                                    <span className={styles.themeName}>{theme.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default BackgroundSelectionModal;
