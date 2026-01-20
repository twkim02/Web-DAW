import React from 'react';
import useStore from '../../store/useStore';
import { audioEngine } from '../../audio/AudioEngine';
import styles from './TransportControls.module.css';

const TransportControls = () => {
    // Basic Controls Only (BPM, Metro, TimeSig) - Play/Rec/Stop handled by Global Shortcuts now
    const bpm = useStore((state) => state.bpm);
    const setBpm = useStore((state) => state.setBpm);
    const timeSignature = useStore((state) => state.timeSignature);
    const setTimeSignature = useStore((state) => state.setTimeSignature);

    const isMetronomeOn = useStore((state) => state.isMetronomeOn);
    const setIsMetronomeOn = useStore((state) => state.setIsMetronomeOn);

    const toggleMetronome = () => {
        const newState = !isMetronomeOn;
        setIsMetronomeOn(newState);
        audioEngine.setMetronome(newState);
    };

    const handleBpmChange = (e) => {
        const newBpm = parseInt(e.target.value);
        setBpm(newBpm);
        audioEngine.setBpm(newBpm);
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
            <div className="glass-input-group">
                <span className="glass-label">BPM</span>
                <input
                    type="number"
                    className="glass-input"
                    min="60"
                    max="200"
                    value={bpm}
                    onChange={handleBpmChange}
                />
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
