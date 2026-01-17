import React from 'react';
import Pad from './Pad'; // Keep Pad for Session Mode
import styles from './Grid.module.css';
import useKeyboardMap from '../../hooks/useKeyboardMap';
import useStore from '../../store/useStore';
import { sequencer } from '../../audio/Sequencer';
import SubButton from './SubButton';
import { THEMES } from '../../constants/themes';

// ... (FaderColumn component kept same) ...

// Fader Column Component
const FaderColumn = ({ index, type, value, onChange, color }) => {
    // value 0-1. display as 8 segments.
    const segments = 8;
    const filled = Math.round(value * segments);

    const handleClick = (segmentIndex) => {
        // segmentIndex 0 (bottom) to 7 (top)
        const newValue = (segmentIndex + 1) / segments;
        onChange(newValue);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: '2px', height: '100%', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            {Array.from({ length: segments }).map((_, i) => (
                <div
                    key={i}
                    onClick={() => handleClick(i)}
                    style={{
                        width: '80%',
                        height: '10%',
                        backgroundColor: i < filled ? color : 'rgba(255,255,255,0.1)',
                        cursor: 'pointer',
                        borderRadius: '2px',
                        transition: 'background 0.1s'
                    }}
                />
            ))}
        </div>
    );
};

const Grid = () => {
    useKeyboardMap();

    // Store State
    const viewMode = useStore((state) => state.viewMode);
    const setViewMode = useStore((state) => state.setViewMode);
    const bankCoords = useStore((state) => state.bankCoords);
    const moveBank = useStore((state) => state.moveBank);
    const isZoomed = useStore((state) => state.isZoomed);
    const setIsZoomed = useStore((state) => state.setIsZoomed);
    const isRecording = useStore((state) => state.isRecording);

    // Theme
    const currentThemeId = useStore((state) => state.currentThemeId);
    const currentTheme = THEMES.find(t => t.id === currentThemeId) || THEMES[0];

    const gridStyle = {
        '--theme-primary': currentTheme.primaryColor,
        '--theme-secondary': currentTheme.secondaryColor,
        '--theme-grid': currentTheme.gridColor,
        '--theme-text': currentTheme.textColor,
        color: currentTheme.textColor // Apply text color to grid container
    };
    const isPlaying = useStore((state) => state.isPlaying);
    const mixerLevels = useStore((state) => state.mixerLevels);
    const setMixerLevel = useStore((state) => state.setMixerLevel);
    const trackStates = useStore((state) => state.trackStates);
    const toggleTrackState = useStore((state) => state.toggleTrackState);
    const editingPadId = useStore((state) => state.editingPadId); // Restored missing selector

    // --- Button Logic ---
    const topButtons = ['▲', '▼', '◀', '▶', 'Session', 'Note', 'Custom', 'Mixer'];

    // Side Buttons depend on View Mode
    // If in Mixer Selection Mode, show Controls. Otherwise, show Scene Launch?
    // User requested "Mixer" buttons.
    // Let's use the 'Mixer' top button to TOGGLE side menu? 
    // Or let's make the Side Buttons CONSTANTLY be the Mode Switchers (Vol/Pan/etc) IF we are in a Mixer View?
    // And if we are in Session, they are Scene Launchers.

    const isSession = viewMode === 'SESSION';
    const isNote = viewMode === 'NOTE';

    // Derived state for side buttons
    // Standard Reference: Right side is Scene Launch 1-8 in Session Mode.
    // Mixer Mode: Right side is Vol, Pan, Snd A, Snd B, Stop, Mute, Solo, Rec Arm.
    const sideButtons = (isSession || isNote)
        ? Array(8).fill('►')
        : ['Vol', 'Pan', 'Snd A', 'Snd B', 'Stop', 'Mute', 'Solo', 'Rec'];

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

    const handleTopClick = (label) => {
        switch (label) {
            case '▲': moveBank(0, -1); setIsZoomed(true); break;
            case '▼': moveBank(0, 1); setIsZoomed(true); break;
            case '◀': moveBank(-1, 0); setIsZoomed(true); break;
            case '▶': moveBank(1, 0); setIsZoomed(true); break;
            case 'Session': setViewMode('SESSION'); break;
            case 'Note': setViewMode('NOTE'); break;
            // case 'Custom': setViewMode('CUSTOM'); break; 
            case 'Mixer':
                // Toggle Mixer Selection or Go to Volume?
                setViewMode('MIXER_SELECTION');
                break;
            default: console.log('Top:', label);
        }
    };

    const handleSideClick = (label, index) => {
        if (label === '►') {
            // Scene Launch
            sequencer.playScene(index);
            return;
        }

        switch (label) {
            case 'Vol': setViewMode('VOLUME'); break;
            case 'Pan': setViewMode('PAN'); break;
            case 'Snd A': setViewMode('SEND_A'); break;
            case 'Snd B': setViewMode('SEND_B'); break;
            case 'Mute': setViewMode('MUTE'); break;
            case 'Solo': setViewMode('SOLO'); break;
            case 'Stop': setViewMode('STOP'); break; // Or Transport Stop?
            case 'Stop': setViewMode('STOP'); break;
            case 'Rec': setViewMode('ARM'); break; // Mixer Rec = Record Arm
            default: console.log('Side:', label);
        }
    };

    // --- Render Content ---
    const renderGridContent = () => {
        if (viewMode === 'SESSION') {
            const pads = Array.from({ length: 64 }, (_, i) => i);
            return (
                <>
                    {/* Neon Bank Border */}
                    <div
                        className={`${styles.bankBorder} ${isZoomed ? styles.visible : ''}`}
                        style={{
                            left: bankCoords.x === 0 ? '-2px' : '262px',
                            top: bankCoords.y === 0 ? '-2px' : '262px' // Adjusted for border width
                        }}
                    />
                    {pads.map((id) => <Pad key={id} id={id} label="" />)}
                </>
            );
        }

        if (viewMode === 'NOTE') {
            // Placeholder for Note Mode (just pads for now, maybe diff colors later)
            const pads = Array.from({ length: 64 }, (_, i) => i);
            return pads.map((id) => <Pad key={id} id={id} label="♪" />);
        }

        if (['VOLUME', 'PAN', 'SEND_A', 'SEND_B'].includes(viewMode)) {
            // Render 8 Fader Columns
            const typeMap = { 'VOLUME': 'vol', 'PAN': 'pan', 'SEND_A': 'sendA', 'SEND_B': 'sendB' };
            const type = typeMap[viewMode];
            const data = mixerLevels[type];
            const color = viewMode === 'VOLUME' ? '#00ffcc' : viewMode === 'PAN' ? '#ffaa00' : '#cc00ff';

            return Array(8).fill(null).map((_, i) => (
                <div key={i} className={styles.columnCell} style={{ border: '1px solid #333', padding: '2px' }}>
                    <FaderColumn
                        index={i}
                        type={type}
                        value={data[i]}
                        onChange={(val) => setMixerLevel(type, i, val)}
                        color={color}
                    />
                </div>
            ));
        }

        if (['MUTE', 'SOLO', 'ARM'].includes(viewMode)) {
            // Render Toggle Switches
            const typeMap = { 'MUTE': 'mute', 'SOLO': 'solo', 'ARM': 'arm' };
            const type = typeMap[viewMode];
            const data = trackStates[type] || Array(8).fill(false);

            return Array(64).fill(null).map((_, i) => {
                // Whole column toggles track state
                const col = i % 8;
                const isActive = data[col];
                let color = '#222';

                // Colors based on standard Launchpad / DAW conventions
                if (viewMode === 'MUTE') { color = isActive ? '#ffca00' : '#222'; } // Mute Active (Silent) = Yellow
                if (viewMode === 'SOLO') { color = isActive ? '#00ccff' : '#222'; } // Solo Active = Blue
                if (viewMode === 'ARM') { color = isActive ? '#ff0000' : '#222'; } // Arm Active = Red

                return (
                    <div
                        key={i}
                        onClick={() => toggleTrackState(type, col)}
                        style={{
                            width: '100%', height: '100%',
                            backgroundColor: color,
                            border: '1px solid #444',
                            opacity: isActive ? 1 : 0.3,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                            color: '#fff', fontSize: '10px'
                        }}
                    >
                        {/* Show label on bottom row */}
                        {i >= 56 ? (viewMode === 'MUTE' ? 'M' : viewMode === 'SOLO' ? 'S' : 'R') : ''}
                    </div>
                );
            });
        }

        if (viewMode === 'STOP') {
            // Stop Clip View: Red pads in column. Click to stop track.
            return Array(64).fill(null).map((_, i) => {
                const col = i % 8;
                return (
                    <div
                        key={i}
                        onClick={() => {
                            // Stop Track Logic (Visual for now, Audio Engine needed)
                            console.log(`Stopping Track ${col}`);
                            // sequencer.stopTrack(col); // TODO: implement
                        }}
                        style={{
                            width: '100%', height: '100%',
                            backgroundColor: '#ff4444',
                            border: '1px solid #444',
                            opacity: 0.2, // Dim red when not interacting
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                        onMouseOver={(e) => e.target.style.opacity = 0.8}
                        onMouseOut={(e) => e.target.style.opacity = 0.2}
                    >
                        {i >= 56 ? 'STOP' : ''}
                    </div>
                );
            });
        }

        // Fallback (Mixer Selection Menu or Default)
        return <div style={{ color: 'white', padding: 20, gridColumn: 'span 8' }}>Select a Mode from Side Menu</div>;
    };

    // Zoom Style
    const originX = bankCoords.x === 0 ? '25%' : '75%';
    const originY = bankCoords.y === 0 ? '25%' : '75%';
    const zoomStyle = {
        transform: isZoomed ? `scale(2.2)` : `scale(0.9)`,
        transformOrigin: isZoomed ? `${originX} ${originY}` : 'center center',
        transition: 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)',
        cursor: isZoomed ? 'zoom-out' : 'zoom-in'
    };

    return (
        <div className={`${styles.wrapper} ${isZoomed ? styles.zoomed : ''}`} style={{ ...zoomStyle, ...gridStyle }}>
            {/* 1. Top Row */}
            <div className={styles.topSection}>
                {topButtons.map((label, i) => (
                    <SubButton key={`top-${i}`} label={label} onClick={() => handleTopClick(label)} />
                ))}
            </div>

            {/* 2. Top Right Corner */}
            <div className={styles.corner}>
                {/* Temp Logo */}
                <div style={{
                    width: '100%', height: '100%',
                    backgroundImage: `url('/assets/images/logo.png')`, // Mapping specific path? Or explicit URI?
                    // User uploaded: uploaded_image_1768654310916.png
                    // I should probably copy this to the public folder first? 
                    // Or I can use a placeholder for now as "Temp Logo".
                    // Wait, I cannot use the exact path from the brain to the browser directly usually unless served.
                    // I will create a simple styled div that SAYS "LOGO" as a placeholder OR
                    // I will Assume I should put a generic icon first.
                    // User request: "임시 로고를 추가해" (Add a temp logo).
                    // I'll make a nice text-based logo or use a generic emoji if I can't serve the file immediately.
                    // Lets try to make a styled text logo "WEB DAW".
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: '#111', borderRadius: '4px', border: '1px solid #333'
                }}>
                    <span style={{ color: '#00ffcc', fontWeight: 'bold', fontSize: '10px' }}>WEB</span>
                    <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '10px' }}>DAW</span>
                </div>
            </div>

            {/* 3. Main Grid */}
            <div className={styles.gridSection}>
                {renderGridContent()}
            </div>

            {/* 4. Side Column */}
            <div className={styles.sideSection}>
                {sideButtons.map((label, i) => {
                    // Logic for Active State
                    let isActive = false;
                    let customStyle = {};

                    if (isSession) {
                        // In Session Mode, Side Buttons are Scene Launchers. 
                        // They don't stick "Active" unless playing? 
                        // For now, let's flash them on click? Or just simple trigger.
                        // Maybe toggle green if scene is playing? (requires sequencer state)
                    } else {
                        // Mixer Mode
                        if (label === 'Vol' && viewMode === 'VOLUME') isActive = true;
                        if (label === 'Pan' && viewMode === 'PAN') isActive = true;
                        if (label === 'Snd A' && viewMode === 'SEND_A') isActive = true;
                        if (label === 'Snd B' && viewMode === 'SEND_B') isActive = true;
                        if (label === 'Mute' && viewMode === 'MUTE') { isActive = true; customStyle = { borderColor: '#ffca00', color: '#ffca00', boxShadow: '0 0 15px rgba(255, 202, 0, 0.4)' }; }
                        if (label === 'Solo' && viewMode === 'SOLO') { isActive = true; customStyle = { borderColor: '#00ccff', color: '#00ccff', boxShadow: '0 0 15px rgba(0, 204, 255, 0.4)' }; }
                        if (label === 'Stop' && viewMode === 'STOP') { isActive = true; customStyle = { borderColor: '#ff4444', color: '#ff4444', boxShadow: '0 0 15px rgba(255, 68, 68, 0.4)' }; }
                        if (label === 'Rec' && viewMode === 'ARM') { isActive = true; customStyle = { borderColor: '#ff0000', color: '#ff0000', boxShadow: '0 0 15px rgba(255, 0, 0, 0.4)' }; }
                    }

                    return (
                        <SubButton
                            key={`side-${i}`}
                            label={label}
                            onClick={() => handleSideClick(label, i)}
                            isActive={isActive}
                            style={customStyle}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default Grid;
