import React, { useState } from 'react';
import useStore from '../../store/useStore';
import FileLibrary from '../Audio/FileLibrary';
import SynthLibrary from '../Audio/SynthLibrary';
import InstrumentLibrary from '../Audio/InstrumentLibrary';
import RecordingLibrary from '../Audio/RecordingLibrary';

const LeftSidebar = () => {
    const [activeTab, setActiveTab] = useState('files');

    const renderContent = () => {
        switch (activeTab) {
            case 'files': return <FileLibrary />;
            case 'synth': return <SynthLibrary />;
            case 'inst': return <InstrumentLibrary />;
            case 'rec': return <RecordingLibrary />;
            default: return <FileLibrary />;
        }
    };

    const toggleLeft = useStore(state => state.toggleLeftSidebar);
    const isOpen = useStore(state => state.isLeftSidebarOpen);

    return (
        <aside style={{
            width: '280px',
            height: '100%',
            background: 'rgba(17, 17, 17, 0.6)',
            backdropFilter: 'blur(20px)',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 200,
            overflow: 'visible', // Visible to show the handle sticking out
            boxShadow: isOpen ? '4px 0 20px rgba(0,0,0,0.3)' : 'none',
            position: 'absolute', // Absolute to slide over
            left: 0, top: 0,
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // Smooth ease
            transform: isOpen ? 'translateX(0)' : 'translateX(-100%)'
        }}>
            {/* Side Toggle Handle */}
            <div
                onClick={toggleLeft}
                style={{
                    position: 'absolute',
                    top: '50%',
                    right: '-12px', // Stick out
                    transform: 'translateY(-50%)',
                    width: '12px',
                    height: '60px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderTopRightRadius: '4px',
                    borderBottomRightRadius: '4px',
                    borderRight: '1px solid rgba(255,255,255,0.2)', // Border on right side now
                    borderTop: '1px solid rgba(255,255,255,0.1)',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    cursor: 'pointer',
                    zIndex: 201,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: '10px',
                    userSelect: 'none',
                    backdropFilter: 'blur(5px)'
                }}
                title={isOpen ? "Collapse Sidebar" : "Open Sidebar"}
                onMouseOver={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                    e.currentTarget.style.color = '#fff';
                }}
                onMouseOut={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                }}
            >
                {isOpen ? '◀' : '▶'}
            </div>
            {/* Tab Bar */}
            <div style={{
                display: 'flex',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.2)'
            }}>
                <TabButton
                    icon="📁"
                    isActive={activeTab === 'files'}
                    onClick={() => setActiveTab('files')}
                    title="Files"
                />
                <TabButton
                    icon="🎹"
                    isActive={activeTab === 'synth'}
                    onClick={() => setActiveTab('synth')}
                    title="Synths"
                />
                <TabButton
                    icon="🎻"
                    isActive={activeTab === 'inst'}
                    onClick={() => setActiveTab('inst')}
                    title="Instruments"
                />
                <TabButton
                    icon="🎤"
                    isActive={activeTab === 'rec'}
                    onClick={() => setActiveTab('rec')}
                    title="Record"
                />
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, overflow: 'hidden' }}>
                {renderContent()}
            </div>
        </aside>
    );
};

const TabButton = ({ icon, isActive, onClick, title }) => (
    <button
        onClick={onClick}
        title={title}
        style={{
            flex: 1,
            background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
            border: 'none',
            borderBottom: isActive ? '2px solid #00ffcc' : '2px solid transparent',
            color: isActive ? '#fff' : '#666',
            padding: '10px 0',
            fontSize: '1.2rem',
            cursor: 'pointer',
            transition: 'all 0.2s',
            outline: 'none'
        }}
    >
        {icon}
    </button>
);

export default LeftSidebar;
