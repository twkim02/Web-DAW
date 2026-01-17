import React from 'react';
import styles from './Pad.module.css';
import useStore from '../../store/useStore';
import usePadTrigger from '../../hooks/usePadTrigger';
import { uploadFile } from '../../api/upload';
import { sampler } from '../../audio/Sampler';
import { instrumentManager } from '../../audio/InstrumentManager';

const Pad = ({ id, label }) => {
    const isActive = useStore((state) => !!state.activePads[id]);
    const updatePadMapping = useStore((state) => state.updatePadMapping);
    const setEditingPadId = useStore((state) => state.setEditingPadId);
    const setPlayingPadId = useStore((state) => state.setPlayingPadId);
    const { triggerPad } = usePadTrigger();

    const handleMouseDown = (e) => {
        if (e.shiftKey) {
            e.preventDefault();
            console.log('Opening settings for Pad', id);
            setEditingPadId(id);
            return;
        }
        triggerPad(id, 'down');
    };

    // Right Click to Open Virtual Instrument
    const handleContextMenu = (e) => {
        e.preventDefault();
        const mapping = useStore.getState().padMappings[id];
        if (mapping && (mapping.type === 'piano' || mapping.type === 'synth' || mapping.type === 'drums')) {
            setPlayingPadId(id);
        } else {
            setEditingPadId(id);
        }
    };

    const handleMouseUp = () => triggerPad(id, 'up');
    const handleMouseLeave = () => triggerPad(id, 'up');

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = async (e) => {
        e.preventDefault();

        // 1. Handle Internal Drag (Sidebar Library)
        const jsonData = e.dataTransfer.getData('application/json');
        if (jsonData) {
            try {
                const data = JSON.parse(jsonData);
                console.log('Drop Data:', data); // DEBUG LOG

                // CASE A: Audio File or Recording
                if ((data.type === 'asset' || data.type === 'recording') && data.asset) {
                    const { asset } = data;
                    console.log('Dropped Asset/Rec:', asset.originalName);

                    const fileUrl = `http://localhost:3001/uploads/${encodeURIComponent(asset.filename)}`;

                    updatePadMapping(id, {
                        file: fileUrl,
                        assetId: asset.id,
                        originalName: asset.originalName,
                        type: 'sample', // It's an audio sample
                        name: null,
                        mode: 'one-shot'
                    });

                    sampler.loadSample(id, fileUrl).catch(err => console.error('Load failed:', err));
                    return;
                }

                // CASE B: Synth Preset
                if (data.type === 'synth' && data.preset) {
                    const { preset } = data;
                    console.log('Dropped Synth:', preset.name);

                    updatePadMapping(id, {
                        type: 'synth',
                        name: preset.name,
                        mode: 'gate', // Synths usually gate
                        note: 'C4',   // Default note
                        synthPreset: preset.id // Save preset ID for engine to use?
                    });

                    // TODO: Tell AudioEngine to set params for this pad/synth if polyphonic per pad?
                    // For now, usePadTrigger just triggers generic synth note.
                    // Ideally we'd store oscillator type in mapping to change sound on trigger.
                    updatePadMapping(id, {
                        synthParams: { oscillator: { type: preset.osc } }
                    });

                    return;
                }

                // CASE C: Instrument
                if (data.type === 'instrument' && data.instrument) {
                    const { instrument } = data;
                    console.log('Dropped Instrument:', instrument.name);

                    // For now, treat instruments as special synths or placeholders
                    updatePadMapping(id, {
                        type: 'synth', // Fallback to synth for now until Sampler has instrument support
                        name: instrument.name,
                        mode: 'one-shot',
                        note: 'C3',
                        color: '#ff99cc'
                    });
                    return;
                }

            } catch (err) {
                console.error('JSON Parse Error', err);
            }
        }

        // 2. Handle External File Drop (OS)
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('audio/')) {
            try {
                console.log('Uploading...', file.name);
                const response = await uploadFile(file);
                // response: { message, file: { id, filePath, ... } }

                const fileUrl = `http://localhost:3001/uploads/${encodeURIComponent(response.file.filename)}`;

                // OPTIMISTIC UPDATE
                updatePadMapping(id, {
                    file: fileUrl,
                    assetId: response.file.id,
                    originalName: response.file.originalName,
                    name: null
                });

                // Load Audio (Async)
                sampler.loadSample(id, fileUrl).catch(err => {
                    console.error('Failed to load uploaded sample:', err);
                });

                console.log('Sample Uploaded & Loaded:', fileUrl);
            } catch (err) {
                console.error('Upload failed', err);
                alert('Upload failed');
            }
        }
    };



    // Construct dynamic style
    const padStyle = {};
    const mapping = useStore(state => state.padMappings[id]);
    const customColor = mapping?.color;

    // DEBUG: Check mapping on render
    console.log(`[Pad ${id}] Render. Mapping:`, mapping);

    if (isActive) {
        padStyle.backgroundColor = customColor || '#00ffcc'; // Default cyan if no color
        padStyle.boxShadow = `0 0 15px ${customColor || '#00ffcc'}, 0 0 30px ${customColor || '#00ffcc'}`;
    }

    return (
        <button
            className={`${styles.pad} ${isActive ? styles.active : ''}`}
            style={padStyle}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onContextMenu={handleContextMenu}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            {/* Center Name: User defined name or Original Filename (truncated) */}
            <span className={styles.padName}>
                {mapping?.name || (mapping?.originalName ? mapping.originalName.substring(0, 8) + '...' : '')}
            </span>

            {/* Corner Key Label */}
            <span className={styles.keyLabel}>{label}</span>
        </button>
    );
};

export default Pad;
