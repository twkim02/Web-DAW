import React, { useEffect } from 'react';
import Grid from './components/Launchpad/Grid';
import useStore from './store/useStore';
import { audioEngine } from './audio/AudioEngine';
import { instrumentManager } from './audio/InstrumentManager'; // Import InstrumentManager
import VirtualPiano from './components/Instruments/VirtualPiano'; // Import VirtualPiano
import VirtualDrums from './components/Instruments/VirtualDrums'; // Import VirtualDrums
import { getCurrentUser, loginURL, devLoginURL, logout } from './api/auth';
import { getPresets, savePreset } from './api/presets';
import LeftSidebar from './components/Layout/LeftSidebar';
import RightSidebar from './components/Layout/RightSidebar';
import PadSettingsModal from './components/Settings/PadSettingsModal';
import BackgroundVisualizer from './components/Visualizer/BackgroundVisualizer';
import './App.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, color: 'white', textAlign: 'center' }}>
          <h2>Something went wrong.</h2>
          <details style={{ whiteSpace: 'pre-wrap' }} open>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <button onClick={() => window.location.reload()} style={{ marginTop: 20, padding: 10 }}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const isAudioContextReady = useStore((state) => state.isAudioContextReady);
  const setAudioContextReady = useStore((state) => state.setAudioContextReady);
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const padMappings = useStore((state) => state.padMappings);
  const bpm = useStore((state) => state.bpm);

  // Hoisted state selectors (Must be at top level, not inside conditional render)
  const editingPadId = useStore((state) => state.editingPadId);
  const playingPadId = useStore((state) => state.playingPadId);
  const previewMode = useStore((state) => state.previewMode);

  const [tempPresets, setTempPresets] = React.useState([]);

  useEffect(() => {
    getCurrentUser().then(userData => {
      if (userData) {
        setUser(userData);
        fetchPresets();
      }
    });
  }, [setUser]);

  const fetchPresets = async () => {
    try {
      const data = await getPresets();
      setTempPresets(data);
    } catch (e) {
      // console.error(e);
    }
  };

  const handleLoad = async (e) => {
    const presetId = e.target.value;
    if (!presetId) return;

    try {
      const preset = await import('./api/presets').then(mod => mod.getPreset(presetId));
      console.log('Loaded preset:', preset);

      if (preset.KeyMappings) {
        preset.KeyMappings.forEach(mapping => {
          const padId = parseInt(mapping.keyChar);

          if (!isNaN(padId)) {
            let fileUrl = null;
            if (mapping.Asset) {
              fileUrl = `http://localhost:3001/uploads/${mapping.Asset.filename}`;
              import('./audio/Sampler').then(mod => mod.sampler.loadSample(padId, fileUrl));
            }

            const newMapping = {
              mode: mapping.mode,
              volume: mapping.volume,
              file: fileUrl,
              assetId: mapping.Asset ? mapping.Asset.id : null,
              originalName: mapping.Asset ? mapping.Asset.originalName : null
            };

            useStore.getState().updatePadMapping(padId, newMapping);
          }
        });
      }
      alert(`Loaded: ${preset.title}`);
    } catch (e) {
      console.error(e);
      alert('Failed to load preset');
    }
  };

  const handleStart = async () => {
    console.log('[App] handleStart clicked');
    try {
      // 1. Explicitly start Tone.js context from the user gesture event
      console.log('[App] Calling Tone.start() directly');
      await import('tone').then(t => t.start());
      console.log('[App] Tone.start() resolved');

      // 2. Initialize Audio Engine (synths, etc.)
      console.log('[App] Calling audioEngine.init()');
      await audioEngine.init();
      console.log('[App] audioEngine initialized');

      // 3. Update State
      setAudioContextReady(true);
      console.log('[App] setAudioContextReady(true) executed');

    } catch (e) {
      console.error('[App] Start Error:', e);
      alert('Error starting Audio Engine: ' + (e.message || e));
    }
  };

  const handleLogin = () => {
    window.location.href = loginURL;
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  const handleSave = async () => {
    if (!user) return alert('Please login to save');
    const title = prompt('Enter preset name:');
    if (!title) return;

    const mappings = padMappings.map(p => ({
      keyChar: String(p.id),
      mode: p.mode,
      volume: p.volume,
      assetId: p.assetId
    }));

    try {
      await savePreset({ title, bpm, mappings });
      alert('Saved!');
      fetchPresets();
    } catch (e) {
      alert('Failed to save');
    }
  };

  return (
    <div className="App">
      <ErrorBoundary>


        {!isAudioContextReady ? (
          <div className="overlay">
            <div className="welcome-modal">
              <h1>Web Loop Station</h1>
              <p>Ready to jam?</p>
              <button className="start-btn" onClick={handleStart}>START</button>
            </div>
          </div>
        ) : (
          <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', display: 'flex' }}>

            {/* 1. Left Sidebar (Static width) */}
            <LeftSidebar />

            {/* 2. Main Content (Flex Grow) */}
            <main style={{
              flex: 1,
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 10
            }}>
              <React.Suspense fallback={null}>
                <BackgroundVisualizer />
              </React.Suspense>

              {/* Header Controls (User/Preset) */}
              <div style={{ position: 'absolute', top: '20px', right: '40px', display: 'flex', gap: '10px', zIndex: 100 }}>
                {/* ... existing header controls ... */}
                {user ? (
                  <div style={{
                    display: 'flex', gap: '10px', alignItems: 'center',
                    background: 'rgba(17, 17, 17, 0.6)',
                    backdropFilter: 'blur(10px)',
                    padding: '6px 12px',
                    borderRadius: '30px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                  }}>
                    <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 'bold', marginRight: '5px' }}>{user.nickname || user.username}</span>

                    <button onClick={handleSave} style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                      borderRadius: '20px',
                      padding: '4px 12px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      transition: 'all 0.2s'
                    }}
                      onMouseOver={e => e.target.style.background = 'rgba(255,255,255,0.1)'}
                      onMouseOut={e => e.target.style.background = 'rgba(255,255,255,0.05)'}
                    >Save</button>

                    <button onClick={handleLogout} style={{
                      background: 'rgba(255, 50, 50, 0.1)',
                      border: '1px solid rgba(255, 50, 50, 0.2)',
                      color: '#ff8888',
                      borderRadius: '20px',
                      padding: '4px 12px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      transition: 'all 0.2s'
                    }}
                      onMouseOver={e => e.target.style.background = 'rgba(255, 50, 50, 0.2)'}
                      onMouseOut={e => e.target.style.background = 'rgba(255, 50, 50, 0.1)'}
                    >Logout</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={handleLogin} style={{
                      background: 'rgba(0, 255, 204, 0.1)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(0, 255, 204, 0.3)',
                      color: '#00ffcc',
                      borderRadius: '30px',
                      padding: '8px 20px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      transition: 'all 0.2s',
                      boxShadow: '0 0 15px rgba(0, 255, 204, 0.1)'
                    }}>Login</button>

                    <button onClick={() => window.location.href = devLoginURL} style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#aaa',
                      borderRadius: '30px',
                      padding: '8px 15px',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}>Dev</button>
                  </div>
                )}

                <select onChange={handleLoad} defaultValue="" style={{
                  background: 'rgba(17, 17, 17, 0.6)',
                  backdropFilter: 'blur(10px)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '6px 12px',
                  borderRadius: '30px',
                  outline: 'none',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}>
                  <option value="" disabled style={{ background: '#111' }}>Load Preset</option>
                  {tempPresets.map(p => (
                    <option key={p.id} value={p.id} style={{ background: '#111' }}>{p.title}</option>
                  ))}
                </select>
              </div>

              {/* Central Grid */}
              <Grid />

              {/* Modals & Overlays */}
              {editingPadId !== null && (
                <PadSettingsModal
                  padId={editingPadId}
                  onClose={() => useStore.getState().setEditingPadId(null)}
                />
              )}

              {playingPadId !== null && (
                <VirtualPiano
                  padId={playingPadId}
                  instrumentManager={instrumentManager}
                  onClose={() => useStore.getState().setPlayingPadId(null)}
                />
              )}

              {previewMode.isOpen && previewMode.type !== 'drums' && (
                <VirtualPiano
                  previewMode={true}
                  type={previewMode.type}
                  preset={previewMode.preset}
                  instrumentManager={instrumentManager}
                  onClose={() => useStore.getState().setPreviewMode(false)}
                />
              )}

              {previewMode.isOpen && previewMode.type === 'drums' && (
                <VirtualDrums
                  previewMode={true}
                  type={previewMode.type}
                  preset={previewMode.preset}
                  instrumentManager={instrumentManager}
                  onClose={() => useStore.getState().setPreviewMode(false)}
                />
              )}
            </main>

            {/* 3. Right Sidebar (Static width) */}
            <RightSidebar />
          </div>
        )
        }
      </ErrorBoundary >
    </div >
  );
}

export default App;
