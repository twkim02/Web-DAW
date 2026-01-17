import React from 'react';
import Pad from './Pad';
import styles from './Grid.module.css';
import useKeyboardMap from '../../hooks/useKeyboardMap';
import useStore from '../../store/useStore';
import { sequencer } from '../../audio/Sequencer'; // Import at top level

import SubButton from './SubButton';

const Grid = () => {
    useKeyboardMap(); // Initialize keyboard listeners

    // Generate 64 pads
    const pads = Array.from({ length: 64 }, (_, i) => i);
    // Key labels - sparse mapping for now or algorithmic
    // For 8x8, let's just clear labels or mapped ones
    const keyLabels = Array(64).fill('');

    // Top Sub Buttons (8 items for 8 columns) - Menu/Navigation
    const topButtons = ['▲', '▼', '◀', '▶', 'Session', 'Note', 'Custom', 'Mixer'];

    // Side Sub Buttons (8 items for 8 rows) - Scene Launch / Transport
    const sideButtons = ['Vol', 'Pan', 'Snd A', 'Snd B', 'Stop', 'Mute', 'Solo', 'Rec'];

    // Store access
    const isRecording = useStore((state) => state.isRecording);
    const bankCoords = useStore((state) => state.bankCoords);
    const isZoomed = useStore((state) => state.isZoomed);
    const setIsZoomed = useStore((state) => state.setIsZoomed);
    const editingPadId = useStore((state) => state.editingPadId);

    // Zoom Calculation
    // When Zoomed: Scale 2.2 (aggressive). Focus on quadrant.
    // When Overview: Scale 0.9 (fit all). Focus Center.

    const originX = bankCoords.x === 0 ? '25%' : '75%';
    const originY = bankCoords.y === 0 ? '25%' : '75%';

    const zoomStyle = {
        transform: isZoomed ? `scale(2.2)` : `scale(0.9)`,
        transformOrigin: isZoomed ? `${originX} ${originY}` : 'center center',
        transition: 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)', // Snappy spring
        cursor: isZoomed ? 'zoom-out' : 'zoom-in'
    };

    // ESC to Zoom Out
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && editingPadId === null) {
                // Only zoom out if no modal is open
                setIsZoomed(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [editingPadId, setIsZoomed]);

    // Click on Grid to toggle Zoom?
    // Maybe better on specific pads? For now, leave it to logic.

    const handleTopClick = (label) => {
        const { moveBank, bankCoords, setIsZoomed } = useStore.getState();

        switch (label) {
            case '▲': moveBank(0, -1); setIsZoomed(true); break;
            case '▼': moveBank(0, 1); setIsZoomed(true); break;
            case '◀': moveBank(-1, 0); setIsZoomed(true); break;
            case '▶': moveBank(1, 0); setIsZoomed(true); break;
            case 'Session':
                // Reset to 0,0 (Overview)
                useStore.setState({ bankCoords: { x: 0, y: 0 } });
                break;
            default:
                console.log('Top Button:', label);
        }
    };

    const handleSideClick = (label) => {
        switch (label) {
            case 'Rec':
                if (isRecording) {
                    sequencer.stopRecording();
                } else {
                    sequencer.startRecording();
                }
                break;
            case 'Stop':
                sequencer.stop();
                useStore.getState().setIsPlaying(false);
                break;
            case 'Vol':
            case 'Pan':
            case 'Mute':
            case 'Solo':
                alert(`[${label}] - Feature coming soon! (Select a track first)`);
                break;
            default:
                console.log('Side Button:', label);
        }
    };

    return (
        <div className={styles.wrapper} style={zoomStyle}>
            {/* 1. Top Row (Buttons) */}
            <div className={styles.topSection}>
                {topButtons.map((label, i) => (
                    <SubButton key={`top-${i}`} label={label} onClick={() => handleTopClick(label)} />
                ))}
            </div>

            {/* 2. Top Right Corner (Empty/Logo) */}
            <div className={styles.corner}>
                <div style={{ fontSize: '10px', color: '#666' }}>DAW</div>
            </div>

            {/* 3. Main Pad Grid */}
            <div className={styles.gridSection}>
                {/* Neon Bank Border */}
                <div
                    className={`${styles.bankBorder} ${isZoomed ? styles.visible : ''}`}
                    style={{
                        left: bankCoords.x === 0 ? '-2px' : '262px',
                        top: bankCoords.y === 0 ? '-2px' : '262px' // Adjusted for border width
                    }}
                />

                {pads.map((id) => (
                    <Pad key={id} id={id} label={keyLabels[id]} />
                ))}
            </div>

            {/* 4. Side Column (Buttons) */}
            <div className={styles.sideSection}>
                {sideButtons.map((label, i) => {
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
    );
};

export default Grid;
