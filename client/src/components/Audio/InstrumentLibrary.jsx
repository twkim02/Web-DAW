import React from 'react';
import useStore from '../../store/useStore';

const InstrumentLibrary = () => {
    // Real virtual instruments
    const instruments = [
        { id: 'grand_piano', name: 'Grand Piano', type: 'sampler', preset: 'grand_piano' },
        { id: 'electric_piano', name: 'Electric Piano', type: 'sampler', preset: 'electric_piano' },
        { id: 'strings', name: 'Strings', type: 'sampler', preset: 'strings' },
        { id: 'brass', name: 'Brass Section', type: 'sampler', preset: 'brass' },
        { id: 'chiptune', name: 'Chiptune (8-bit)', type: 'synth', preset: 'chiptune' },
        { id: '808_kit', name: '808 Drum Kit', type: 'drums', preset: '808' },
    ];

    const setPreviewMode = useStore(state => state.setPreviewMode);

    const handleDragStart = (e, inst) => {
        e.dataTransfer.setData('application/json', JSON.stringify({
            type: 'instrument',
            instrument: {
                name: inst.name,
                type: inst.type, // 'piano', 'drums'
                preset: inst.preset
            }
        }));
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: '#ccc', padding: '16px', boxSizing: 'border-box' }}>
            <div style={{ marginBottom: '10px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                VIRTUAL INSTRUMENTS
            </div>

            <div style={{ flex: 1, overflowY: 'auto' }}>
                {instruments.map(inst => (
                    <div
                        key={inst.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, inst)}
                        onClick={() => {
                            console.log('Opening preview for:', inst.type, inst.preset);
                            setPreviewMode(true, inst.type, inst.preset);
                        }}
                        style={{
                            background: '#222',
                            marginBottom: '4px',
                            padding: '12px',
                            borderRadius: '4px',
                            cursor: 'pointer', // Changed to pointer
                            fontSize: '0.85rem',
                            border: '1px solid #993366',
                            color: '#ff99cc',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                        title="Click to Preview"
                    >
                        <span>🎻 {inst.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default InstrumentLibrary;
