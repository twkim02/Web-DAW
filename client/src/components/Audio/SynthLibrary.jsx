import React from 'react';

const SynthLibrary = () => {
    // Synth presets matching Synths.js
    const presets = [
        { id: 'saw_lead', name: 'Saw Tooth Lead', type: 'synth', presetId: 'saw_lead' },
        { id: 'square_bass', name: 'Square Bass', type: 'synth', presetId: 'square_bass' },
        { id: 'soft_pad', name: 'Soft Pad', type: 'synth', presetId: 'soft_pad' },
        { id: 'default', name: 'Basic Triangle', type: 'synth', presetId: 'default' },
    ];

    const handleDragStart = (e, preset) => {
        e.dataTransfer.setData('application/json', JSON.stringify({
            type: 'synth',
            preset: {
                name: preset.name,
                presetId: preset.presetId
            }
        }));
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: '#ccc', padding: '16px', boxSizing: 'border-box' }}>
            <div style={{ marginBottom: '10px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                SYNTHESIZERS
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', alignContent: 'start' }}>
                {presets.map(preset => (
                    <div
                        key={preset.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, preset)}
                        style={{
                            background: '#222',
                            padding: '12px 8px',
                            borderRadius: '4px',
                            cursor: 'grab',
                            fontSize: '0.75rem',
                            border: '1px solid #336699',
                            color: '#99ccff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            transition: 'all 0.1s',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap'
                        }}
                        title={preset.name}
                    >
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>🎹 {preset.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SynthLibrary;
