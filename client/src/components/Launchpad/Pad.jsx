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
        if (e.ctrlKey) {
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
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('audio/')) {
            try {
                console.log('Uploading...', file.name);
                const response = await uploadFile(file);
                // response: { message, file: { id, filePath, ... } }
                // filePath is server path e.g. "c:/.../uploads/..."
                // We need a public URL. The server serves /uploads static.
                // But filePath in DB is absolute path. We need to construct URL.
                // Actually, we can just use the filename to construct the URL if we know the base.
                // Or better, server should return a usable URL or relative path.
                // For now, let's assume we construct it:
                const fileUrl = `http://localhost:3001/uploads/${response.file.filename}`;

                await sampler.loadSample(id, fileUrl);

                updatePadMapping(id, {
                    file: fileUrl,
                    assetId: response.file.id,
                    originalName: response.file.originalName
                });
                console.log('Sample Loaded:', fileUrl);
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
            <span className={styles.label}>{label}</span>
        </button>
    );
};

export default Pad;
