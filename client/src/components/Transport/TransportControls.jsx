import React, { useEffect } from 'react';
import useStore from '../../store/useStore';
import { audioEngine } from '../../audio/AudioEngine';
import { loopRecorder } from '../../audio/LoopRecorder';
import { useToast } from '../UI/ToastContext';
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

    // Recording Logic
    const { addToast } = useToast();
    const [isRecording, setIsRecording] = React.useState(false);
    const [recordProgress, setRecordProgress] = React.useState(0);

    const handleRecord = () => {
        if (isRecording) {
            loopRecorder.cancel();
            setIsRecording(false);
            setRecordProgress(0);
            addToast('Recording Cancelled', 'info');
            return;
        }

        // Logic:
        // 1. Show "Waiting for next bar..."
        // 2. Start Transport if not running
        // 3. Recorder schedules start at next bar

        if (!isPlaying) {
            togglePlay();
        }

        setIsRecording(true);
        addToast('Waiting for next bar...', 'info', 2000);

        loopRecorder.recordLoop(4, (blob) => {
            setIsRecording(false);
            setRecordProgress(0);
            addToast('Recording Complete! (Drag to Pad)', 'success');

            // Auto-Assign Logic (Simple):
            // In a real scenario, we'd open a modal or drag internal state. 
            // For now, let's just log it or maybe auto-assign to first empty pad?
            // Or better: Just download it?

            // Let's emulate a "File Drop" context or just prompt user?
            // Auto-save logic
            const dateStr = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
            const defaultName = `Loop_${dateStr}`;
            // Optional: Prompt user? or Auto-save? Let's auto-save to be smooth, user can rename later.
            // Actually, a prompt is safer. 
            // const name = window.prompt("Save Loop As:", defaultName); 
            // Better: Use a Toast to ask? No, window.prompt is blocking but simple. 
            // Let's just auto-save for flow, and toast "Saved as...".

            const file = new File([blob], `${defaultName}.webm`, { type: 'audio/webm' });

            // Upload
            import('../../api/upload').then(({ uploadFile }) => {
                uploadFile(file, 'recording').then(() => {
                    showToast(`Loop saved: ${defaultName}`, 'success');
                    useStore.getState().triggerLibraryRefresh();
                }).catch(err => {
                    console.error("Auto-save failed", err);
                    showToast("Failed to save recording", 'error');
                });
            });

        }, (progress) => {
            setRecordProgress(progress);
        });
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
                <button
                    className={`${styles.stopBtn} ${isRecording ? styles.recording : ''}`}
                    onClick={handleRecord}
                    style={{ backgroundColor: isRecording ? '#ff4444' : '#444' }}
                >
                    {isRecording ? 'REC...' : 'REC'}
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
