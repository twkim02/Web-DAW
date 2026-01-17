import React, { useState } from 'react';
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

    return (
        <aside style={{
            width: '300px',
            background: 'rgba(17, 17, 17, 0.6)',
            backdropFilter: 'blur(20px)',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 10,
            overflow: 'hidden',
            boxShadow: '4px 0 20px rgba(0,0,0,0.3)'
        }}>
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
