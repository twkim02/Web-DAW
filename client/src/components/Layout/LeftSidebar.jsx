import React from 'react';
import SoundLibrary from '../Audio/SoundLibrary';

const LeftSidebar = () => {
    return (
        <aside style={{
            width: '280px',
            background: '#1a1a1a', // Dark background to match theme
            borderRight: '1px solid #333',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 10,
            overflow: 'hidden'
        }}>
            <SoundLibrary />
        </aside>
    );
};

export default LeftSidebar;
