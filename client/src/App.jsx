import React, { useEffect } from 'react';
import Grid from './components/Launchpad/Grid';
import useStore from './store/useStore';
import { audioEngine } from './audio/AudioEngine';
import { getCurrentUser, loginURL, devLoginURL, logout } from './api/auth';
import { getPresets, savePreset } from './api/presets';
import TransportControls from './components/Transport/TransportControls';
import SynthControls from './components/Synth/SynthControls';
import PadSettingsModal from './components/Settings/PadSettingsModal';
import TrackList from './components/Mixer/TrackList';
import './App.css';

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
      console.error(e);
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
              // sampler.loadSample(padId, fileUrl); // Assuming sampler is globally available or imported in Pad/Store
              // We need to trigger load in sampler. Ideally store update triggers it or we assume Pad component handles it?
              // The Load Preset logic in previous step had sampler.loadSample(padId, fileUrl); import. 
              // We should duplicate that import here or accessible.
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
      // Fallback: Try to force entry if it was just a logic error, 
      // but risky if audio context is dead.
      // setAudioContextReady(true); 
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
      {!isAudioContextReady ? (
        <div className="overlay">
          <div className="welcome-modal">
            <h1>Web DAW & Launchpad</h1>
            <p>Click anywhere to start the Audio Engine</p>
            <button onClick={handleStart} className="start-btn">Start</button>
          </div>
        </div>
      ) : (
        <main className="main-interface">
          <header>
            <h1>YEEZY LOOP STATION</h1>
            <div className="controls">
              {user ? (
                <div className="user-info">
                  <span>{user.nickname}</span>
                  <select onChange={handleLoad} defaultValue="">
                    <option value="" disabled>Load Preset...</option>
                    {tempPresets.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                  <button onClick={handleSave}>Save</button>
                  <button onClick={handleLogout}>Logout</button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={handleLogin} className="login-btn">Login with Google</button>
                  <button onClick={() => window.location.href = devLoginURL} className="login-btn" style={{ background: '#555' }}>Dev Login</button>
                </div>
              )}
            </div>

            <div className="transport-section">
              <TransportControls />
              <div style={{ marginTop: '10px' }}>
                <SynthControls />
              </div>
            </div>
          </header>

          <div className="workspace-container" style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', justifyContent: 'center', width: '100%' }}>
            <TrackList />
            <Grid />
          </div>

          <PadSettingsModal />
        </main>
      )}
    </div>
  );
}

export default App;
