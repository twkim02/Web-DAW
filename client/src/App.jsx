import React, { useEffect } from 'react';
import Grid from './components/Launchpad/Grid';
import useStore from './store/useStore';
import { audioEngine } from './audio/AudioEngine';
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
        <React.Suspense fallback={null}>
          <BackgroundVisualizer />
        </React.Suspense>

        {!isAudioContextReady ? (
          <div className="overlay">
            <div className="welcome-modal">
              <h1>Web Loop Station</h1>
              <p>Ready to jam?</p>
              <button className="start-btn" onClick={handleStart}>START</button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
            <LeftSidebar />

            <main style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative'
            }}>
              {/* Header Controls (User/Preset) */}
              <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '10px', zIndex: 100 }}>
                {user ? (
                  <div style={{ display: 'flex', gap: '10px', background: '#222', padding: '5px', borderRadius: '4px', alignItems: 'center' }}>
                    <span style={{ color: '#aaa', fontSize: '0.8rem' }}>{user.nickname || user.username}</span>
                    <button onClick={handleSave}>Save</button>
                    <button onClick={handleLogout}>Logout</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="login-btn" onClick={handleLogin}>Login</button>
                    <button className="login-btn" style={{ background: '#555' }} onClick={() => window.location.href = devLoginURL}>Dev</button>
                  </div>
                )}

                <select onChange={handleLoad} defaultValue="" style={{ background: '#222', color: '#fff', border: '1px solid #444', padding: '5px', borderRadius: '4px' }}>
                  <option value="" disabled>Load Preset</option>
                  {tempPresets.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>

              <PadSettingsModal />
              <Grid />
            </main>

            <RightSidebar />
          </div>
        )}
      </ErrorBoundary>
    </div>
  );
}

export default App;
