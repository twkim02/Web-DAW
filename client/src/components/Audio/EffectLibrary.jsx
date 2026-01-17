import React from 'react';

const EffectLibrary = () => {
    // Available Effects List
    const effects = [
        { id: 'dist', name: 'Distortion', type: 'distortion', params: { distortion: 0.8 } },
        { id: 'bit', name: 'BitCrusher', type: 'bitcrusher', params: { bits: 4 } },
        { id: 'chorus', name: 'Chorus', type: 'chorus', params: { frequency: 1.5, delayTime: 3.5, depth: 0.7 } },
        { id: 'phaser', name: 'Phaser', type: 'phaser', params: { frequency: 15, octaves: 5, baseFrequency: 1000 } },
        { id: 'autowah', name: 'AutoWah', type: 'autowah', params: { baseFrequency: 100, octaves: 6, sensitivity: 0 } },
        { id: 'chebyshev', name: 'Chebyshev', type: 'chebyshev', params: { order: 50 } },
        { id: 'tremolo', name: 'Tremolo', type: 'tremolo', params: { frequency: 9, depth: 0.75 } },
        { id: 'pitch', name: 'PitchShift', type: 'pitchshift', params: { pitch: 12 } }, // +1 Octave
    ];

    const handleDragStart = (e, eff) => {
        e.dataTransfer.setData('application/json', JSON.stringify({
            type: 'effect',
            effect: {
                name: eff.name,
                type: eff.type,
                params: eff.params
            }
        }));
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', color: '#ccc' }}>
            <div style={{ marginBottom: '15px', fontSize: '0.9rem', fontWeight: 'bold', letterSpacing: '1px', borderBottom: '1px solid #444', paddingBottom: '5px' }}>
                EFFECT RACK
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {effects.map(eff => (
                    <div
                        key={eff.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, eff)}
                        style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            padding: '15px 10px',
                            borderRadius: '6px',
                            cursor: 'grab',
                            fontSize: '0.85rem',
                            border: '1px solid rgba(0, 255, 204, 0.2)',
                            color: '#00ffcc',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            textAlign: 'center',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = 'rgba(0, 255, 204, 0.15)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 5px 15px rgba(0, 255, 204, 0.1)';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
                        }}
                        title={`Drag to Pad: ${eff.name}`}
                    >
                        <span>⚡ {eff.name}</span>
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '20px', fontSize: '0.75rem', color: '#666', textAlign: 'center', lineHeight: '1.4' }}>
                Drag these effects onto any Pad to apply Insert Processing.
            </div>
        </div>
    );
};

export default EffectLibrary;
