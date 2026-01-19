import React from 'react';
import useStore from '../../store/useStore';

const InstructionModal = () => {
    const isInstructionOpen = useStore((state) => state.isInstructionOpen);
    const setIsInstructionOpen = useStore((state) => state.setIsInstructionOpen);

    if (!isInstructionOpen) return null;

    const modalStyle = {
        position: 'fixed',
        top: 0, left: 0, width: '100%', height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 2000,
        color: 'white',
        fontFamily: 'Inter, sans-serif'
    };

    const contentStyle = {
        backgroundColor: '#1E1E1E',
        padding: '30px',
        borderRadius: '12px',
        width: '600px',
        maxWidth: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 0 30px rgba(0, 0, 0, 0.5)',
        border: '1px solid #333'
    };

    const h2Style = { borderBottom: '1px solid #444', paddingBottom: '15px', marginBottom: '20px', fontSize: '24px' };
    const h3Style = { color: '#00ffcc', marginTop: '20px', marginBottom: '10px', fontSize: '18px' };
    const rowStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px solid #333', paddingBottom: '4px' };
    const keyStyle = { fontWeight: 'bold', color: '#fff', backgroundColor: '#333', padding: '2px 8px', borderRadius: '4px', fontSize: '14px' };
    const descStyle = { color: '#ccc', fontSize: '14px' };

    const sections = [
        {
            title: '🎹 Loop Station (루프 스테이션)',
            items: [
                { key: '5 ~ 0', desc: 'Loop Slot 1 ~ 6 Toggle (Rec/Play/Stop)' },
            ]
        },
        {
            title: '🎮 Instrument Pads (악기 연주)',
            items: [
                { key: '1, 2, 3, 4', desc: 'Row 1 Pads' },
                { key: 'Q, W, E, R', desc: 'Row 2 Pads' },
                { key: 'A, S, D, F', desc: 'Row 3 Pads' },
                { key: 'Z, X, C, V', desc: 'Row 4 Pads' },
            ]
        },
        {
            title: '🎛️ Control & Shortcuts (컨트롤)',
            items: [
                { key: 'Space', desc: 'Play / Stop Music (Transport)' },
                { key: 'Enter', desc: 'Start / Stop Recording (Live Mode Only)' },
                { key: 'Tab', desc: 'Switch Session / Mixer View' },
                { key: 'Shift + Click', desc: 'Edit Pad Settings' },
                { key: 'Esc', desc: 'Zoom Out / Close Modal' },
            ]
        },
        {
            title: '🔊 Mixer Shortcuts',
            items: [
                { key: 'Tab', desc: 'Select / Toggle Mixer Mode' },
                { key: '1 ~ 8', desc: 'Select Track (Column) directly' },
                { key: '↑ / ↓ Arrows', desc: 'Adjust Volume / Parameter' },
                { key: '[  /  ]', desc: 'Cycle Modes (Vol, Pan, Send, Mute...)' },
                { key: 'M -> 1-8', desc: 'Mute Mode: Press M, then 1-8 to Toggle Track' },
                { key: 'K -> 1-8', desc: 'Solo Mode: Press K, then 1-8 to Toggle Track' },
                { key: 'Stop Mode -> 1-8', desc: 'Press Backspace, then 1-8 to Stop Track' },
                { key: 'U, I, O, P', desc: 'Quick View: Vol, Pan, Send A, Send B' },
            ]
        }
    ];

    return (
        <div style={modalStyle} onClick={() => setIsInstructionOpen(false)}>
            <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
                <h2 style={h2Style}>⌨️ Keyboard Shortcuts</h2>

                {sections.map((section, idx) => (
                    <div key={idx}>
                        <h3 style={h3Style}>{section.title}</h3>
                        {section.items.map((item, i) => (
                            <div key={i} style={rowStyle}>
                                <span style={keyStyle}>{item.key}</span>
                                <span style={descStyle}>{item.desc}</span>
                            </div>
                        ))}
                    </div>
                ))}

                <button
                    onClick={() => setIsInstructionOpen(false)}
                    style={{
                        marginTop: '30px', width: '100%', padding: '12px',
                        backgroundColor: '#333', color: 'white', border: 'none',
                        borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold'
                    }}
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default InstructionModal;
