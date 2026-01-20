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
        <div className={styles.transportContainer}>
            <div className={styles.controls}>
                {/* METRONOME TOGGLE */}
                <button
                    className={`${styles.playBtn} ${isMetronomeOn ? styles.active : ''}`}
                    style={{ fontSize: '0.8rem', width: '60px', borderRadius: 'var(--radius-sm)' }}
                    onClick={toggleMetronome}
                    title="Metronome"
                >
                    METRO
                </button>
            </div>

            <div className={styles.bpmControl}>
                <label>BPM: {bpm}</label>
                <input
                    type="range"
                    min="60"
                    max="200"
                    value={bpm}
                    onChange={handleBpmChange}
                />
            </div>

            <div className={styles.bpmControl} style={{ marginLeft: '10px' }}>
                <label style={{ fontSize: '0.7rem', whiteSpace: 'nowrap' }}>TIME SIG</label>
                <select
                    value={`${timeSignature[0]}/${timeSignature[1]}`}
                    onChange={(e) => {
                        const [num, den] = e.target.value.split('/').map(Number);
                        setTimeSignature([num, den]);
                    }}
                    style={{
                        background: '#333',
                        color: 'white',
                        border: '1px solid #555',
                        borderRadius: '4px',
                        padding: '1px 3px',
                        fontSize: '0.75rem',
                        marginLeft: '4px',
                        height: '24px'
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
