import React from 'react';
import styles from './RightSidebar.module.css';
import useStore from '../../store/useStore';
import PadSettingsPanel from '../Audio/PadSettingsPanel';

const RightSidebar = () => {
    const isOpen = useStore(state => state.isRightSidebarOpen);
    const effects = useStore(state => state.effects);
    const setEffectParams = useStore(state => state.setEffectParams);

    // No local view state needed anymore
    // const view = useStore(state => state.rightSidebarView);


    return (
        <aside className={styles.rightSidebar} style={{
            position: 'fixed', // Changed from absolute to fixed
            top: 0,
            right: 0,
            height: '100vh', // Ensure full height
            zIndex: 9999, // Max z-index
            // ... (keep default styles)
            transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: isOpen ? '-5px 0 15px rgba(0,0,0,0.5)' : 'none'
        }}>
            {/* ... (Handle remains same) ... */}

            <div className={styles.sidebarContent}>

                {/* No Tabs - Direct Content */}

                <div className={styles.section}>
                    {isOpen && ( // Use internal check or just always render logic
                        // If we want to show 'Settings' only when editingPadId is set.
                        // But we removed the conditional in App.jsx.
                        // We can import useStore hook to check editingPadId here implicitly because PadSettingsPanel checks it.
                        // Let's modify PadSettingsPanel to render null if no id? It already does: returns "No Pad Selected".
                        // So just render it.
                        <PadSettingsPanel />
                    )}
                </div>

            </div>
        </aside>
    );
};

export default RightSidebar;
