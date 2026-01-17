import React from 'react';

const RightSidebar = () => {
    return (
        <aside style={{
            width: '80px',
            background: 'rgba(17, 17, 17, 0.6)',
            backdropFilter: 'blur(20px)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 10,
            padding: '20px 0',
            color: '#888',
            boxShadow: '-4px 0 20px rgba(0,0,0,0.3)'
        }}>
            {/* Placeholder for future tools/mixer */}
            <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '2px', cursor: 'default' }}>
                SIDEBAR
            </div>
        </aside>
    );
};

export default RightSidebar;
