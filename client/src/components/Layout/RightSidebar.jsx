import React from 'react';
import TransportControls from '../Transport/TransportControls';
import SynthControls from '../Synth/SynthControls';
import FXControls from '../Audio/FXControls';
import TrackList from '../Mixer/TrackList';

const RightSidebar = () => {
    return (
        <div style={{
            width: '320px',
            height: '100vh',
            background: 'rgba(17, 17, 17, 0.95)',
            borderLeft: '1px solid #333', // Border Left for right sidebar
            padding: '20px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            overflowY: 'auto',
            zIndex: 10
        }}>
            <h2 style={{ margin: '0 0 10px 0', color: '#fff', letterSpacing: '2px' }}>CONTROLS</h2>

            <section>
                <div style={sectionTitle}>TRANSPORT</div>
                <TransportControls />
            </section>

            <section>
                <div style={sectionTitle}>SYNTH</div>
                <SynthControls />
            </section>

            <section>
                <div style={sectionTitle}>EFFECTS</div>
                <FXControls />
            </section>

            <section style={{ flex: 1 }}>
                <div style={sectionTitle}>MIXER</div>
                <TrackList />
            </section>
        </div>
    );
};

const sectionTitle = {
    fontSize: '0.8rem',
    fontWeight: 'bold',
    color: '#666',
    marginBottom: '10px',
    borderBottom: '1px solid #333',
    paddingBottom: '4px'
};

export default RightSidebar;
