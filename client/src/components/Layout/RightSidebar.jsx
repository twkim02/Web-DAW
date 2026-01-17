import React, { useState } from 'react';
import styles from './RightSidebar.module.css';
import EffectLibrary from '../Audio/EffectLibrary';
import useStore from '../../store/useStore';

const RightSidebar = () => {
    const toggleRight = useStore(state => state.toggleRightSidebar);
    const isOpen = useStore(state => state.isRightSidebarOpen);

    return (
        <aside className={styles.rightSidebar} style={{
            position: 'absolute',
            right: 0, top: 0, bottom: 0,
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
            overflow: 'visible', // Ensure handle is seen
            zIndex: 200,
            boxShadow: isOpen ? '-4px 0 20px rgba(0,0,0,0.3)' : 'none'
        }}>
            {/* Side Toggle Handle */}
            <div
                onClick={toggleRight}
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '-12px', // Stick out to left
                    transform: 'translateY(-50%)',
                    width: '12px', height: '60px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderTopLeftRadius: '4px',
                    borderBottomLeftRadius: '4px',
                    borderLeft: '1px solid rgba(255,255,255,0.2)',
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    zIndex: 201,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '10px',
                    userSelect: 'none',
                    backdropFilter: 'blur(5px)'
                }}
                title={isOpen ? "Collapse Sidebar" : "Open Sidebar"}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#fff'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
            >
                {isOpen ? '▶' : '◀'}
            </div>

            <div className={styles.sidebarContent}>
                <div className={styles.section}>
                    {/* Reuse SidebarTitle logic or just inline for now to match LeftSidebar vibe if needed, but using module class is better */}
                    {/* <div className={styles.sidebarTitle}>EFFECTS</div> */}
                    <EffectLibrary />
                </div>

                {/* Placeholder for future Master Bus / Limiter controls */}
                <div className={styles.section} style={{ marginTop: 'auto', opacity: 0.5 }}>
                    <div className={styles.sidebarTitle}>MASTER BUS</div>
                    <div style={{ fontSize: '0.8rem', color: '#888', textAlign: 'center', padding: '10px' }}>
                        Comp / Limiter (Coming Soon)
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default RightSidebar;
