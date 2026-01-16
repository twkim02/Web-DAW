import React, { useEffect } from 'react';
import useStore from '../../store/useStore';
import { audioEngine } from '../../audio/AudioEngine';
import styles from './TransportControls.module.css';

const TransportControls = () => {
    const isPlaying = useStore((state) => state.isPlaying);
    const setIsPlaying = useStore((state) => state.setIsPlaying);
    const bpm = useStore((state) => state.bpm);
    const setBpm = useStore((state) => state.setBpm);

    const isMetronomeOn = useStore((state) => state.isMetronomeOn);
    const setIsMetronomeOn = useStore((state) => state.setIsMetronomeOn);

    const togglePlay = () => {
        const newState = audioEngine.toggleTransport();
        setIsPlaying(newState === 'started');
    };

    const toggleMetronome = () => {
        const newState = !isMetronomeOn;
        setIsMetronomeOn(newState);
        audioEngine.setMetronome(newState);
    };

    const handleStop = () => {
        audioEngine.stopTransport();
        setIsPlaying(false);
    };

    const handleBpmChange = (e) => {
        const newBpm = parseInt(e.target.value);
        setBpm(newBpm);
        audioEngine.setBpm(newBpm);
    };

    return (
        <div className={styles.transportContainer}>
            <div className={styles.controls}>
                <button
                    className={`${styles.playBtn} ${isPlaying ? styles.active : ''}`}
                    onClick={togglePlay}
                >
                    {isPlaying ? 'PAUSE' : 'PLAY'}
                </button>
                <button className={styles.stopBtn} onClick={handleStop}>
                    STOP
                </button>
                <button
                    className={`${styles.playBtn} ${isMetronomeOn ? styles.active : ''}`}
                    style={{ fontSize: '0.8rem', width: '60px' }}
                    onClick={toggleMetronome}
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
        </div>
    );
};

export default TransportControls;
