import React from 'react';
import Pad from './Pad';
import SubButton from './SubButton';
import InstructionModal from './InstructionModal';
import styles from './Grid.module.css';
import ThreeVisualizer from '../Visualizer/ThreeVisualizer';
import useKeyboardMap from '../../hooks/useKeyboardMap';
import useStore from '../../store/useStore';
import { sequencer } from '../../audio/Sequencer';
import { audioEngine } from '../../audio/AudioEngine';
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
                        backgroundColor: i < filled ? color : 'var(--glass-bg-subtle)',
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
    const setIsRecording = useStore((state) => state.setIsRecording);

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
    const loopSlots = useStore((state) => state.loopSlots);
    const selectedMixerTrack = useStore((state) => state.selectedMixerTrack);
    const setIsInstructionOpen = useStore((state) => state.setIsInstructionOpen);
    const topButtons = ['Session', 'Mixer', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6'];

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
        : ['Vol', 'Pan', 'Snd A', 'Snd B', 'Stop', 'Mute', 'Solo', 'Clear'];

    // ESC to Zoom Out + Loop Logic
    React.useEffect(() => {
        const handleKeyDown = (e) => {
            // Check for Blocking Modals
            const state = useStore.getState();
            if (state.previewMode.isOpen || state.playingPadId !== null) return;

            if (e.key === 'Escape' && editingPadId === null) {
                setIsZoomed(false);
            }

            // Loop Station: 6-0,- 
            // BLOCKED in Mixer Mode
            const MIXER_MODES = ['VOLUME', 'PAN', 'SEND_A', 'SEND_B', 'MIXER_SELECTION', 'MUTE', 'SOLO', 'STOP', 'ARM', 'CLEAR'];
            if (MIXER_MODES.includes(useStore.getState().viewMode)) return;

            if (!editingPadId && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
                const loopKeys = ['Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus'];
                if (loopKeys.includes(e.code)) {
                    const slotIndex = loopKeys.indexOf(e.code);
                    e.preventDefault();

                    if (e.altKey) {
                        // Alt + Key -> Clear Slot
                        sequencer.clearSlot(slotIndex);
                    } else {
                        // Solo Key -> Toggle/Record
                        sequencer.toggleSlot(slotIndex);
                    }
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [editingPadId, setIsZoomed]);

    const handleTopClick = (label) => {
        if (label === 'Session') { setViewMode('SESSION'); return; }
        if (label === 'Mixer') { setViewMode('MIXER_SELECTION'); return; }

        if (label.startsWith('L')) {
            // Loop Slot
            const slotIndex = parseInt(label.replace('L', '')) - 1;
            sequencer.toggleSlot(slotIndex);
        }
    };

    // Get Color for Top Buttons
    const getTopButtonProps = (label) => {
        if (label === 'Session' || label === 'Mixer') return {};

        if (label.startsWith('L')) {
            const slotIndex = parseInt(label.replace('L', '')) - 1;
            const status = loopSlots[slotIndex]?.status || 'empty';

            let style = {};
            let isActive = false;

            if (status === 'recording') {
                style = {
                    borderColor: '#ff4444',
                    color: '#ff4444',
                    backgroundColor: 'rgba(255, 68, 68, 0.2)',
                    animation: 'recordingBgPulse 1s infinite'
                };
                isActive = true;
            } else if (status === 'armed') {
                style = {
                    borderColor: '#ffdd00',
                    color: '#ffdd00',
                    backgroundColor: 'rgba(255, 221, 0, 0.1)',
                    animation: 'recordingBgPulse 0.5s infinite', // Faster pulse for Ready
                    opacity: 0.9
                };
                isActive = true;
            } else if (status === 'playing') {
                style = {
                    borderColor: '#00ff00',
                    color: '#00ff00',
                    backgroundColor: 'rgba(0, 255, 0, 0.2)',
                    boxShadow: '0 0 10px rgba(0, 255, 0, 0.2)'
                };
                isActive = true;
            } else if (status === 'queued') {
                style = {
                    borderColor: '#ffaa00',
                    color: '#ffaa00',
                    backgroundColor: 'rgba(255, 170, 0, 0.2)',
                    animation: 'recordingBgPulse 0.5s infinite'
                };
                isActive = true;
            } else if (status === 'stopped') {
                style = {
                    borderColor: '#ffcc00',
                    color: '#ffcc00',
                    opacity: 0.7
                };
            }

            return { style, isActive };
        }
        return {};
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
            case 'Stop': setViewMode('STOP'); break;
            case 'Clear': setViewMode('CLEAR'); break; // Replaces Rec (Arm)
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
                <div
                    key={i}
                    className={styles.columnCell}
                    style={{
                        border: i === selectedMixerTrack ? '2px solid var(--color-text-primary)' : '1px solid var(--glass-border-medium)',
                        backgroundColor: i === selectedMixerTrack ? 'var(--glass-bg-subtle)' : 'transparent',
                        padding: '2px'
                    }}
                >
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

        if (['MUTE', 'SOLO', 'ARM', 'CLEAR'].includes(viewMode)) {
            // Render Toggle Switches (CLEAR reuses this logic partially or separate?)
            const typeMap = { 'MUTE': 'mute', 'SOLO': 'solo', 'ARM': 'arm', 'CLEAR': 'clear' };
            const type = typeMap[viewMode];
            const data = trackStates[type] || Array(8).fill(false);

            return Array(64).fill(null).map((_, i) => {
                // Whole column toggles track state
                const col = i % 8;

                // For CLEAR mode, we don't toggle state, we trigger action.
                // But let's reuse loop to render pads.

                const isActive = data[col];
                let color = '#222';
                let label = '';

                if (viewMode === 'MUTE') { color = isActive ? '#ffca00' : '#222'; label = i >= 56 ? 'M' : ''; }
                if (viewMode === 'SOLO') { color = isActive ? '#00ccff' : '#222'; label = i >= 56 ? 'S' : ''; }
                if (viewMode === 'ARM') { color = isActive ? '#ff0000' : '#222'; label = i >= 56 ? 'R' : ''; }

                if (viewMode === 'CLEAR') {
                    // Only columns 0-5 are valid loop slots
                    if (col <= 5) {
                        const loopStatus = useStore.getState().loopSlots[col]?.status;
                        const hasLoop = loopStatus && loopStatus !== 'empty';
                        color = hasLoop ? '#ffffff' : '#444'; // White if erasable
                        label = hasLoop && i >= 56 ? 'CLR' : '';
                    } else {
                        color = '#222'; // Empty columns
                    }
                }

                return (
                    <div
                        key={i}
                        onClick={() => {
                            if (viewMode === 'CLEAR') {
                                if (col <= 5) sequencer.clearSlot(col);
                            } else if (viewMode === 'MUTE') {
                                if (col <= 5) sequencer.toggleMute(`slot-${col}`);
                                toggleTrackState(type, col); // Keep UI synced
                            } else if (viewMode === 'SOLO') {
                                if (col <= 5) sequencer.toggleSolo(`slot-${col}`);
                                toggleTrackState(type, col); // Keep UI synced
                            } else {
                                toggleTrackState(type, col);
                            }
                        }}
                        style={{
                            width: '100%', height: '100%',
                            backgroundColor: color,
                            border: '1px solid #444',
                            opacity: (viewMode === 'CLEAR' && col <= 5) ? 0.8 : (isActive ? 1 : 0.3),
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                            color: viewMode === 'CLEAR' ? '#000' : '#fff',
                            fontSize: '10px',
                            fontWeight: 'bold'
                        }}
                    >
                        {label}
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
                            // Stop Track Logic
                            console.log(`Stopping Track ${col}`);
                            sequencer.stopTrack(col);
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

    // --- Media Recorder Ref ---
    const mediaRecorderRef = React.useRef(null);
    const chunksRef = React.useRef([]);

    // Live Mode State
    const isLiveMode = useStore((state) => state.isLiveMode);
    const toggleLiveMode = useStore((state) => state.toggleLiveMode);

    // Recording Logic
    const handleRecordToggle = async () => {
        if (isRecording) {
            // STOP RECORDING
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
            // Exit Fullscreen
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(err => console.log('Exit Fullscreen Error:', err));
            }
        } else {
            // START RECORDING
            try {
                // 1. Auto Fullscreen (User Gesture Required - we are in a click handler)
                if (!document.fullscreenElement) {
                    await document.documentElement.requestFullscreen().catch(err => console.log('Fullscreen Error:', err));
                }

                // Small delay to allow fullscreen transition to complete for better capture
                await new Promise(resolve => setTimeout(resolve, 500));

                // 2. Get Screen Stream (Clean Web Capture)
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: {
                        width: { ideal: 1920, max: 3840 },
                        height: { ideal: 1080, max: 2160 },
                        frameRate: { ideal: 60 },
                    },
                    audio: false, // We mix audio manually below
                    preferCurrentTab: true,
                    selfBrowserSurface: 'include',
                    systemAudio: 'exclude',
                    surfaceSwitching: 'include',
                    monitorTypeSurfaces: 'exclude'
                });

                // 3. Get Audio Stream from AudioEngine
                const { audioEngine } = await import('../../audio/AudioEngine');
                const audioStream = audioEngine.getAudioStream();

                if (!audioStream) {
                    alert('Audio Engine not ready. Try again.');
                    setIsRecording(false);
                    return;
                }

                // 4. Combine Streams
                const combinedStream = new MediaStream([
                    ...screenStream.getVideoTracks(),
                    ...audioStream.getAudioTracks()
                ]);

                // 5. Start MediaRecorder
                // Safe High Quality Settings (VP8 is more compatible)
                const options = {
                    mimeType: 'video/webm; codecs=vp8,opus',
                    videoBitsPerSecond: 5000000, // 5 Mbps (Safe High Quality)
                    audioBitsPerSecond: 320000 // 320 kbps (Studio Quality)
                };

                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    console.warn("VP9 not supported, falling back to default webm");
                    delete options.mimeType;
                }

                const mediaRecorder = new MediaRecorder(combinedStream, options);
                mediaRecorderRef.current = mediaRecorder;
                chunksRef.current = [];

                mediaRecorder.ondataavailable = (e) => {
                    if (e.data.size > 0) chunksRef.current.push(e.data);
                };

                mediaRecorder.onstop = () => {
                    // Create Blob using the actual MIME type recorded
                    const mimeType = mediaRecorder.mimeType || 'video/webm';
                    const blob = new Blob(chunksRef.current, { type: mimeType });

                    // Determine file extension based on MIME type
                    const fileExt = mimeType.includes('mp4') ? 'mp4' : 'webm';

                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = `Live_Set_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.${fileExt}`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);

                    // Stop Tracks
                    combinedStream.getTracks().forEach(track => track.stop());
                    setIsRecording(false);
                };

                mediaRecorder.start();
                setIsRecording(true);

                // Handle user stopping screen share via browser UI
                screenStream.getVideoTracks()[0].onended = () => {
                    if (mediaRecorder.state === 'recording') mediaRecorder.stop();
                };

            } catch (err) {
                console.error("Recording Error:", err);
                setIsRecording(false);
            }
        }
    };

    // Use refs to access latest state in event listener without re-binding
    const latestState = React.useRef({ isLiveMode, handleRecordToggle });
    latestState.current = { isLiveMode, handleRecordToggle };

    React.useEffect(() => {
        const handleKeyDown = async (e) => {
            // Check for Blocking Modals
            const state = useStore.getState();
            if (state.previewMode.isOpen || state.playingPadId !== null) return;

            const activeTag = document.activeElement.tagName.toLowerCase();
            if (['input', 'textarea', 'select'].includes(activeTag)) return;

            const { isLiveMode, handleRecordToggle } = latestState.current;

            // New Workflow: Backquote (` or ~) -> "Record Session Start/Stop"
            if (e.code === 'Backquote') {
                e.preventDefault();

                if (!useStore.getState().isRecording) {
                    try {
                        await handleRecordToggle();
                        if (useStore.getState().isRecording) {
                            if (!useStore.getState().isLiveMode) state.toggleLiveMode();
                            if (!useStore.getState().isPlaying) {
                                const status = audioEngine.toggleTransport();
                                useStore.setState({ isPlaying: status === 'started' });
                            }
                        }
                    } catch (err) { }
                } else {
                    // STOP Sequence
                    handleRecordToggle(); // Stop Recording
                    if (useStore.getState().isPlaying) {
                        audioEngine.stopTransport();
                        useStore.setState({ isPlaying: false });
                    }
                    if (useStore.getState().isLiveMode) {
                        state.toggleLiveMode();
                    }
                }
                return;
            }

            // Spacebar: Live Mode + Force Restart (Resync)
            if (e.code === 'Space') {
                e.preventDefault();
                state.toggleLiveMode();

                // Force Restart: Stop -> Count-in -> Start
                // This ensures we "reset the baseline" as requested.
                audioEngine.stopTransport();
                audioEngine.startWithCountIn();

                useStore.setState({ isPlaying: true });
                return;
            }

            // Support Enter and NumpadEnter (Legacy / Manual Trigger in Live Mode)
            if (isLiveMode && (e.code === 'Enter' || e.code === 'NumpadEnter' || e.key === 'Enter')) {
                e.preventDefault();
                if (!e.repeat) {
                    // console.log("[Grid] Enter key detected in Live Mode");
                    handleRecordToggle();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []); // Empty dependency array = bind once
    // No explicit return need for this specific hook since it handles cleanup internally via the return above.
    // handleRecordToggle uses isRecording from store and refs. 
    // Since handleRecordToggle is re-created on render if dependencies change? 
    // Actually handleRecordToggle is defined inside component body, so it captures current scope.
    // So we need to include it in dependency or use a ref for the handler?
    // Safer to include handleRecordToggle in dependency list, but it triggers re-effect.
    // Let's rely on standard Hook behavior.

    // --- Render Content ---

    // Updated Return with Layers:
    const showVisualizer = useStore((state) => state.showVisualizer);
    const visualizerMode = useStore((state) => state.visualizerMode);

    return (
        <div className={`${styles.wrapper} ${isZoomed ? styles.zoomed : ''}`} style={{ ...zoomStyle, /* ...gridStyle removed - applied to wrapper? needs color? yes */ ...gridStyle }}>

            {/* Layer 0: Glass Background Panel */}
            <div className={styles.glassPanel} />

            {/* Layer 1: Visualizer (Sandwiched) */}
            {showVisualizer && (
                <div className={styles.visualizerLayer}>
                    {/* Re-using BackgroundVisualizer logic? Or direct ThreeVisualizer? */}
                    {/* Direct ThreeVisualizer prefered to keep it simple locally */}
                    <ThreeVisualizer
                        themeType={currentTheme.type}
                        primaryColor={currentTheme.primaryColor}
                        visualizerMode={visualizerMode}
                    />
                </div>
            )}

            <InstructionModal />

            {/* Layer 2: Grid Content (Top, Corner, Main, Side) */}
            {/* Need to ensure these have z-index > 5 in CSS or inline */}

            {/* 1. Top Row */}
            <div className={styles.topSection} style={{ zIndex: 10, position: 'relative' }}>
                {topButtons.map((label, i) => (
                    <SubButton
                        key={`top-${i}`}
                        label={label}
                        onClick={() => handleTopClick(label)}
                        {...getTopButtonProps(label)}
                    />
                ))}
            </div>

            {/* 2. Top Right Corner */}
            <div className={styles.corner} style={{ zIndex: 10, position: 'relative' }}>
                {/* Dynamic Logo / Record Button */}
                <div
                    onClick={!isLiveMode ? toggleLiveMode : handleRecordToggle}
                    style={{
                        width: '100%', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isRecording ? '#ffffff' : (isLiveMode ? '#ffffff' : '#000000'),
                        borderRadius: '4px',
                        border: isRecording ? '2px solid var(--color-danger)' : (isLiveMode ? '1px solid var(--color-text-secondary)' : '1px solid var(--glass-border-medium)'),
                        cursor: 'pointer',
                        overflow: 'hidden',
                        animation: isRecording ? 'recordingBgPulse 1s infinite' : 'none',
                        transition: 'all 0.3s ease'
                    }}
                    title={
                        !isLiveMode ? "Click or Press SPACE for Live Mode" :
                            (isRecording ? "Click or Press ENTER to Stop Recording" : "Click or Press ENTER to Record")
                    }
                >
                    <img
                        src="/assets/images/logo_v2.png"
                        alt="WEB DAW"
                        style={{
                            width: '80%', height: '80%', objectFit: 'contain',
                            filter: 'none'
                        }}
                    />
                </div>
            </div>

            {/* 3. Main Grid */}
            <div className={styles.gridSection} style={{ zIndex: 10, position: 'relative' }}>
                {renderGridContent()}
            </div>

            {/* 4. Side Column */}
            <div className={styles.sideSection} style={{ zIndex: 10, position: 'relative' }}>
                {sideButtons.map((label, i) => {
                    // Logic for Active State
                    let isActive = false;
                    let customStyle = {};

                    if (isSession) {
                        // Session Mode logic
                    } else {
                        // Mixer Mode logic
                        if (label === 'Vol' && viewMode === 'VOLUME') isActive = true;
                        if (label === 'Pan' && viewMode === 'PAN') isActive = true;
                        if (label === 'Snd A' && viewMode === 'SEND_A') isActive = true;
                        if (label === 'Snd B' && viewMode === 'SEND_B') isActive = true;
                        if (label === 'Mute' && viewMode === 'MUTE') isActive = true;
                        if (label === 'Solo' && viewMode === 'SOLO') isActive = true;
                        if (label === 'Stop' && viewMode === 'STOP') isActive = true;
                        if (label === 'Clear' && viewMode === 'CLEAR') isActive = true;
                    }

                    return (
                        <SubButton
                            key={`side-${i}`}
                            label={label}
                            onClick={() => handleSideClick(label, i)}
                            style={customStyle}
                            isActive={isActive}
                        />
                    );
                })}
            </div>


        </div>
    );
};

export default Grid;
