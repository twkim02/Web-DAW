import React from 'react';
import useStore from '../../store/useStore';
import { audioEngine } from '../../audio/AudioEngine';
import styles from './TransportControls.module.css';

const TransportControls = () => {
    // Basic Controls Only (BPM, Metro, TimeSig) - Play/Rec/Stop handled by Global Shortcuts now
    const bpm = useStore((state) => state.bpm);
    const setBpm = useStore((state) => state.setBpm);

    // Local state for input buffer
    const [localBpm, setLocalBpm] = React.useState(bpm);

    // Sync local state if global bpm changes externally (e.g. preset load)
    React.useEffect(() => {
        setLocalBpm(bpm);
    }, [bpm]);

    const timeSignature = useStore((state) => state.timeSignature);
    const setTimeSignature = useStore((state) => state.setTimeSignature);

    const isMetronomeOn = useStore((state) => state.isMetronomeOn);
    const setIsMetronomeOn = useStore((state) => state.setIsMetronomeOn);

    const toggleMetronome = () => {
        const newState = !isMetronomeOn;
        setIsMetronomeOn(newState);
        audioEngine.setMetronome(newState);
    };

    const handleLocalChange = (e) => {
        setLocalBpm(e.target.value);
    };

    const applyBpm = () => {
        const val = parseInt(localBpm);
        if (!isNaN(val) && val > 0) {
            setBpm(val);
            audioEngine.setBpm(val);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            applyBpm();
            e.currentTarget.blur();
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* METRONOME TOGGLE */}
            <button
                className={`glass-btn ${isMetronomeOn ? 'active-metro' : ''}`}
                onClick={toggleMetronome}
                title="Metronome"
            >
                METRO
            </button>

            {/* BPM CONTROL */}
            <div className="glass-input-group" style={{ display: 'flex', alignItems: 'center' }}>
                <span className="glass-label">BPM</span>
                <input
                    type="number"
                    className="glass-input"
                    min="60"
                    max="200"
                    value={localBpm}
                    onChange={handleLocalChange}
                    onKeyDown={handleKeyDown}
                    style={{ width: '60px' }}
                />
                <button
                    className="glass-btn small-btn"
                    onClick={applyBpm}
                    style={{ marginLeft: '4px', padding: '4px 8px', fontSize: '0.8rem' }}
                    title="Apply BPM"
                >
                    SET
                </button>
            </div>

            {/* TIME SIG */}
            <div className="glass-input-group">
                <span className="glass-label">SIG</span>
                <select
                    className="glass-select"
                    value={`${timeSignature[0]}/${timeSignature[1]}`}
                    onChange={(e) => {
                        const [num, den] = e.target.value.split('/').map(Number);
                        setTimeSignature([num, den]);
                    }}
                >
                    <option value="4/4">4/4</option>
                    <option value="3/4">3/4</option>
                    <option value="5/4">5/4</option>
                    <option value="6/8">6/8</option>
                </select>
            </div>
        </div>
    );
};

export default TransportControls;
