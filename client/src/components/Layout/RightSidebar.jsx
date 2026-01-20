import React from 'react';
import styles from './RightSidebar.module.css';
import useStore from '../../store/useStore';
import PadSettingsPanel from '../Audio/PadSettingsPanel';
import GlobalEffectsPanel from '../Audio/GlobalEffectsPanel';

const RightSidebar = () => {
    const isOpen = useStore(state => state.isRightSidebarOpen);
    const view = useStore(state => state.rightSidebarView);

    return (
        <aside className={styles.rightSidebar} style={{
            position: 'fixed',
            top: 0,
            right: 0,
            height: '100vh',
            zIndex: 9999,
            transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: isOpen ? '-5px 0 15px rgba(0,0,0,0.5)' : 'none'
        }}>
            {/* Handle Removed */}

            <div className={styles.sidebarContent}>
                <div className={styles.section}>
                    {/* View Switching Logic */}
                    {view === 'global_fx' ? (
                        <GlobalEffectsPanel />
                    ) : (
                        isOpen && <PadSettingsPanel />
                    )}
                </div>
            </div>
        </aside>
    );
};

export default RightSidebar;
