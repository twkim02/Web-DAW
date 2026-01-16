import React from 'react';
import useStore from '../../store/useStore';
import { audioEngine } from '../../audio/AudioEngine';

const FXControls = () => {
    const effects = useStore((state) => state.effects);
    const setEffectParams = useStore((state) => state.setEffectParams);

    const handleReverbChange = (param, value) => {
        const newValue = parseFloat(value);
        setEffectParams('reverb', { [param]: newValue });
        audioEngine.setReverbParams({ [param]: newValue });
    };

    const handleDelayChange = (param, value) => {
        const newValue = parseFloat(value);
        setEffectParams('delay', { [param]: newValue });
        audioEngine.setDelayParams({ [param]: newValue });
    };

    const containerStyle = {
        background: '#222',
        padding: '10px',
        borderRadius: '8px',
        color: '#fff',
        display: 'flex',
        gap: '20px',
        alignItems: 'center',
        marginTop: '10px',
        fontSize: '0.8rem'
    };

    const sectionStyle = {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px'
    };

    const sliderRowStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    };

    return (
        <div style={containerStyle}>
            <div style={{ fontWeight: 'bold', marginRight: '10px', color: '#888' }}>FX</div>

            {/* Reverb Controls */}
            <div style={sectionStyle}>
                <div style={sliderRowStyle}>
                    <label style={{ width: '40px' }}>Rev</label>
                    <input
                        type="range" min="0" max="1" step="0.01"
                        value={effects.reverb.mix}
                        onChange={(e) => handleReverbChange('mix', e.target.value)}
                        title="Reverb Mix"
                    />
                </div>
                <div style={sliderRowStyle}>
                    <label style={{ width: '40px' }}>Dec</label>
                    <input
                        type="range" min="0.5" max="10" step="0.1"
                        value={effects.reverb.decay}
                        onChange={(e) => handleReverbChange('decay', e.target.value)}
                        title="Reverb Decay"
                    />
                </div>
            </div>

            <div style={{ width: '1px', background: '#444', height: '40px' }}></div>

            {/* Delay Controls */}
            <div style={sectionStyle}>
                <div style={sliderRowStyle}>
                    <label style={{ width: '40px' }}>Dly</label>
                    <input
                        type="range" min="0" max="1" step="0.01"
                        value={effects.delay.mix}
                        onChange={(e) => handleDelayChange('mix', e.target.value)}
                        title="Delay Mix"
                    />
                </div>
                <div style={sliderRowStyle}>
                    <label style={{ width: '40px' }}>Fbk</label>
                    <input
                        type="range" min="0" max="0.9" step="0.01"
                        value={effects.delay.feedback}
                        onChange={(e) => handleDelayChange('feedback', e.target.value)}
                        title="Delay Feedback"
                    />
                </div>
                {/* Time slider could be added, but usually synced to BPM in musical terms (8n, 4n) */}
            </div>
        </div>
    );
};

export default FXControls;
