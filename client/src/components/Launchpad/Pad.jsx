import React from 'react';
import styles from './Pad.module.css';
import useStore from '../../store/useStore';
import usePadTrigger from '../../hooks/usePadTrigger';
import { uploadFile } from '../../api/upload';
import { sampler } from '../../audio/Sampler';

const Pad = ({ id, label }) => {
    const isActive = useStore((state) => !!state.activePads[id]);
    const updatePadMapping = useStore((state) => state.updatePadMapping);
    const setEditingPadId = useStore((state) => state.setEditingPadId);
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
                if (data.type === 'asset' && data.asset) {
                    const { asset } = data;
                    console.log('Dropped Asset:', asset.originalName);

                    const fileUrl = `http://localhost:3001/uploads/${encodeURIComponent(asset.filename)}`;

                    // OPTIMISTIC UPDATE: Update UI first
                    updatePadMapping(id, {
                        file: fileUrl,
                        assetId: asset.id,
                        originalName: asset.originalName,
                        type: 'sample',
                        name: null
                    });

                    // Load Audio (Async)
                    sampler.loadSample(id, fileUrl).catch(err => {
                        console.error('Failed to load sample audio:', err);
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
