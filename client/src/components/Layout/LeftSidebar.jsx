import React from 'react';
import SoundLibrary from '../Audio/SoundLibrary';

const LeftSidebar = () => {
    return (
        <div style={{
            width: '280px',
            height: '100vh',
            background: 'rgba(12, 12, 12, 0.95)',
            borderRight: '1px solid #333',
            padding: '20px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            zIndex: 10
        }}>
            {/* Header / Title if needed */}
            <h2 style={{ margin: '0 0 15px 0', color: '#fff', letterSpacing: '1px', fontSize: '1rem' }}>SOUND LIBRARY</h2>

            {/* Library Content */}
            <div style={{ flex: 1 }}>
                <SoundLibrary />
            </div>
        </div>
    );
};

export default LeftSidebar;
