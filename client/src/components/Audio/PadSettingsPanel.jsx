import React, { useEffect, useState } from 'react';
import useStore from '../../store/useStore';
import styles from '../Layout/RightSidebar.module.css'; // Reusing sidebar styles
import ColorThief from 'colorthief';
import { uploadGraphicAsset } from '../../api/graphicAssets';

const PadSettingsPanel = () => {
    const editingPadId = useStore(state => state.editingPadId);
    const padMappings = useStore(state => state.padMappings);
    const updatePadMapping = useStore(state => state.updatePadMapping);
    const setEditingPadId = useStore(state => state.setEditingPadId);

    // Local state for smoother inputs
    const [name, setName] = useState('');
    const [color, setColor] = useState('#00ffcc');
    const [mode, setMode] = useState('one-shot');
    const [image, setImage] = useState(null);

    const mapping = padMappings[editingPadId];

    useEffect(() => {
        if (mapping) {
            setName(mapping.name || mapping.originalName || '');
            setColor(mapping.color || '#00ffcc');
            setMode(mapping.mode || 'one-shot');
            setImage(mapping.image || null);
        }
    }, [mapping, editingPadId]);

    if (editingPadId === null || !mapping) {
        if (editingPadId === null || !mapping) {
            return null; // Don't show "No Pad Selected" message
        }
    }

    const handleSave = (updates) => {
        updatePadMapping(editingPadId, updates);
    };

    const handleColorChange = (e) => {
        const newColor = e.target.value;
        setColor(newColor);
        handleSave({ color: newColor });
    };

    const handleModeChange = (newMode) => {
        setMode(newMode);
        handleSave({ mode: newMode });
    };

    const handleNameChange = (e) => {
        const newName = e.target.value;
        setName(newName);
        // Debounce or save on blur usually better, but for now instant update for "Real-time" feel
        handleSave({ name: newName });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Show preview immediately
        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target.result;
            setImage(dataUrl);

            // Extract Color
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.src = dataUrl;
            img.onload = async () => {
                try {
                    const colorThief = new ColorThief();
                    const rgb = colorThief.getColor(img);
                    const hex = '#' + rgb.map(x => {
                        const hex = x.toString(16);
                        return hex.length === 1 ? '0' + hex : hex;
                    }).join('');

                    setColor(hex);

                    // Upload to server and get GraphicAsset
                    try {
                        const result = await uploadGraphicAsset(file, 'pad', false);
                        if (result && result.asset) {
                            const graphicAsset = result.asset;
                            // Get the URL from the asset
                            const imageUrl = graphicAsset.url || dataUrl;
                            handleSave({ 
                                image: imageUrl, 
                                color: hex,
                                graphicAssetId: graphicAsset.id 
                            });
                        } else {
                            // Fallback to dataUrl if upload fails
                            handleSave({ image: dataUrl, color: hex });
                        }
                    } catch (uploadErr) {
                        console.error('Failed to upload pad image:', uploadErr);
                        // Fallback to dataUrl if upload fails
                        handleSave({ image: dataUrl, color: hex });
                    }
                } catch (err) {
                    console.error('Color Extraction Failed:', err);
                    // Try to upload anyway
                    try {
                        const result = await uploadGraphicAsset(file, 'pad', false);
                        if (result && result.asset) {
                            const graphicAsset = result.asset;
                            const imageUrl = graphicAsset.url || dataUrl;
                            handleSave({ 
                                image: imageUrl,
                                graphicAssetId: graphicAsset.id 
                            });
                        } else {
                            handleSave({ image: dataUrl });
                        }
                    } catch (uploadErr) {
                        console.error('Failed to upload pad image:', uploadErr);
                        handleSave({ image: dataUrl });
                    }
                }
            };
        };
        reader.readAsDataURL(file);
    };

    const clearImage = () => {
        setImage(null);
        handleSave({ image: null, graphicAssetId: null });
    };

    // --- FX CHAIN HELPERS ---

    // Preview Sound (Trigger Pad)
    const previewSound = () => {
        import('../../audio/InstrumentManager').then(({ instrumentManager }) => {
            instrumentManager.startNote(editingPadId, mapping.note || 'C4');
            setTimeout(() => instrumentManager.stopNote(editingPadId, mapping.note || 'C4'), 500); // Short preview
        });
    };

    // Helper to update a specific effect in the chain
    const updateEffectInChain = (index, newEffectData) => {
        const currentEffects = mapping.effects || (mapping.effect ? [mapping.effect] : []); // Backwards compat
        const newEffects = [...currentEffects];
        newEffects[index] = newEffectData;

        updatePadMapping(editingPadId, { effects: newEffects });

        // Note: AudioController Syncs this to Engine
    };

    const removeEffectFromChain = (index) => {
        const currentEffects = mapping.effects || (mapping.effect ? [mapping.effect] : []);
        const newEffects = [...currentEffects];
        newEffects.splice(index, 1);
        updatePadMapping(editingPadId, { effects: newEffects });
        previewSound();
    };

    const addEffectToChain = (type) => {
        if (!type) return;

        // Default Params
        let defaultParams = {};
        if (type === 'distortion') defaultParams = { distortion: 0.4 };
        if (type === 'bitcrusher') defaultParams = { bits: 4 };
        if (type === 'reverb') defaultParams = { decay: 1.5, preDelay: 0.01, mix: 0.5 };
        if (type === 'eq3') defaultParams = { low: 0, mid: 0, high: 0 };
        if (type === 'panner') defaultParams = { pan: 0 };
        if (type === 'compressor') defaultParams = { threshold: -24, ratio: 4, attack: 0.003, release: 0.25 };
        if (type === 'flanger') defaultParams = { delayTime: 0.005, depth: 0.1, feedback: 0.1 };
        if (type === 'chorus') defaultParams = { frequency: 1.5, delayTime: 3.5, depth: 0.7 };
        if (type === 'phaser') defaultParams = { frequency: 0.5, octaves: 3, baseFrequency: 350 };
        if (type === 'pitchshift') defaultParams = { pitch: 0 };
        if (type === 'tremolo') defaultParams = { frequency: 9, depth: 0.75 };
        if (type === 'autowah') defaultParams = { baseFrequency: 100, octaves: 6, sensitivity: 0 };

        const newEffect = {
            name: type.charAt(0).toUpperCase() + type.slice(1),
            type: type,
            params: defaultParams
        };

        const currentEffects = mapping.effects || (mapping.effect ? [mapping.effect] : []);
        const newEffects = [...currentEffects, newEffect];

        updatePadMapping(editingPadId, { effects: newEffects });
        previewSound();
    };


    // Render Slider for a specific effect index
    const renderChainSlider = (effectIndex, effectData, paramKey, min, max, step) => {
        return (
            <div className={styles.controlRow} key={paramKey}>
                <span className={styles.paramLabel}>{paramKey}</span>
                <input
                    type="range"
                    min={min} max={max} step={step}
                    value={effectData.params[paramKey]}
                    onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        const updatedEffect = {
                            ...effectData,
                            params: { ...effectData.params, [paramKey]: val }
                        };
                        updateEffectInChain(effectIndex, updatedEffect);
                    }}
                    onMouseUp={previewSound} // Trigger sound on release
                    onTouchEnd={previewSound}
                    className={styles.slider}
                />
                <span className={styles.valueDisplay}>{effectData.params[paramKey]}</span>
            </div>
        );
    };

    // Normalize effects to array for rendering
    const effectsList = mapping.effects || (mapping.effect ? [mapping.effect] : []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '50px' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
                <span style={{ fontWeight: '700', color: '#fff', fontSize: '1.1rem', letterSpacing: '1px' }}>
                    PAD {editingPadId} <span style={{ color: '#00ffcc', fontSize: '0.8em' }}>SETTINGS</span>
                </span>
                <button
                    onClick={() => {
                        setEditingPadId(null);
                        useStore.getState().setIsRightSidebarOpen(false); // Close sidebar
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', fontSize: '1.2rem', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.target.style.color = '#fff'}
                    onMouseLeave={e => e.target.style.color = '#666'}
                >
                    ✕
                </button>
            </div>

            {/* Basic Info */}
            <div className={styles.fxGroup}>
                <div className={styles.fxLabel} style={{ marginBottom: '16px' }}>
                    <span>GENERAL INFO</span>
                    {/* Icon Removed as requested */}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* Name */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span className={styles.paramLabel} style={{ width: 'auto' }}>NAME</span>
                        <input
                            type="text"
                            value={name}
                            onChange={handleNameChange}
                            className={styles.glassInput}
                            placeholder="Pad Name..."
                        />
                    </div>

                    {/* COVER IMAGE */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span className={styles.paramLabel} style={{ width: 'auto' }}>COVER IMAGE</span>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                            {image ? (
                                <div style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #444', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                                    <img src={image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <button
                                        onClick={clearImage}
                                        style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: '12px' }}
                                    >✕</button>
                                </div>
                            ) : (
                                <div style={{ width: '100px', height: '100px', borderRadius: '6px', border: '1px dashed #444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontSize: '0.8rem', background: 'rgba(0,0,0,0.1)' }}>
                                    No Image
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label
                                    className={styles.glassBtn}
                                    style={{
                                        fontSize: '0.75rem',
                                        padding: '6px 12px',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        display: 'inline-block',
                                        background: '#333',
                                        border: '1px solid #555',
                                        color: '#ddd',
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    Upload / Auto-Color
                                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                                </label>
                                <div style={{ fontSize: '0.65rem', color: '#666', lineHeight: '1.2' }}>
                                    * Auto-extracts color tag
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Color Palette */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <span className={styles.paramLabel} style={{ width: 'auto' }}>COLOR TAG</span>
                        <div className={styles.colorGrid}>
                            {[
                                '#FF0055', '#FF3300', '#FFAA00', '#FFFF00', '#CCFF00',
                                '#00FF66', '#00FFCC', '#0099FF', '#3300FF', '#9900FF',
                                '#FF00CC', '#FFFFFF', '#888888', '#222222'
                            ].map((c) => (
                                <div
                                    key={c}
                                    className={`${styles.colorSwatch} ${color === c ? styles.active : ''}`}
                                    style={{ backgroundColor: c, color: c }} // color prop for shadow matching
                                    onClick={() => {
                                        setColor(c);
                                        handleSave({ color: c });
                                    }}
                                />
                            ))}
                            {/* Custom Color Input (Shows Active Color) */}
                            <label
                                className={`${styles.colorSwatch} ${!['#FF0055', '#FF3300', '#FFAA00', '#FFFF00', '#CCFF00', '#00FF66', '#00FFCC', '#0099FF', '#3300FF', '#9900FF', '#FF00CC', '#FFFFFF', '#888888', '#222222'].includes(color) ? styles.active : ''}`}
                                style={{ backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid #666', overflow: 'hidden' }}
                                title="Custom / Extracted Color"
                            >
                                {/* Plus icon only if default/dark? Or just rely on visual? Let's hide text to clear view of color */}
                                <input
                                    type="color"
                                    value={color}
                                    onChange={handleColorChange}
                                    style={{ opacity: 0, position: 'absolute', width: '100%', height: '100%', cursor: 'pointer' }}
                                />
                            </label>
                        </div>
                        {/* Show Active Hex Code */}
                        <div style={{ fontSize: '0.7rem', color: '#888', textAlign: 'right', marginTop: '4px' }}>
                            Active: <span style={{ color: color, fontWeight: 'bold' }}>{color}</span>
                        </div>
                    </div>
                    {/* Visual Effect Selector */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <span className={styles.paramLabel} style={{ width: 'auto' }}>LIGHT FX</span>
                        <div className={styles.modeGroup}>
                            {['none', 'pulse', 'flash', 'ripple', 'cross'].map((fx) => (
                                <button
                                    key={fx}
                                    className={`${styles.modeBtn} ${(mapping?.visualEffect || 'none') === fx ? styles.active : ''}`}
                                    onClick={() => handleSave({ visualEffect: fx })}
                                    style={{ flex: 1, textTransform: 'uppercase', fontSize: '0.65rem' }}
                                >
                                    {fx}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Mode */}
            <div>
                <div className={styles.sidebarTitle}>PLAYBACK MODE</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {['one-shot', 'gate', 'loop'].map(m => (
                        <button
                            key={m}
                            onClick={() => handleModeChange(m)}
                            className={`${styles.modeBtn} ${mode === m ? styles.active : ''}`}
                        >
                            {m.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* FX CHAIN SECTION */}
            <div>
                <div className={styles.sidebarTitle} style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', border: 'none' }}>
                    <span>FX CHAIN</span>
                    <span style={{ color: '#00ffcc' }}>{effectsList.length} Active</span>
                </div>

                {effectsList.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#666', border: '1px dashed #444', borderRadius: '8px', fontSize: '0.9rem' }}>
                        No effects applied. <br /> Add one below!
                    </div>
                )}

                {effectsList.map((eff, index) => (
                    <div key={index} className={styles.fxGroup}>
                        <div className={styles.fxLabel}>
                            <span style={{ color: '#00ffcc', fontWeight: 'bold' }}> {eff.name}</span>
                            <button
                                onClick={() => removeEffectFromChain(index)}
                                className={styles.delBtn}
                            >
                                REMOVE
                            </button>
                        </div>

                        {/* Effect Controls */}
                        {eff.type === 'reverb' && (
                            <>
                                {renderChainSlider(index, eff, 'decay', 0.1, 10, 0.1)}
                                {renderChainSlider(index, eff, 'preDelay', 0, 0.1, 0.001)}
                                {renderChainSlider(index, eff, 'mix', 0, 1, 0.01)}
                            </>
                        )}
                        {eff.type === 'eq3' && (
                            <>
                                {renderChainSlider(index, eff, 'low', -20, 10, 0.5)}
                                {renderChainSlider(index, eff, 'mid', -20, 10, 0.5)}
                                {renderChainSlider(index, eff, 'high', -20, 10, 0.5)}
                            </>
                        )}
                        {eff.type === 'panner' && renderChainSlider(index, eff, 'pan', -1, 1, 0.05)}
                        {eff.type === 'distortion' && renderChainSlider(index, eff, 'distortion', 0, 1, 0.01)}
                        {eff.type === 'bitcrusher' && renderChainSlider(index, eff, 'bits', 1, 16, 1)}

                        {eff.type === 'compressor' && (
                            <>
                                {renderChainSlider(index, eff, 'threshold', -60, 0, 1)}
                                {renderChainSlider(index, eff, 'ratio', 1, 20, 0.5)}
                                {renderChainSlider(index, eff, 'attack', 0, 1, 0.01)}
                                {renderChainSlider(index, eff, 'release', 0, 1, 0.01)}
                            </>
                        )}
                        {eff.type === 'flanger' && (
                            <>
                                {renderChainSlider(index, eff, 'delayTime', 0, 0.02, 0.0001)}
                                {renderChainSlider(index, eff, 'depth', 0, 1, 0.01)}
                                {renderChainSlider(index, eff, 'feedback', 0, 1, 0.01)}
                            </>
                        )}
                        {eff.type === 'chorus' && (
                            <>
                                {renderChainSlider(index, eff, 'frequency', 0, 10, 0.1)}
                                {renderChainSlider(index, eff, 'depth', 0, 1, 0.01)}
                                {renderChainSlider(index, eff, 'delayTime', 2, 20, 0.5)}
                            </>
                        )}
                        {eff.type === 'phaser' && (
                            <>
                                {renderChainSlider(index, eff, 'frequency', 0, 20, 0.1)}
                                {renderChainSlider(index, eff, 'octaves', 1, 8, 1)}
                                {renderChainSlider(index, eff, 'baseFrequency', 100, 1000, 10)}
                            </>
                        )}
                        {eff.type === 'pitchshift' && renderChainSlider(index, eff, 'pitch', -24, 24, 1)}
                        {eff.type === 'tremolo' && (
                            <>
                                {renderChainSlider(index, eff, 'frequency', 0, 20, 0.1)}
                                {renderChainSlider(index, eff, 'depth', 0, 1, 0.01)}
                            </>
                        )}
                        {eff.type === 'autowah' && (
                            <>
                                {renderChainSlider(index, eff, 'baseFrequency', 50, 500, 10)}
                                {renderChainSlider(index, eff, 'sensitivity', -40, 0, 1)}
                            </>
                        )}
                    </div>
                ))}
            </div>

            {/* Add Effect Button / Selector */}
            <div style={{ marginTop: '10px' }}>
                <select
                    onChange={(e) => {
                        addEffectToChain(e.target.value);
                        e.target.value = ""; // Reset selector
                    }}
                    className={styles.glassSelect}
                >
                    <option value="">+ ADD EFFECT TO CHAIN</option>
                    <option value="reverb">Reverb</option>
                    <option value="eq3">Equalizer (3-Band)</option>
                    <option value="compressor">Compressor</option>
                    <option value="distortion">Distortion</option>
                    <option value="bitcrusher">BitCrusher</option>
                    <option value="flanger">Flanger</option>
                    <option value="chorus">Chorus</option>
                    <option value="phaser">Phaser</option>
                    <option value="panner">Panner</option>
                    <option value="pitchshift">Pitch Shift</option>
                    <option value="tremolo">Tremolo</option>
                    <option value="autowah">AutoWah</option>
                </select>
            </div>

        </div>
    );
};

export default PadSettingsPanel;
