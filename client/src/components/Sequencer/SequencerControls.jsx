import React, { useState } from 'react';
import { sequencer } from '../../audio/Sequencer';
import styles from './SequencerControls.module.css';

const SequencerControls = () => {
    const [isRecording, setIsRecording] = useState(false);

    const toggleRecord = () => {
        if (isRecording) {
            sequencer.stopRecording();
            setIsRecording(false);
        } else {
            sequencer.startRecording();
            setIsRecording(true);
        }
    };

    const handleClear = () => {
        sequencer.clearSequence();
        alert('Loop Cleared!');
    };

    return (
        <div className={styles.sequencerControls}>
            <button
                className={`${styles.recordBtn} ${isRecording ? styles.recording : ''}`}
                onClick={toggleRecord}
            >
                {isRecording ? 'STOP REC' : 'RECORD'}
            </button>
            <button className={styles.clearBtn} onClick={handleClear}>
                CLEAR
            </button>
        </div>
    );
};

export default SequencerControls;
