import React from 'react';
import Pad from './Pad';
import styles from './Grid.module.css';
import useKeyboardMap from '../../hooks/useKeyboardMap';
import useStore from '../../store/useStore';
import { sequencer } from '../../audio/Sequencer'; // Import at top level

import SubButton from './SubButton';

const Grid = () => {
    useKeyboardMap(); // Initialize keyboard listeners

    // Generate 16 pads
    const pads = Array.from({ length: 16 }, (_, i) => i);
    // Default key mappings for visual aid
    const keyLabels = ['A', 'S', 'D', 'F', 'Z', 'X', 'C', 'V', 'G', 'H', 'J', 'K', 'B', 'N', 'M', ','];

    // Top Sub Buttons (e.g., Up, Down, Left, Right)
    const topButtons = ['▲', '▼', '◀', '▶'];

    // Side Sub Buttons
    const sideButtons = ['Vol', 'Pan', 'Rec', 'Clear'];

    // Store access
    const isRecording = useStore((state) => state.isRecording);

    const handleSideClick = (label) => {
        if (label === 'Rec') {
            if (isRecording) {
                sequencer.stopRecording();
            } else {
                sequencer.startRecording();
            }
        } else if (label === 'Clear') {
            sequencer.clearSequence();
            alert('Loop Cleared!');
        } else {
            console.log('Side Button:', label);
        }
    };

    return (
        <div className={styles.wrapper}>
            {/* Top Buttons Row */}
            <div className={styles.topRow}>
                {topButtons.map((label, i) => (
                    <SubButton key={`top-${i}`} label={label} onClick={() => console.log('Top', label)} />
                ))}
            </div>

            <div className={styles.middleRow}>
                {/* Main Grid */}
                <div className={styles.gridContainer}>
                    {pads.map((id) => (
                        <Pad key={id} id={id} label={keyLabels[id]} />
                    ))}
                </div>

                {/* Right Side Buttons */}
                <div className={styles.sideColumn}>
                    {sideButtons.map((label, i) => {
                        // Dynamic styling for Rec button
                        const isRecActive = label === 'Rec' && isRecording;
                        const btnStyle = isRecActive ? { backgroundColor: 'red', borderColor: 'red', color: 'white' } : {};

                        return (
                            <SubButton
                                key={`side-${i}`}
                                label={label}
                                onClick={() => handleSideClick(label)}
                                style={btnStyle}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Grid;
