import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Grid from './components/Launchpad/Grid';
import useStore from './store/useStore';
import { audioEngine } from './audio/AudioEngine';
import { instrumentManager } from './audio/InstrumentManager'; // Import InstrumentManager
import VirtualPiano from './components/Instruments/VirtualPiano'; // Import VirtualPiano
import VirtualDrums from './components/Instruments/VirtualDrums'; // Import VirtualDrums
import { getCurrentUser, loginURL, devLoginURL, logout } from './api/auth';
import { getPresets, savePreset } from './api/presets';
import { useUserPreferences } from './hooks/useUserPreferences';
import LeftSidebar from './components/Layout/LeftSidebar';
import RightSidebar from './components/Layout/RightSidebar';
import BackgroundVisualizer from './components/Visualizer/BackgroundVisualizer';
import CustomDropdown from './components/UI/CustomDropdown';
import PresetManagerModal from './components/Presets/PresetManagerModal';
import SettingsModal from './components/Settings/SettingsModal';
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Mixer State selectors removed from App to prevent re-renders
  // They are now in AudioController

  const [tempPresets, setTempPresets] = React.useState([]);

  // useEffect for User/Presets (Kept)
  useEffect(() => {
    getCurrentUser().then(userData => {
      if (userData) {
        setUser(userData);
        fetchPresets();
        // Load user preferences when user is logged in
        loadPreferences();
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
              originalName: mapping.Asset ? mapping.Asset.originalName : null,
              // 향후 확장: 새 필드 지원 가능
              // type: mapping.type,
              // note: mapping.note,
              // synthSettings: mapping.synthSettings ? JSON.parse(mapping.synthSettings) : null
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
        note: p.note || null,
        assetId: p.assetId || null,
        synthSettings: p.type === 'synth' && p.synthSettings ? p.synthSettings : null
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
        settings: globalSettings, // Send global settings (mixerLevels, effects, theme, etc.)
        // Optional: masterVolume and isQuantized can be included if needed
        // masterVolume: useStore.getState().masterVolume || 0.7,
        // isQuantized: useStore.getState().launchQuantization !== 'none'
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
                      visualizerMode={currentTheme.visualizerMode || 'default'}
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

                    {/* BPM Control */}
                    <div className="glass-input-group" style={{ gap: '0' }}>
                      <label className="glass-label" style={{ marginRight: '8px' }}>BPM</label>

                      <button
                        onClick={() => setBpm(Math.max(20, bpm - 1))}
                        className="glass-btn"
                        style={{ padding: '2px 8px', borderRadius: '4px 0 0 4px', borderRight: 'none', background: 'rgba(255,255,255,0.05)' }}
                      >-</button>

                      <input
                        type="number"
                        value={bpm}
                        onChange={(e) => setBpm(parseInt(e.target.value) || 120)}
                        className="glass-input"
                        style={{ borderRadius: '0', width: '40px', borderLeft: 'none', borderRight: 'none' }}
                      />

                      <button
                        onClick={() => setBpm(Math.min(300, bpm + 1))}
                        className="glass-btn"
                        style={{ padding: '2px 8px', borderRadius: '0 4px 4px 0', borderLeft: 'none', background: 'rgba(255,255,255,0.05)' }}
                      >+</button>
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
                      options={THEMES.map(t => ({ label: t.name, value: t.id }))}
                      icon="🎨"
                    />

                    {/* BG Upload */}
                    <input type="file" accept="image/*" style={{ display: 'none' }} id="bg-upload"
                      onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          const formData = new FormData();
                          formData.append('file', file);
                          formData.append('category', 'background');
                          try {
                            const response = await fetch('http://localhost:3001/upload', { method: 'POST', body: formData });
                            const data = await response.json();
                            if (data.file) {
                              const timestamp = Date.now();
                              useStore.getState().setCustomBackgroundImage(`http://localhost:3001/uploads/${data.file.filename}?t=${timestamp}`);
                              // alert('Background Set!'); // Visual feedback via image change is enough
                            }
                          } catch (err) { alert('Upload Failed'); }
                          e.target.value = '';
                        }
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <label htmlFor="bg-upload" className="glass-btn" style={{ padding: '6px 12px' }} title="Upload Background Image">
                        🖼️ BG
                      </label>
                      {customBackgroundImage && (
                        <button
                          onClick={() => useStore.getState().setCustomBackgroundImage(null)}
                          className="glass-btn"
                          style={{ padding: '6px 8px', color: '#ff5555', borderColor: '#ff5555' }}
                          title="Remove Background"
                        >
                          ✕
                        </button>
                      )}
                    </div>
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

                    {/* Community Link */}
                    <Link
                      to="/community"
                      className="glass-btn"
                      style={{ minWidth: '120px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', textDecoration: 'none', color: 'inherit' }}
                    >
                      💬 Community
                    </Link>

                    {/* Settings Button */}
                    <button
                      onClick={() => setIsSettingsOpen(true)}
                      className="glass-btn"
                      style={{ minWidth: '100px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      ⚙️ Settings
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

              {/* (Duplicate Header Block Removed) */}

              {/* ... central grid ... */}
              <div style={{ position: 'relative', zIndex: 20 }}>
                <Grid />

                {/* Preset Manager Modal */}
                {isPresetManagerOpen && <PresetManagerModal onClose={() => setIsPresetManagerOpen(false)} />}

                {/* Settings Modal */}
                {isSettingsOpen && <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />}
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
