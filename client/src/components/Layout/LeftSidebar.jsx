import React, { useState } from 'react';
import useStore from '../../store/useStore';
import FileLibrary from '../Audio/FileLibrary';
import SynthLibrary from '../Audio/SynthLibrary';
import InstrumentLibrary from '../Audio/InstrumentLibrary';
import RecordingLibrary from '../Audio/RecordingLibrary';
import BackgroundSelectionModal from '../Settings/BackgroundSelectionModal';

const LeftSidebar = () => {
    const [activeTab, setActiveTab] = useState('files');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false); // Modal state

    const renderContent = () => {
        switch (activeTab) {
            case 'files': return <FileLibrary category="sample" />;
            case 'synth': return <FileLibrary category="synth" />;
            case 'inst': return <FileLibrary category="instrument" />;
            case 'rec': return <RecordingLibrary />;
            case 'settings': return (
                <div style={{ padding: '20px', color: 'var(--color-text-primary)' }}>
                    <h3>Settings</h3>
                    <button
                        className="glass-btn"
                        style={{ width: '100%', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        onClick={() => setIsSettingsOpen(true)}
                    >
                        ⚙️ Open Settings
                    </button>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        Customize background, themes, and sound visualizers.
                    </p>
                </div>
            );
            default: return <FileLibrary category="sample" />;
        }
    };

    const toggleLeft = useStore(state => state.toggleLeftSidebar);
    const isOpen = useStore(state => state.isLeftSidebarOpen);

    return (
        <>
            <aside style={{
                width: '280px',
                height: '100%',
                background: 'var(--glass-bg-panel)',
                backdropFilter: 'var(--glass-blur-lg)',
                borderRight: 'var(--glass-border-medium)',
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
                        background: 'var(--glass-bg-strong)',
                        borderTopRightRadius: '4px',
                        borderBottomRightRadius: '4px',
                        borderRight: '1px solid rgba(255,255,255,0.2)', // Border on right side now
                        borderTop: 'var(--glass-border-medium)',
                        borderBottom: 'var(--glass-border-medium)',
                        cursor: 'pointer',
                        zIndex: 201,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: '10px',
                        userSelect: 'none',
                        backdropFilter: 'var(--glass-blur-sm)'
                    }}
                    title={isOpen ? "Collapse Sidebar" : "Open Sidebar"}
                    onMouseOver={e => {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                        e.currentTarget.style.color = '#fff';
                    }}
                    onMouseOut={e => {
                        e.currentTarget.style.background = 'var(--glass-bg-strong)';
                        e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                    }}
                >
                    {isOpen ? '◀' : '▶'}
                </div>
                {/* Tab Bar */}
                <div style={{
                    display: 'flex',
                    borderBottom: 'var(--glass-border-medium)',
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
                    <TabButton
                        icon="⚙️"
                        isActive={activeTab === 'settings'}
                        onClick={() => setActiveTab('settings')}
                        title="Settings"
                    />
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    {renderContent()}
                </div>
            </aside>
            {isSettingsOpen && <BackgroundSelectionModal onClose={() => setIsSettingsOpen(false)} />}
        </>
    );
};

const TabButton = ({ icon, isActive, onClick, title }) => (
    <button
        onClick={onClick}
        title={title}
        style={{
            flex: 1,
            background: isActive ? 'var(--glass-bg-strong)' : 'transparent',
            border: 'none',
            borderBottom: isActive ? '2px solid var(--color-accent-primary)' : '2px solid transparent',
            color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            padding: '10px 0',
            fontSize: '1.2rem',
            cursor: 'pointer',
            transition: 'var(--transition-fast)',
            outline: 'none'
        }}
    >
        {icon}
    </button>
);

export default LeftSidebar;
