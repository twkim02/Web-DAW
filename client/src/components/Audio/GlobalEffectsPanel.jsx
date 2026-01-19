import React from 'react';
import useStore from '../../store/useStore';
import { audioEngine } from '../../audio/AudioEngine';
import styles from '../Layout/RightSidebar.module.css';

const GlobalEffectsPanel = () => {
    const effects = useStore(state => state.effects);
    const updateGlobalEffectChain = useStore(state => state.updateGlobalEffectChain);
    const setGlobalEffectParam = useStore(state => state.setGlobalEffectParam);

    // Helpers
    const updateChain = (bus, newChain) => {
        updateGlobalEffectChain(bus, newChain);
        audioEngine.updateGlobalChain(bus, newChain);
    };

    const addEffectToBus = (bus, type) => {
        if (!type) return;

        // Default Params (Centralized or copied)
        let defaultParams = {};
        if (type === 'reverb') defaultParams = { decay: 1.5, preDelay: 0.01, mix: 1 };
        if (type === 'delay') defaultParams = { delayTime: 0.25, feedback: 0.5, mix: 1 };
        if (type === 'distortion') defaultParams = { distortion: 0.4, mix: 1 };
        if (type === 'bitcrusher') defaultParams = { bits: 4, mix: 1 };
        if (type === 'eq3') defaultParams = { low: 0, mid: 0, high: 0 };
        if (type === 'compressor') defaultParams = { threshold: -24, ratio: 4, attack: 0.003, release: 0.25 };
        if (type === 'flanger') defaultParams = { delayTime: 0.005, depth: 0.1, feedback: 0.1, mix: 1 };
        if (type === 'chorus') defaultParams = { frequency: 1.5, delayTime: 3.5, depth: 0.7, mix: 1 };
        if (type === 'phaser') defaultParams = { frequency: 0.5, octaves: 3, baseFrequency: 350, mix: 1 };
        if (type === 'pitchshift') defaultParams = { pitch: 0, mix: 1 };
        if (type === 'tremolo') defaultParams = { frequency: 9, depth: 0.75, mix: 1 };
        if (type === 'autowah') defaultParams = { baseFrequency: 100, octaves: 6, sensitivity: 0, mix: 1 };

        const newEffect = {
            name: type.charAt(0).toUpperCase() + type.slice(1),
            type: type,
            params: defaultParams
        };

        const currentChain = effects[bus] || [];
        const newChain = [...currentChain, newEffect];
        updateChain(bus, newChain);
    };

    const removeEffectFromBus = (bus, index) => {
        const currentChain = effects[bus] || [];
        const newChain = [...currentChain];
        newChain.splice(index, 1);
        updateChain(bus, newChain);
    };

    const updateEffectParam = (bus, index, param, value) => {
        const currentChain = effects[bus] || [];
        // Deep copy needed for store structure update
        const chain = JSON.parse(JSON.stringify(currentChain));
        if (!chain[index]) return;

        chain[index].params[param] = parseFloat(value);

        // Optimistic UI update via store
        updateGlobalEffectChain(bus, chain);

        // Live Audio update (Param only)
        audioEngine.updateGlobalEffectParam(bus, index, { [param]: parseFloat(value) });
    };

    // Render Slider (Matching PadSettingsPanel style)
    const renderSlider = (bus, index, effectData, paramKey, min, max, step) => {
        return (
            <div className={styles.controlRow} key={paramKey}>
                <span className={styles.paramLabel}>{paramKey}</span>
                <input
                    type="range"
                    min={min} max={max} step={step}
                    value={effectData.params[paramKey] !== undefined ? effectData.params[paramKey] : 0}
                    onChange={(e) => updateEffectParam(bus, index, paramKey, e.target.value)}
                    className={styles.slider}
                />
                <span className={styles.valueDisplay}>{effectData.params[paramKey]}</span>
            </div>
        );
    };

    const renderChain = (bus, label, color) => {
        const chain = effects[bus] || [];

        return (
            <div className={styles.section} style={{ marginBottom: '30px' }}>
                <div className={styles.sidebarTitle} style={{ display: 'flex', justifyContent: 'space-between', border: 'none', marginBottom: '10px' }}>
                    <span>{label}</span>
                    <span style={{ color: color, fontSize: '0.9rem' }}>{chain.length} Active</span>
                </div>

                {chain.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#666', border: '1px dashed #444', borderRadius: '8px', fontSize: '0.9rem' }}>
                        No effects active. <br /> Add one below!
                    </div>
                )}

                {chain.map((eff, index) => (
                    <div key={index} className={styles.fxGroup}>
                        <div className={styles.fxLabel}>
                            <span style={{ color: color, fontWeight: 'bold' }}> {eff.name}</span>
                            <button
                                onClick={() => removeEffectFromBus(bus, index)}
                                className={styles.delBtn}
                            >
                                REMOVE
                            </button>
                        </div>

                        {/* Controls */}
                        {eff.type === 'reverb' && (
                            <>
                                {renderSlider(bus, index, eff, 'decay', 0.1, 10, 0.1)}
                                {renderSlider(bus, index, eff, 'preDelay', 0, 0.5, 0.01)}
                                {renderSlider(bus, index, eff, 'mix', 0, 1, 0.01)}
                            </>
                        )}
                        {eff.type === 'delay' && (
                            <>
                                {renderSlider(bus, index, eff, 'delayTime', 0, 1, 0.01)}
                                {renderSlider(bus, index, eff, 'feedback', 0, 0.95, 0.01)}
                                {renderSlider(bus, index, eff, 'mix', 0, 1, 0.01)}
                            </>
                        )}
                        {eff.type === 'distortion' && renderSlider(bus, index, eff, 'distortion', 0, 1, 0.01)}
                        {eff.type === 'bitcrusher' && renderSlider(bus, index, eff, 'bits', 1, 16, 1)}
                        {eff.type === 'eq3' && (
                            <>
                                {renderSlider(bus, index, eff, 'low', -20, 10, 0.5)}
                                {renderSlider(bus, index, eff, 'mid', -20, 10, 0.5)}
                                {renderSlider(bus, index, eff, 'high', -20, 10, 0.5)}
                            </>
                        )}
                        {/* Unified Common Controls */}
                        {['flanger', 'chorus', 'phaser', 'tremolo'].includes(eff.type) && (
                            <>
                                {eff.type === 'phaser' && renderSlider(bus, index, eff, 'baseFrequency', 50, 1000, 10)}
                                {renderSlider(bus, index, eff, 'frequency', 0, 20, 0.1)}
                                {renderSlider(bus, index, eff, 'depth', 0, 1, 0.01)}
                                {eff.type !== 'tremolo' && renderSlider(bus, index, eff, 'delayTime', 0, 1, 0.01)}
                                {/* Note: delayTime might not apply to all, but logic handles undefined */}
                                {renderSlider(bus, index, eff, 'mix', 0, 1, 0.01)}
                            </>
                        )}
                        {eff.type === 'pitchshift' && renderSlider(bus, index, eff, 'pitch', -12, 12, 1)}
                        {eff.type === 'autowah' && (
                            <>
                                {renderSlider(bus, index, eff, 'baseFrequency', 50, 1000, 10)}
                                {renderSlider(bus, index, eff, 'sensitivity', -40, 0, 1)}
                                {renderSlider(bus, index, eff, 'mix', 0, 1, 0.01)}
                            </>
                        )}

                    </div>
                ))}

                <select
                    onChange={(e) => {
                        addEffectToBus(bus, e.target.value);
                        e.target.value = "";
                    }}
                    className={styles.glassSelect}
                    style={{ marginTop: '10px' }}
                >
                    <option value="">+ ADD EFFECT TO {label}</option>
                    <option value="reverb">Reverb</option>
                    <option value="delay">Delay</option>
                    <option value="eq3">EQ 3-Band</option>
                    <option value="distortion">Distortion</option>
                    <option value="bitcrusher">BitCrusher</option>
                    <option value="chorus">Chorus</option>
                    <option value="phaser">Phaser</option>
                    <option value="flanger">Flanger</option>
                    <option value="tremolo">Tremolo</option>
                    <option value="pitchshift">Pitch Shift</option>
                    <option value="autowah">AutoWah</option>
                </select>
            </div>
        );
    };

    return (
        <div className={styles.container} style={{ paddingBottom: '100px' }}>
            {/* Header matching PadSettings Header style */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', marginBottom: '20px' }}>
                <span style={{ fontWeight: '700', color: '#fff', fontSize: '1.1rem', letterSpacing: '1px' }}>
                    GLOBAL <span style={{ color: '#00ffcc', fontSize: '1em' }}>FX CHAINS</span>
                </span>
                <button
                    onClick={() => {
                        useStore.getState().setRightSidebarView(null);
                        useStore.getState().setIsRightSidebarOpen(false);
                    }}
                    style={{ background: 'transparent', border: 'none', color: '#666', cursor: 'pointer', fontSize: '1.2rem', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.target.style.color = '#fff'}
                    onMouseLeave={e => e.target.style.color = '#666'}
                >
                    ✕
                </button>
            </div>

            {renderChain('sendA', 'SEND A (REVERB BUS)', '#00ffcc')}
            {/* Divider not needed if we use spacing */}
            {renderChain('sendB', 'SEND B (DELAY BUS)', '#ffaa00')}

            <div className={styles.infoBox} style={{ marginTop: '20px' }}>
                Effects are processed in series (Top to Bottom).
            </div>
        </div>
    );
};

export default GlobalEffectsPanel;
