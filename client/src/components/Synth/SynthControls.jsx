import React from 'react';
import useStore from '../../store/useStore';
import { audioEngine } from '../../audio/AudioEngine';
import styles from './SynthControls.module.css';

const SynthControls = () => {
    const synthParams = useStore((state) => state.synthParams);
    const setSynthParams = useStore((state) => state.setSynthParams);

    const handleOscChange = (e) => {
        const type = e.target.value;
        setSynthParams({ oscillatorType: type });
        audioEngine.updateSynthParams({ oscillatorType: type });
    };

    const handleEnvelopeChange = (param, value) => {
        const newEnvelope = { ...synthParams.envelope, [param]: parseFloat(value) };
        setSynthParams({ envelope: newEnvelope });
        audioEngine.updateSynthParams({ envelope: newEnvelope });
    };

    return (
        <div className={styles.container}>
            <h3>Synthesizer</h3>
            <div className={styles.row}>
                <label>Shape</label>
                <select value={synthParams.oscillatorType} onChange={handleOscChange}>
                    <option value="triangle">Triangle</option>
                    <option value="sine">Sine</option>
                    <option value="square">Square</option>
                    <option value="sawtooth">Sawtooth</option>
                </select>
            </div>

            <div className={styles.sliders}>
                {Object.keys(synthParams.envelope).map((param) => (
                    <div key={param} className={styles.sliderGroup}>
                        <label>{param.charAt(0).toUpperCase()}</label>
                        <input
                            type="range"
                            min={param === 'sustain' ? 0 : 0.01}
                            max={param === 'sustain' ? 1 : 2}
                            step="0.01"
                            value={synthParams.envelope[param]}
                            onChange={(e) => handleEnvelopeChange(param, e.target.value)}
                        />
                    </div>
                ))}
            </div>

            <button
                onClick={() => audioEngine.triggerSynth('C4')}
                style={{ marginTop: '15px', width: '100%', padding: '8px', cursor: 'pointer', background: '#00ffcc', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
            >
                Test Note (C4)
            </button>
        </div>
    );
};

export default SynthControls;
