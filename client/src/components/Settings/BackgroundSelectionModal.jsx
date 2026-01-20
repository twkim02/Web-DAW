import React, { useRef, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import client from '../../api/client';
import useStore from '../../store/useStore';
import { useUserPreferences } from '../../hooks/useUserPreferences';
import { THEMES } from '../../constants/themes';
import { uploadGraphicAsset, getGraphicAssets, deleteGraphicAsset } from '../../api/graphicAssets';
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

    const { savePreferences } = useUserPreferences();
    const user = useStore((state) => state.user);

    // Create Ref for file input
    const fileInputRef = useRef(null);

    // Background assets state
    const [backgroundAssets, setBackgroundAssets] = useState([]);
    const [loadingAssets, setLoadingAssets] = useState(false);
    const [currentAssetId, setCurrentAssetId] = useState(null);

    const handleThemeSelect = (themeId) => {
        setThemeId(themeId);
        // Persist
        savePreferences({ currentThemeId: themeId });
    };

    // Load background assets
    useEffect(() => {
        const loadBackgroundAssets = async () => {
            try {
                setLoadingAssets(true);
                const assets = await getGraphicAssets({ category: 'background' });
                setBackgroundAssets(assets);
            } catch (err) {
                console.error('Failed to load background assets:', err);
            } finally {
                setLoadingAssets(false);
            }
        };
        loadBackgroundAssets();
    }, [user]);

    // Get current asset ID from URL
    useEffect(() => {
        if (customBackgroundImage && backgroundAssets.length > 0) {
            const baseURL = client.defaults.baseURL || 'http://localhost:3001';
            
            // Try to find matching asset from loaded assets
            // Compare both with and without baseURL
            const asset = backgroundAssets.find(a => {
                let assetUrl = a.url;
                // Normalize URLs for comparison
                if (assetUrl && !assetUrl.startsWith('http')) {
                    assetUrl = `${baseURL}${assetUrl}`;
                }
                return assetUrl === customBackgroundImage || a.url === customBackgroundImage;
            });
            
            if (asset) {
                setCurrentAssetId(asset.id);
            } else {
                setCurrentAssetId(null);
            }
        } else {
            setCurrentAssetId(null);
        }
    }, [customBackgroundImage, backgroundAssets]);

    const handleFileUpload = async (e) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            try {
                const result = await uploadGraphicAsset(file, 'background', false);
                
                if (result.asset) {
                    const asset = result.asset;
                    let fileUrl = asset.url;

                    // If relative URL (local), prepend base URL
                    const baseURL = client.defaults.baseURL || 'http://localhost:3001';
                    if (fileUrl && !fileUrl.startsWith('http')) {
                        fileUrl = `${baseURL}${fileUrl}`;
                    }

                    // Add timestamp to prevent caching issues for local files if replaced
                    if (!fileUrl.includes('?')) {
                        const timestamp = Date.now();
                        fileUrl = `${fileUrl}?t=${timestamp}`;
                    }

                    setCustomBackgroundImage(fileUrl);
                    setCurrentAssetId(asset.id);
                    savePreferences({ customBackgroundImage: fileUrl });
                    
                    // Refresh assets list
                    const assets = await getGraphicAssets({ category: 'background' });
                    setBackgroundAssets(assets);
                }
            } catch (err) {
                alert('Upload Failed: ' + (err.response?.data?.message || err.message));
                console.error(err);
            }
        }
        e.target.value = '';
    };

    const handleRemoveCustomBg = async () => {
        // Delete asset if it exists
        if (currentAssetId) {
            try {
                await deleteGraphicAsset(currentAssetId);
            } catch (err) {
                console.warn('Failed to delete graphic asset:', err);
                // Continue with removal even if delete fails
            }
        }
        
        setCustomBackgroundImage(null);
        setCurrentAssetId(null);
        savePreferences({ customBackgroundImage: null });
        
        // Refresh assets list
        const assets = await getGraphicAssets({ category: 'background' });
        setBackgroundAssets(assets);
    };

    const handleSelectAsset = async (asset) => {
        let fileUrl = asset.url;
        
        // If relative URL (local), prepend base URL
        const baseURL = client.defaults.baseURL || 'http://localhost:3001';
        if (fileUrl && !fileUrl.startsWith('http')) {
            fileUrl = `${baseURL}${fileUrl}`;
        }

        // Add timestamp to prevent caching issues
        if (!fileUrl.includes('?')) {
            const timestamp = Date.now();
            fileUrl = `${fileUrl}?t=${timestamp}`;
        }

        setCustomBackgroundImage(fileUrl);
        setCurrentAssetId(asset.id);
        savePreferences({ customBackgroundImage: fileUrl });
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
                                        className={`${styles.modeBtn} ${(visualizerMode === mode.id) ||
                                                (!visualizerMode && mode.id === 'default' && (!THEMES.find(t => t.id === currentThemeId)?.visualizerMode || THEMES.find(t => t.id === currentThemeId)?.visualizerMode === 'default')) ||
                                                (!visualizerMode && mode.id === THEMES.find(t => t.id === currentThemeId)?.visualizerMode)
                                                ? styles.selected : ''
                                            }`}
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
                                    onClick={handleRemoveCustomBg}
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

                        {/* Background Assets Library */}
                        {backgroundAssets.length > 0 && (
                            <div style={{ marginTop: '20px' }}>
                                <h4 style={{ fontSize: '0.9rem', marginBottom: '10px', color: 'var(--color-text-secondary)' }}>
                                    My Backgrounds
                                </h4>
                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', 
                                    gap: '10px',
                                    maxHeight: '200px',
                                    overflowY: 'auto'
                                }}>
                                    {backgroundAssets.map(asset => {
                                        const baseURL = client.defaults.baseURL || 'http://localhost:3001';
                                        let assetUrl = asset.url;
                                        if (assetUrl && !assetUrl.startsWith('http')) {
                                            assetUrl = `${baseURL}${assetUrl}`;
                                        }
                                        
                                        return (
                                            <div
                                                key={asset.id}
                                                onClick={() => handleSelectAsset(asset)}
                                                style={{
                                                    width: '100%',
                                                    aspectRatio: '1',
                                                    backgroundImage: `url(${assetUrl})`,
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    borderRadius: '8px',
                                                    border: currentAssetId === asset.id ? '2px solid var(--color-accent-primary)' : '1px solid rgba(255,255,255,0.1)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    opacity: currentAssetId === asset.id ? 1 : 0.8
                                                }}
                                                title={asset.originalName}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        )}
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
