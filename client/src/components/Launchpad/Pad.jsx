import React from 'react';
import styles from './Pad.module.css';
import client from '../../api/client';
import useStore from '../../store/useStore';
import usePadTrigger from '../../hooks/usePadTrigger';
import { uploadFile } from '../../api/upload';
import { sampler } from '../../audio/Sampler';
import { instrumentManager } from '../../audio/InstrumentManager';
import { useToast } from '../UI/ToastContext';

const Pad = React.memo(({ id, label }) => {
    // 1. Store Logic
    const isActive = useStore((state) => !!state.activePads[id]);
    const updatePadMapping = useStore((state) => state.updatePadMapping);
    const setEditingPadId = useStore((state) => state.setEditingPadId);
    const setPlayingPadId = useStore((state) => state.setPlayingPadId);
    const { triggerPad } = usePadTrigger();
    const { addToast } = useToast();

    const mapping = useStore(state => state.padMappings[id]);
    const visualState = useStore(state => state.visualStates[id]); // { color: '#...' }

    // 2. Logic & Event Handlers
    const handleMouseDown = (e) => {
        if (e.shiftKey) {
            e.preventDefault();

            const state = useStore.getState();
            const isCurrentlyEditingThis = state.editingPadId === id;
            const isSidebarOpen = state.isRightSidebarOpen;

            if (isCurrentlyEditingThis && isSidebarOpen) {
                // If already editing this pad and sidebar is open, CLOSE IT
                console.log('Closing settings via Shift+Click');
                state.setIsRightSidebarOpen(false);
                // Optional: setEditingPadId(null)? Keeps context if just closing.
            } else {
                // Otherwise OPEN IT
                console.log('Opening settings for Pad', id);
                setEditingPadId(id);
                // Ensure sidebar open
                state.setRightSidebarView('settings');
                if (!isSidebarOpen) {
                    state.toggleRightSidebar();
                }
            }
            return;
        }
        triggerPad(id, 'down');
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
        const m = useStore.getState().padMappings[id];
        if (m && (m.type === 'piano' || m.type === 'synth' || m.type === 'drums' || m.type === 'instrument')) {
            setPlayingPadId(id);
        } else {
            setEditingPadId(id);
        }
    };

    const handleMouseUp = () => triggerPad(id, 'up');
    const handleMouseLeave = () => triggerPad(id, 'up');
    const handleDragOver = (e) => e.preventDefault();

    const handleDrop = async (e) => {
        e.preventDefault();
        const jsonData = e.dataTransfer.getData('application/json');

        // 1. Internal Drop
        if (jsonData) {
            try {
                const data = JSON.parse(jsonData);
                if ((data.type === 'asset' || data.type === 'recording') && data.asset) {
                    const { asset } = data;
                    // Use provided URL (from FileLibrary) or construct it
                    // FileLibrary now ensures asset.url includes baseURL, but we fallback safely
                    let fileUrl = asset.url;
                    if (!fileUrl) {
                        const baseURL = client.defaults.baseURL || 'http://localhost:3001';
                        fileUrl = `${baseURL}/uploads/${encodeURIComponent(asset.filename)}`;
                    }

                    updatePadMapping(id, {
                        file: fileUrl,
                        assetId: asset.id,
                        originalName: asset.originalName,
                        type: 'sample',
                        name: null,
                        mode: 'one-shot',
                        color: '#00ffcc'
                    });
                    sampler.loadSample(id, fileUrl).catch(console.error);
                } else if (data.type === 'synth' && data.preset) {
                    updatePadMapping(id, {
                        type: 'synth',
                        name: data.preset.name,
                        mode: 'gate',
                        note: 'C4',
                        synthPreset: data.preset.id,
                        color: '#ff99cc'
                    });
                } else if (data.type === 'effect' && data.effect) {
                    updatePadMapping(id, { effect: data.effect });
                    instrumentManager.applyEffect(id, data.effect);
                }
            } catch (err) { console.error(err); }
        }

        // 2. External Drop
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('audio/')) {
            try {
                const response = await uploadFile(file);
                const baseURL = client.defaults.baseURL || 'http://localhost:3001';
                // response.file.url is relative (/uploads/filename)
                const fileUrl = response.file.url ? `${baseURL}${response.file.url}` : `${baseURL}/uploads/${encodeURIComponent(response.file.filename)}`;

                updatePadMapping(id, {
                    file: fileUrl,
                    assetId: response.file.id,
                    originalName: response.file.originalName,
                    type: 'sample',
                    mode: 'one-shot',
                    color: '#00ffcc'
                });
                sampler.loadSample(id, fileUrl).catch(console.error);
                addToast('Sample uploaded successfully!', 'success');
            } catch (err) { addToast('Upload failed', 'error'); }
        }
    };

    // 3. Rendering Logic (Style & Classes)

    // State
    const isLogicallyActive = isActive;
    const isReserved = useStore((state) => state.queuedPads.has(id));
    const isVisuallyActive = !!visualState;
    const isAssigned = mapping && (mapping.file || (mapping.type && mapping.type !== 'sample'));

    // Colors
    // If Playing: Fill = MappingColor. Glow = VisualState(e.g. Ripple) OR MappingColor.
    // If Reserved: Blink Yellow/Green.
    // If Ghost: Fill = Transparent. Glow = VisualState.

    // Default Colors
    const defaultColor = 'var(--color-accent-primary)';
    const assignedColor = mapping?.color || defaultColor;
    const visualColor = visualState?.color || assignedColor;

    // --- MUTE / SOLO VISUALS ---
    const trackStates = useStore(state => state.trackStates);
    const col = id % 8;
    const isSoloActive = trackStates.solo.some(s => s);
    const isSelfSoloed = trackStates.solo[col];
    const isSelfMuted = trackStates.mute[col];

    let isDimmed = false;
    let statusIcon = null;

    if (isSoloActive) {
        if (!isSelfSoloed) isDimmed = true; // Dimmed by others
        else statusIcon = <span style={{ position: 'absolute', top: 2, right: 2, fontSize: '8px', color: '#00ccff' }}>S</span>;
    } else {
        if (isSelfMuted) {
            isDimmed = true;
            statusIcon = <span style={{ position: 'absolute', top: 2, right: 2, fontSize: '8px', color: '#ff4444' }}>M</span>;
        }
    }

    // CSS Variables
    let cssVars = {};
    let classes = [styles.pad];

    if (isDimmed) {
        cssVars['opacity'] = 0.2;
        cssVars['filter'] = 'grayscale(100%)';
    }

    if (isReserved) {
        // RESERVED STATE (Queue)
        classes.push(styles.assigned); // Base shape
        cssVars['--pad-bg'] = '#ffee00'; // Yellow for reserved
        cssVars['--pad-glow'] = '#ffee00';
        cssVars['backgroundColor'] = 'transparent'; // Outline? Or Dim?
        cssVars['border'] = '2px dashed #ffee00';
        cssVars['animation'] = 'pulse 1s infinite'; // Reuse pulse
        // Or specific reserved animation

    } else if (isLogicallyActive) {
        classes.push(styles.active);
        // ... (existing active logic)
        const fx = mapping?.visualEffect;
        if (fx === 'pulse') classes.push(styles.pulse);
        if (fx === 'flash') classes.push(styles.flash);

        // Ensure Color is valid
        const activeColor = assignedColor || '#00ffcc';

        cssVars['--pad-bg'] = activeColor;
        cssVars['--pad-glow'] = isVisuallyActive ? visualColor : activeColor;
        cssVars['backgroundColor'] = activeColor;

        // Force stronger visual for active loop
        cssVars['borderColor'] = '#ffffff';
        cssVars['boxShadow'] = `0 0 15px ${activeColor}, inset 0 0 5px ${activeColor}`;
        cssVars['zIndex'] = 2; // Bring to front

    } else if (isVisuallyActive) {
        // Just a ripple passing through
        classes.push(styles.ghostActive);
        cssVars['--pad-glow'] = visualColor;
        cssVars['--pad-bg'] = 'transparent';
        cssVars['backgroundColor'] = 'transparent';
    } else if (isAssigned) {
        classes.push(styles.assigned);
    }

    return (
        <button
            className={classes.join(' ')}
            style={cssVars}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onContextMenu={handleContextMenu}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {/* Image Overlay */}
            {mapping?.image && (
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, width: '100%', height: '100%',
                    backgroundImage: `url(${mapping.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    opacity: isLogicallyActive ? 1 : 0.6, // Brighten when active
                    zIndex: 0,
                    borderRadius: 'inherit',
                    filter: isDimmed ? 'grayscale(100%) brightness(0.5)' : 'none', // Apply Dim logic to image too
                    transition: 'opacity 0.1s, filter 0.2s'
                }} />
            )}

            {/* Content (Label/Icons) - Ensure z-index > 0 */}
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span className={styles.keyLabel} style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>{label}</span>
                {statusIcon}
            </div>
        </button>
    );
});

export default Pad;
