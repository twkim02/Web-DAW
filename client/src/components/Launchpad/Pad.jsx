import React from 'react';
import styles from './Pad.module.css';
import useStore from '../../store/useStore';
import usePadTrigger from '../../hooks/usePadTrigger';
import { uploadFile } from '../../api/upload';
import { sampler } from '../../audio/Sampler';
import { instrumentManager } from '../../audio/InstrumentManager';

const Pad = React.memo(({ id, label }) => {
    // 1. Store Logic
    const isActive = useStore((state) => !!state.activePads[id]);
    const updatePadMapping = useStore((state) => state.updatePadMapping);
    const setEditingPadId = useStore((state) => state.setEditingPadId);
    const setPlayingPadId = useStore((state) => state.setPlayingPadId);
    const { triggerPad } = usePadTrigger();

    const mapping = useStore(state => state.padMappings[id]);
    const visualState = useStore(state => state.visualStates[id]); // { color: '#...' }

    // 2. Logic & Event Handlers
    const handleMouseDown = (e) => {
        if (e.shiftKey) {
            e.preventDefault();
            console.log('Opening settings for Pad', id);
            setEditingPadId(id);
            // Ensure sidebar open
            useStore.getState().setRightSidebarView('settings');
            if (!useStore.getState().isRightSidebarOpen) {
                useStore.getState().toggleRightSidebar();
            }
            return;
        }
        triggerPad(id, 'down');
    };

    const handleContextMenu = (e) => {
        e.preventDefault();
        const m = useStore.getState().padMappings[id];
        if (m && (m.type === 'piano' || m.type === 'synth' || m.type === 'drums')) {
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
                    const fileUrl = `http://localhost:3001/uploads/${encodeURIComponent(asset.filename)}`;
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
                const fileUrl = `http://localhost:3001/uploads/${encodeURIComponent(response.file.filename)}`;
                updatePadMapping(id, {
                    file: fileUrl,
                    assetId: response.file.id,
                    originalName: response.file.originalName,
                    type: 'sample',
                    mode: 'one-shot',
                    color: '#00ffcc'
                });
                sampler.loadSample(id, fileUrl).catch(console.error);
            } catch (err) { alert('Upload failed'); }
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
    const defaultColor = '#00ffcc';
    const assignedColor = mapping?.color || defaultColor;
    const visualColor = visualState?.color || assignedColor;

    // CSS Variables
    let cssVars = {};
    let classes = [styles.pad];

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

        cssVars['--pad-bg'] = assignedColor;
        cssVars['--pad-glow'] = isVisuallyActive ? visualColor : assignedColor;
        cssVars['backgroundColor'] = assignedColor;

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
            <span className={styles.keyLabel}>{label}</span>
        </button>
    );
});

export default Pad;
