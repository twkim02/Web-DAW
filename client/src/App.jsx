import React, { useEffect, useState } from 'react';
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
import BackgroundVisualizer from './components/Visualizer/BackgroundVisualizer';
import CustomDropdown from './components/UI/CustomDropdown';
import PresetManagerModal from './components/Presets/PresetManagerModal';
import { THEMES } from './constants/themes';
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

import AudioController from './components/Audio/AudioController'; // Import it

// ... (other imports)

function App() {
  const isAudioContextReady = useStore((state) => state.isAudioContextReady);
  const setAudioContextReady = useStore((state) => state.setAudioContextReady);
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const padMappings = useStore((state) => state.padMappings);
  const bpm = useStore((state) => state.bpm);
  const setBpm = useStore((state) => state.setBpm);

  // Hoisted state selectors
  const playingPadId = useStore((state) => state.playingPadId);
  const previewMode = useStore((state) => state.previewMode);
  const isMetronomeOn = useStore((state) => state.isMetronomeOn);
  const launchQuantization = useStore((state) => state.launchQuantization);
  const setLaunchQuantization = useStore((state) => state.setLaunchQuantization);
  const setIsMetronomeOn = useStore((state) => state.setIsMetronomeOn);
  const setIsInstructionOpen = useStore((state) => state.setIsInstructionOpen);
  // Live Mode
  const isLiveMode = useStore((state) => state.isLiveMode);
  const toggleLiveMode = useStore((state) => state.toggleLiveMode);
  // Loop State
  const isLoopRecording = useStore((state) => state.isLoopRecording);
  // Theme Hooks
  const currentThemeId = useStore((state) => state.currentThemeId);
  const currentTheme = THEMES.find(t => t.id === currentThemeId) || THEMES[0];
  const customBackgroundImage = useStore((state) => state.customBackgroundImage);

  // Sidebar Visibility Selectors
  const isLeftSidebarOpen = useStore((state) => state.isLeftSidebarOpen);
  const isRightSidebarOpen = useStore((state) => state.isRightSidebarOpen);

  const [showVisualizer, setShowVisualizer] = React.useState(true); // Default ON
  const [isHeaderVisible, setIsHeaderVisible] = React.useState(true); // Header Toggle State
  const [isPresetManagerOpen, setIsPresetManagerOpen] = useState(false);

  // Mixer State selectors removed from App to prevent re-renders
  // They are now in AudioController

  const [tempPresets, setTempPresets] = React.useState([]);

  // useEffect for User/Presets (Kept)
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

  const loadPresetData = async (presetId) => {
    if (!presetId) return;

    try {
      const token = localStorage.getItem('token');
      // Fetch full preset data securely
      const res = await fetch(`http://localhost:3001/presets/${presetId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch preset');

      const preset = await res.json();
      console.log('Loaded preset:', preset);

      // 1. Load BPM
      if (preset.bpm) setBpm(preset.bpm);

      // 2. Load Global Settings
      if (preset.settings) {
        const s = preset.settings;
        if (s.mixerLevels) useStore.setState({ mixerLevels: s.mixerLevels });
        if (s.trackStates) useStore.setState({ trackStates: s.trackStates });
        if (s.effects) useStore.setState({ effects: s.effects });
        if (s.launchQuantization) setLaunchQuantization(s.launchQuantization);
        if (s.customBackgroundImage) useStore.getState().setCustomBackgroundImage(s.customBackgroundImage);
        if (s.currentThemeId) useStore.getState().setThemeId(s.currentThemeId);
      }

      // 3. Load Mappings
      if (preset.KeyMappings) {
        // Clear existing mappings first (optional, or just overwrite)
        for (let i = 0; i < 64; i++) useStore.getState().resetPad(i);

        preset.KeyMappings.forEach(mapping => {
          const padId = parseInt(mapping.keyChar); // Assuming keyChar stored the ID

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
              type: mapping.type,
              note: mapping.note || 'C4',
              assetId: mapping.Asset ? mapping.Asset.id : null,
              originalName: mapping.Asset ? mapping.Asset.originalName : null
            };

            useStore.getState().updatePadMapping(padId, newMapping);
          }
        });
        // Refresh Library UI
        useStore.getState().triggerLibraryRefresh();
      }
      alert(`Loaded: ${preset.title}`);
    } catch (e) {
      console.error(e);
      alert('Failed to load preset');
    }
  };

  // Listen for Custom Event from PresetManagerModal
  useEffect(() => {
    const handleLoadEvent = (e) => loadPresetData(e.detail);
    window.addEventListener('loadPreset', handleLoadEvent);
    return () => window.removeEventListener('loadPreset', handleLoadEvent);
  }, []); // Empty dependency array ok here, or depend on store if needed for refreshes

  const handleStart = async () => {
    try {
      // 1. Explicitly start Tone.js context
      await import('tone').then(t => t.start());

      // 2. Initialize Audio Engine (synths, etc.)
      await audioEngine.init();

      // 3. Update State
      setAudioContextReady(true);

    } catch (e) {
      console.error('[App] Start Error:', e);
      alert('Error starting Audio Engine: ' + (e.message || e));
    }
  };

  // Spacebar to Toggle Live Mode
  // Note: We must prevent default scrolling behavior if necessary, 
  // but allow text inputs to function normally.
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        const activeTag = document.activeElement.tagName.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
          return; // Ignore if typing
        }

        // Check for Blocking Modals (Preview Mode or Playing Pad)
        const state = useStore.getState();
        if (state.previewMode.isOpen || state.playingPadId !== null) return;

        e.preventDefault(); // Prevent scroll
        toggleLiveMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleLiveMode]);

  const handleLogin = () => {
    window.location.href = loginURL;
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  const handleSave = async () => {
    if (!user) return alert('Please login to save');

    let title = prompt('Enter preset name:');
    if (!title) return;

    const mappings = padMappings
      .filter(p => p.file || p.type) // Capture only active pads
      .map(p => ({
        keyChar: String(p.id),
        mode: p.mode,
        volume: p.volume,
        type: p.type,
        assetId: p.assetId
      }));

    // Capture Full State
    const globalSettings = {
      mixerLevels: useStore.getState().mixerLevels,
      trackStates: useStore.getState().trackStates,
      effects: useStore.getState().effects,
      launchQuantization: useStore.getState().launchQuantization,
      currentThemeId: useStore.getState().currentThemeId,
      customBackgroundImage: useStore.getState().customBackgroundImage
    };

    try {
      await savePreset({
        title,
        bpm,
        mappings,
        settings: globalSettings // Send new settings
      });
      alert('Saved!');
      fetchPresets(); // Refresh list
    } catch (e) {
      console.error(e);
      alert('Failed to save: ' + (e.response?.data?.message || e.message));
    }
  };

  // RENDER
  return (
    <div className="App">
      {/* Audio Controller: Syncs Store -> AudioEngine without re-rendering App UI */}
      <AudioController />

      <ErrorBoundary>
        {!isAudioContextReady ? (
          // ... (Welcome Modal)
          <div className="overlay">
            <div className="welcome-modal">
              <h1>Web Loop Station</h1>
              <p>Ready to jam?</p>
              <button className="start-btn" onClick={handleStart}>START</button>
            </div>
          </div>
        ) : (
          // ... (Main Layout)
          <div style={{ position: 'relative', width: '100%', height: '100vh', overflow: 'hidden', display: 'flex' }}>
            {/* ... Sidebars ... */}

            {/* 1. Left Sidebar (Absolute overlay) - Hidden in Live Mode */}
            {!isLiveMode && <LeftSidebar />}

            {/* 2. Main Content (Flex Grow) */}
            <main style={{
              flex: 1,
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 10
            }}>
              {/* ... content */}
              {/* Dynamic Theme Visualizer (zIndex: 1) */}
              {showVisualizer && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}>
                  <React.Suspense fallback={null}>
                    <BackgroundVisualizer
                      themeType={customBackgroundImage ? 'static' : currentTheme.type}
                      primaryColor={currentTheme.primaryColor}
                    />
                  </React.Suspense>
                </div>
              )}

              {/* Custom Background Layer (zIndex: 0) */}
              {customBackgroundImage && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  backgroundImage: `url(${customBackgroundImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  zIndex: 0
                }} />
              )}

              {/* Static Theme Background (zIndex: -1) */}
              {!customBackgroundImage && currentTheme.type !== 'dynamic' && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  background: currentTheme.background,
                  zIndex: -1
                }} />
              )}

              {/* --- HEADER TOGGLE BUTTON (Hidden in Live Mode) --- */}
              {!isLiveMode && (
                <button
                  onClick={() => setIsHeaderVisible(!isHeaderVisible)}
                  className="header-toggle-btn"
                  title={isHeaderVisible ? "Hide Header" : "Show Header"}
                >
                  {isHeaderVisible ? '▲' : '▼'}
                </button>
              )}

              {/* --- HEADER CONTENT --- */}
              {isHeaderVisible && !isLiveMode && (
                <div className="header-panel">

                  {/* Top Row: Audio Controls & Visuals */}
                  <div className="header-row">

                    {/* Visualizer Toggle */}
                    <button onClick={() => setShowVisualizer(!showVisualizer)}
                      className={`glass-btn ${showVisualizer ? 'active' : ''}`}>
                      {showVisualizer ? 'VIS ON' : 'VIS OFF'}
                    </button>

                    <div className="header-divider"></div>

                    {/* BPM */}
                    <div className="glass-input-group">
                      <label className="glass-label">BPM</label>
                      <input type="number" value={bpm} onChange={(e) => setBpm(parseInt(e.target.value) || 120)}
                        className="glass-input" />
                    </div>

                    {/* Metronome */}
                    <button onClick={() => setIsMetronomeOn(!isMetronomeOn)}
                      className={`glass-btn ${isMetronomeOn ? 'active-metro' : ''}`}>
                      METRO
                    </button>



                    <div className="header-divider"></div>

                    {/* Theme Selector */}
                    <CustomDropdown
                      value={currentThemeId}
                      onChange={(val) => useStore.getState().setThemeId(val)}
                      options={[
                        { label: "🚀 Cosmic", value: "cosmic" },
                        { label: "🌃 Neon", value: "neon" },
                        { label: "🌿 Nature", value: "nature" },
                        { label: "⚫ Minimal", value: "minimal" },
                      ]}
                      icon="🎨"
                    />

                    {/* BG Upload */}
                    <input type="file" accept="image/*" style={{ display: 'none' }} id="bg-upload"
                      onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          const formData = new FormData();
                          formData.append('file', file);
                          try {
                            const response = await fetch('http://localhost:3001/upload', { method: 'POST', body: formData });
                            const data = await response.json();
                            if (data.file) {
                              useStore.getState().setCustomBackgroundImage(`http://localhost:3001/uploads/${data.file.filename}`);
                              alert('Background Set!');
                            }
                          } catch (err) { alert('Upload Failed'); }
                        }
                      }}
                    />
                    <label htmlFor="bg-upload" className="glass-btn" style={{ padding: '6px 12px' }}>
                      🖼️ BG
                    </label>
                  </div>

                  {/* Bottom Row: User & Presets */}
                  <div className="header-row" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>

                    {/* Help Button */}
                    <button
                      onClick={() => setIsInstructionOpen(true)}
                      className="glass-btn"
                      title="Keyboard Shortcuts"
                      style={{ marginRight: '10px', fontSize: '0.9rem' }}
                    >
                      ❔ Help
                    </button>

                    {/* Presets Manager Button */}
                    <button
                      onClick={() => setIsPresetManagerOpen(true)}
                      className="glass-btn"
                      style={{ minWidth: '120px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      📂 Presets
                    </button>

                    <div className="header-divider"></div>

                    {/* User Actions */}
                    {user ? (
                      <div className="user-badge">
                        <span className="user-name">👤 {user.nickname || user.username}</span>
                        <button onClick={handleSave} className="action-btn btn-save">Save</button>
                        <button onClick={handleLogout} className="action-btn btn-logout">Logout</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={handleLogin} className="action-btn btn-login">Login</button>
                        <button onClick={() => window.location.href = devLoginURL} className="action-btn btn-dev">Dev</button>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* --- HEADER CONTENT (Floating, Duplicate?) --- */}
              {/* Note: There seems to be a duplicate Header Content block in the original file. 
                  I will apply the !isLiveMode check to this one too just in case. */}
              {isHeaderVisible && !isLiveMode && (
                <div style={{
                  position: 'absolute', top: '50px', left: '50%', transform: 'translateX(-50%)',
                  display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center',
                  zIndex: 100,
                  width: '90%', maxWidth: '1000px',
                  background: 'rgba(10, 10, 10, 0.7)',
                  backdropFilter: 'blur(15px)',
                  padding: '15px 25px',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                }}>

                  {/* Top Row: Audio Controls & Visuals */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center', alignItems: 'center', width: '100%' }}>

                    {/* Visualizer Toggle */}
                    <button onClick={() => setShowVisualizer(!showVisualizer)}
                      style={{
                        background: showVisualizer ? 'rgba(0, 255, 204, 0.2)' : 'transparent',
                        border: showVisualizer ? '1px solid #00ffcc' : '1px solid rgba(255,255,255,0.1)',
                        color: showVisualizer ? '#00ffcc' : '#888',
                        padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', cursor: 'pointer'
                      }}>
                      {showVisualizer ? 'VIS ON' : 'VIS OFF'}
                    </button>

                    <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }}></div>

                    {/* BPM */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <label style={{ color: '#888', fontSize: '0.8rem', fontWeight: 'bold' }}>BPM</label>
                      <input type="number" value={bpm} onChange={(e) => setBpm(parseInt(e.target.value) || 120)}
                        style={{ background: 'transparent', border: 'none', color: '#00ffcc', width: '40px', textAlign: 'center', fontSize: '1rem', fontWeight: 'bold' }} />
                    </div>

                    {/* Metronome */}
                    <button onClick={() => setIsMetronomeOn(!isMetronomeOn)}
                      className={`glass-btn ${isMetronomeOn ? 'active-metro' : ''}`}>
                      METRO
                    </button>

                    <div className="header-divider"></div>

                    {/* Loop Controls */}
                    <button
                      onClick={() => isLoopRecording ? sequencer.stopRecording() : sequencer.startRecording()}
                      className={`glass-btn`}
                      style={{
                        borderColor: isLoopRecording ? '#ff4444' : 'rgba(255,255,255,0.1)',
                        color: isLoopRecording ? '#ff4444' : 'rgba(255,255,255,0.6)',
                        background: isLoopRecording ? 'rgba(255, 68, 68, 0.1)' : 'transparent',
                        boxShadow: isLoopRecording ? '0 0 10px rgba(255, 68, 68, 0.2)' : 'none'
                      }}
                    >
                      {isLoopRecording ? '🔴 REC' : '⚪ LOOP'}
                    </button>

                    <button
                      onClick={() => {
                        if (confirm('Clear all recorded loops?')) sequencer.clearSequence();
                      }}
                      className="glass-btn"
                      title="Clear All Loops"
                    >
                      ❌
                    </button>

                    {/* Quantize */}
                    <CustomDropdown
                      value={launchQuantization}
                      onChange={setLaunchQuantization}
                      options={[
                        { label: "Q: None", value: "none" },
                        { label: "Q: 1 Bar", value: "1m" },
                        { label: "Q: 1/4", value: "4n" },
                        { label: "Q: 1/8", value: "8n" },
                      ]}
                      icon="⏱️"
                      style={{ borderRadius: '20px' }}
                    />

                    <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }}></div>

                    {/* Theme Selector */}
                    <CustomDropdown
                      value={currentThemeId}
                      onChange={(val) => useStore.getState().setThemeId(val)}
                      options={[
                        { label: "🚀 Cosmic", value: "cosmic" },
                        { label: "🌃 Neon", value: "neon" },
                        { label: "🌿 Nature", value: "nature" },
                        { label: "⚫ Minimal", value: "minimal" },
                      ]}
                      icon="🎨"
                      style={{ borderRadius: '20px' }}
                    />

                    {/* BG Upload */}
                    {/* ... (existing bg upload code) ... */}
                    <input type="file" accept="image/*" style={{ display: 'none' }} id="bg-upload-float"
                      onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          const formData = new FormData();
                          formData.append('file', file);
                          try {
                            const response = await fetch('http://localhost:3001/upload', { method: 'POST', body: formData });
                            const data = await response.json();
                            if (data.file) {
                              useStore.getState().setCustomBackgroundImage(`http://localhost:3001/uploads/${data.file.filename}`);
                              alert('Background Set!');
                            }
                          } catch (err) { alert('Upload Failed'); }
                        }
                      }}
                    />
                    <label htmlFor="bg-upload-float" style={{
                      background: 'rgba(255,255,255,0.05)', color: '#aaa', padding: '6px 10px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '5px'
                    }}>
                      🖼️ BG
                    </label>
                  </div>

                  {/* Bottom Row: User & Presets */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', justifyContent: 'center', alignItems: 'center', width: '100%', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>

                    {/* Help Button */}
                    <button
                      onClick={() => setIsInstructionOpen(true)}
                      className="glass-btn"
                      title="Keyboard Shortcuts"
                      style={{ marginRight: '10px', fontSize: '0.9rem', borderRadius: '20px' }}
                    >
                      ❔ Help
                    </button>

                    {/* Presets Manager Button */}
                    <button
                      onClick={() => setIsPresetManagerOpen(true)}
                      className="glass-btn"
                      style={{ minWidth: '120px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      📂 Presets
                    </button>

                    <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)' }}></div>

                    {/* User Actions */}
                    {user ? (
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 'bold', marginRight: '5px' }}>👤 {user.nickname || user.username}</span>
                        <button onClick={handleSave} style={{ background: '#4CAF50', border: 'none', color: '#fff', borderRadius: '20px', padding: '6px 14px', cursor: 'pointer', fontSize: '0.8rem' }}>Save</button>
                        <button onClick={handleLogout} style={{ background: '#f44336', border: 'none', color: '#fff', borderRadius: '20px', padding: '6px 14px', cursor: 'pointer', fontSize: '0.8rem' }}>Logout</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={handleLogin} style={{ background: '#00ffcc', border: 'none', color: '#000', borderRadius: '20px', padding: '6px 16px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Login</button>
                        <button onClick={() => window.location.href = devLoginURL} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#ccc', borderRadius: '20px', padding: '6px 14px', cursor: 'pointer', fontSize: '0.8rem' }}>Dev</button>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* ... central grid ... */}
              <div style={{ position: 'relative', zIndex: 20 }}>
                <Grid />

                {/* Preset Manager Modal */}
                {isPresetManagerOpen && <PresetManagerModal onClose={() => setIsPresetManagerOpen(false)} />}
              </div>

            </main>

            {/* 3. Right Sidebar (Absolute overlay) - Hidden in Live Mode */}
            {/* 3. Right Sidebar (Absolute overlay) - Hidden in Live Mode via CSS in component if needed, but for now allow it */}
            <RightSidebar />

            {/* --- Modals (Root Level for High Z-Index) --- */}


            {/* Virtual Piano */}
            {playingPadId !== null && (
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000 }}>
                <VirtualPiano
                  padId={playingPadId}
                  instrumentManager={instrumentManager}
                  onClose={() => useStore.getState().setPlayingPadId(null)}
                />
              </div>
            )}

            {/* Preview Mode Piano/Drums */}
            {previewMode.isOpen && previewMode.type !== 'drums' && (
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000 }}>
                <VirtualPiano
                  previewMode={true}
                  type={previewMode.type}
                  preset={previewMode.preset}
                  instrumentManager={instrumentManager}
                  onClose={() => useStore.getState().setPreviewMode(false)}
                />
              </div>
            )}

            {previewMode.isOpen && previewMode.type === 'drums' && (
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000 }}>
                <VirtualDrums
                  previewMode={true}
                  type={previewMode.type}
                  preset={previewMode.preset}
                  instrumentManager={instrumentManager}
                  onClose={() => useStore.getState().setPreviewMode(false)}
                />
              </div>
            )}
          </div>
        )}
      </ErrorBoundary>
    </div>
  );
}

export default App;
