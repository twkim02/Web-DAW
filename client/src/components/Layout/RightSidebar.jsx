import React from 'react';

const RightSidebar = () => {
    return (
        <aside style={{
            width: '50px',
            background: '#1a1a1a',
            borderLeft: '1px solid #333',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 10,
            padding: '20px 0',
            color: '#444'
        }}>
            {/* Placeholder for future tools/mixer */}
            <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '2px', cursor: 'default' }}>
                SIDEBAR
            </div>
        </aside>
    );
};

export default RightSidebar;
