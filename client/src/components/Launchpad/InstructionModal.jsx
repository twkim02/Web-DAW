import React from 'react';
import useStore from '../../store/useStore';
import KeyboardMap from './KeyboardMap';
import styles from './InstructionModal.module.css';

const InstructionModal = () => {
    const isInstructionOpen = useStore((state) => state.isInstructionOpen);
    const setIsInstructionOpen = useStore((state) => state.setIsInstructionOpen);

    if (!isInstructionOpen) return null;

    return (
        <div className={styles.overlay} onClick={() => setIsInstructionOpen(false)}>
            <div className={styles.content} onClick={(e) => e.stopPropagation()}>

                <div className={styles.headerContainer}>
                    <h2 className={styles.title}>⌨️ Keyboard Shortcuts</h2>
                    <button
                        onClick={() => setIsInstructionOpen(false)}
                        className={styles.closeButton}
                    >✕</button>
                </div>

                {/* 1. Visual Keyboard Map */}
                <KeyboardMap />

                {/* 2. Detailed Lists */}
                <div className={styles.columnsContainer}>

                    {/* Column 1: Session & Global */}
                    <div className={styles.column}>
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>🎹 Pads & Session (Pads)</h3>
                            <div className={styles.row}><div className={styles.keyBadge}>1 ~ 4</div><span>Row 1 Pads</span></div>
                            <div className={styles.row}><div className={styles.keyBadge}>Q ~ R</div><span>Row 2 Pads</span></div>
                            <div className={styles.row}><div className={styles.keyBadge}>A ~ F</div><span>Row 3 Pads</span></div>
                            <div className={styles.row}><div className={styles.keyBadge}>Z ~ V</div><span>Row 4 Pads</span></div>
                            <div className={styles.row}><div className={styles.keyBadge}>T, G, B</div><span>Trigger Scene 1, 2, 3</span></div>
                            <div className={styles.row}><div className={styles.keyBadge}>Shift + Click</div><span>Edit Pad Settings</span></div>
                        </div>

                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>🌐 Global Controls (Action)</h3>
                            <div className={styles.row}><div className={styles.keyBadge}>Space</div><span>Toggle Live Mode</span></div>
                            <div className={styles.row}><div className={styles.keyBadge}>Esc</div><span>Close Modal / Zoom Out</span></div>
                            <div className={styles.row}><div className={styles.keyBadge}>Arrows</div><span>Navigate Banks (Left/Right/Up/Down)</span></div>
                        </div>
                    </div>

                    {/* Column 2: Mixer */}
                    <div className={styles.column}>
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>🎛️ Mixer Mode (Purple)</h3>
                            <div style={{ marginBottom: '15px', fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                                Hold <strong>TAB</strong> or Toggle with <strong>Tab</strong> to switch views.
                            </div>

                            <div className={styles.row}><div className={styles.keyBadge}>1 ~ 8</div><span>Select Track 1-8</span></div>
                            <div className={styles.row}><div className={styles.keyBadge}>↑ / ↓</div><span>Adjust Selected Value (Vol/Pan/Send)</span></div>

                            <div style={{ marginTop: '15px', fontWeight: '700', fontSize: '14px', color: 'var(--color-accent-secondary)', marginBottom: '8px' }}>Quick Modes</div>
                            <div className={styles.row}><div className={styles.keyBadge}>U, I, O, P</div><span>Volume, Pan, Send A, Send B</span></div>
                            <div className={styles.row}><div className={styles.keyBadge}>[   ]</div><span>Cycle Previous / Next Mode</span></div>

                            <div style={{ marginTop: '15px', fontWeight: '700', fontSize: '14px', color: 'var(--color-danger)', marginBottom: '8px' }}>Track Modifiers</div>
                            <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '8px' }}>Hold key + Press <strong>1-8</strong> or <strong>Pad</strong></div>

                            <div className={styles.row}>
                                <div className={styles.keyBadge} style={{ backgroundColor: '#e74c3c' }}>M</div>
                                <span><strong>Mute</strong> Track / Pad</span>
                            </div>
                            <div className={styles.row}>
                                <div className={styles.keyBadge} style={{ backgroundColor: '#f1c40f', color: '#333' }}>J</div>
                                <span><strong>Solo</strong> Track / Pad</span>
                            </div>
                            <div className={styles.row}>
                                <div className={styles.keyBadge} style={{ backgroundColor: '#e67e22' }}>K</div>
                                <span><strong>Stop</strong> Track / Pad</span>
                            </div>
                            <div className={styles.row}>
                                <div className={styles.keyBadge}>⌫</div>
                                <span><strong>Delete</strong> (Backspace or Alt)</span>
                            </div>

                            <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                                * Modifiers work with both Number Row (1-8) and Pad Grid.
                            </div>
                        </div>
                    </div>

                </div>

                <button
                    onClick={() => setIsInstructionOpen(false)}
                    className={styles.footerButton}
                >
                    Close Help
                </button>
            </div>
        </div >
    );
};

export default InstructionModal;
