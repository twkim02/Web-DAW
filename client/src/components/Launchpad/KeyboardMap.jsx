import React from 'react';
import styles from './KeyboardMap.module.css';

const KeyboardMap = () => {

    const rows = [
        [
            { label: 'ESC', size: 'md', type: 'global', desc: 'Exit' },
            { label: '1', type: 'pad', desc: 'Pad 1 / Trk 1' },
            { label: '2', type: 'pad', desc: 'Pad 2 / Trk 2' },
            { label: '3', type: 'pad', desc: 'Pad 3 / Trk 3' },
            { label: '4', type: 'pad', desc: 'Pad 4 / Trk 4' },
            { label: '5', type: 'global', desc: 'Scene 1 / Loop' },
            { label: '6', type: 'mixer', desc: 'Loop 2 / Trk 6' },
            { label: '7', type: 'mixer', desc: 'Loop 3 / Trk 7' },
            { label: '8', type: 'mixer', desc: 'Loop 4 / Trk 8' },
            { label: '9', type: 'mixer', desc: 'Loop 5' },
            { label: '0', type: 'mixer', desc: 'Loop 6' },
            { label: '-', type: 'none' },
            { label: '=', type: 'none' },
            { label: '⌫', size: 'lg', type: 'action', desc: 'Stop' },
        ],
        [
            { label: 'TAB', size: 'md', type: 'mixer', desc: 'Mode' },
            { label: 'Q', type: 'pad', desc: 'Pad 5' },
            { label: 'W', type: 'pad', desc: 'Pad 6' },
            { label: 'E', type: 'pad', desc: 'Pad 7' },
            { label: 'R', type: 'pad', desc: 'Pad 8' },
            { label: 'T', type: 'global', desc: 'Scene 1' },
            { label: 'Y', type: 'none' },
            { label: 'U', type: 'mixer', desc: 'Vol' },
            { label: 'I', type: 'mixer', desc: 'Pan' },
            { label: 'O', type: 'mixer', desc: 'Snd A' },
            { label: 'P', type: 'mixer', desc: 'Snd B' },
            { label: '[', type: 'mixer', desc: 'Prev' },
            { label: ']', type: 'mixer', desc: 'Next' },
            { label: '\\', size: 'md', type: 'none' },
        ],
        [
            { label: 'CAPS', size: 'lg', type: 'none' },
            { label: 'A', type: 'pad', desc: 'Pad 9' },
            { label: 'S', type: 'pad', desc: 'Pad 10' },
            { label: 'D', type: 'pad', desc: 'Pad 11' },
            { label: 'F', type: 'pad', desc: 'Pad 12' },
            { label: 'G', type: 'global', desc: 'Scene 2' },
            { label: 'H', type: 'none' },
            { label: 'J', type: 'mixer', desc: 'Mute' },
            { label: 'K', type: 'mixer', desc: 'Solo' },
            { label: 'L', type: 'mixer', desc: 'Clear' },
            { label: ';', type: 'mixer', desc: 'Stop' },
            { label: "'", type: 'none' },
            { label: 'ENTER', size: 'lg', type: 'action', desc: 'Rec' },
        ],
        [
            { label: 'SHIFT', size: 'xl', type: 'global', desc: 'Edit' },
            { label: 'Z', type: 'pad', desc: 'Pad 13' },
            { label: 'X', type: 'pad', desc: 'Pad 14' },
            { label: 'C', type: 'pad', desc: 'Pad 15' },
            { label: 'V', type: 'pad', desc: 'Pad 16' },
            { label: 'B', type: 'global', desc: 'Scene 3' },
            { label: 'N', type: 'none' },
            { label: 'M', type: 'mixer', desc: 'Mute' },
            { label: ',', type: 'none' },
            { label: '.', type: 'none' },
            { label: '/', type: 'none' },
            { label: 'SHIFT', size: 'xl', type: 'none' }
        ],
        [
            { label: 'SPACE', size: 'xl', type: 'action', desc: 'Play / Stop', width: '300px' }, // Special width
            { label: '←', type: 'global', desc: 'Bank' },
            { label: '↑ / ↓', type: 'mixer', desc: 'Val' },
            { label: '→', type: 'global', desc: 'Bank' },
        ]
    ];

    return (
        <div className={styles.container}>
            {rows.map((row, rIdx) => (
                <div key={rIdx} className={styles.row}>
                    {row.map((k, kIdx) => (
                        <div
                            key={kIdx}
                            className={`${styles.key} ${styles[k.size || 'sm']} ${styles[k.type]}`}
                            style={k.width ? { width: k.width } : {}}
                        >
                            <span className={styles.keyLabel}>{k.label}</span>
                            {k.desc && (
                                <div className={styles.keyDesc}>
                                    {Array.isArray(k.desc)
                                        ? k.desc.map((line, i) => <div key={i}>{line}</div>)
                                        : k.desc.split('/').map((line, i) => <div key={i}>{line.trim()}</div>)
                                    }
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ))}

            <div className={styles.legend}>
                <div className={styles.legendItem}>
                    <div className={styles.dot} style={{ background: 'var(--color-accent-primary)' }}></div>
                    <span>Pads</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={styles.dot} style={{ background: '#cc66ff' }}></div>
                    <span>Mixer / Loop</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={styles.dot} style={{ background: '#76ff03' }}></div>
                    <span>Scenes / Global</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={styles.dot} style={{ background: '#ff5555' }}></div>
                    <span>Action</span>
                </div>
            </div>
        </div>
    );
};

export default KeyboardMap;
