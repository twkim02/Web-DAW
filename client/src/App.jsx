import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import client from './api/client';
import Grid from './components/Launchpad/Grid';
import useStore from './store/useStore';
import { audioEngine } from './audio/AudioEngine';
import { instrumentManager } from './audio/InstrumentManager'; // Import InstrumentManager
import VirtualPiano from './components/Instruments/VirtualPiano'; // Import VirtualPiano
import VirtualDrums from './components/Instruments/VirtualDrums'; // Import VirtualDrums
import { getCurrentUser, loginURL, devLoginURL, logout } from './api/auth';
import { getPresets, savePreset, getPreset, recordPresetAccess } from './api/presets';
import { useUserPreferences } from './hooks/useUserPreferences';
import LeftSidebar from './components/Layout/LeftSidebar';
import RightSidebar from './components/Layout/RightSidebar';
import Visualizer3D from './components/Visualizer/Visualizer3D';
import CustomDropdown from './components/UI/CustomDropdown';
import PresetManagerModal from './components/Presets/PresetManagerModal';
import TransportControls from './components/Transport/TransportControls'; // Import TransportControl
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
          <button onClick={() => window.location.reload()} style={{ marginTop: 20, padding: 10, background: 'var(--color-danger)', color: 'white', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
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
  const setPresets = useStore((state) => state.setPresets);
  const setCurrentPresetId = useStore((state) => state.setCurrentPresetId);
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
  const isInstructionOpen = useStore((state) => state.isInstructionOpen);
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

  const showVisualizer = useStore(state => state.showVisualizer);
  const visualizerMode = useStore(state => state.visualizerMode);

  // Store Setters for Preferences
  const setThemeId = useStore((state) => state.setThemeId);
  const setCustomBackgroundImage = useStore((state) => state.setCustomBackgroundImage);
  const setVisualizerMode = useStore((state) => state.setVisualizerMode);
  const setShowVisualizer = useStore((state) => state.setShowVisualizer);

  const [isHeaderVisible, setIsHeaderVisible] = React.useState(true); // Header Toggle State
  const [isPresetManagerOpen, setIsPresetManagerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // User Preferences Hook
  const { preferences, loadPreferences } = useUserPreferences();

  // Sync Preferences to Store
  useEffect(() => {
    if (preferences) {
      if (preferences.currentThemeId) setThemeId(preferences.currentThemeId);
      if (preferences.customBackgroundImage !== undefined) setCustomBackgroundImage(preferences.customBackgroundImage);
      if (preferences.visualizerMode) setVisualizerMode(preferences.visualizerMode);
      // Explicitly check for boolean or existence. If your API returns 'showVisualizer', handle it. 
      // Assuming preferences might contain it if saved previously, specifically for future proofing or if added to DB.
      // If not currently in DB schema, this is safe to keep or omit. Added for completeness based on plan.
      if (preferences.showVisualizer !== undefined) setShowVisualizer(preferences.showVisualizer);
    }
  }, [preferences, setThemeId, setCustomBackgroundImage, setVisualizerMode, setShowVisualizer]);

  // Mixer State selectors removed from App to prevent re-renders
  // They are now in AudioController



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
  }, [setUser, loadPreferences]);

  // Check if we should skip START page and auto-initialize audio context
  useEffect(() => {
    const skipStartPage = localStorage.getItem('skipStartPage');
    if (skipStartPage === 'true') {
      localStorage.removeItem('skipStartPage');

      // Auto-initialize audio context
      const initAudio = async () => {
        try {
          await import('tone').then(t => t.start());
          await audioEngine.init();
          // Always start Transport for immediate Playback/Looping
          await import('tone').then(t => {
            if (t.Transport.state !== 'started') t.Transport.start();
          });
          useStore.setState({ isPlaying: true });
          setAudioContextReady(true);
        } catch (err) {
          console.error('Failed to initialize audio context:', err);
        }
      };

      initAudio();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setAudioContextReady]);

  // ... (lines 165-351 skipped)

  const handleStart = async () => {
    try {
      await import('tone').then(t => t.start());
      await audioEngine.init();
      // Always start Transport for immediate Playback/Looping
      await import('tone').then(t => {
        if (t.Transport.state !== 'started') t.Transport.start();
      });
      useStore.setState({ isPlaying: true });
      setAudioContextReady(true);
    } catch (e) {
      console.error(e);
    }
  };

  // Spacebar Handler Delegated to Grid.jsx for Screen Recording Trigger


  const handleLogin = () => {
    // Google 로그인
    window.location.href = loginURL;
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      // 페이지 새로고침하여 상태 초기화
      window.location.reload();
    } catch (err) {
      console.error('Logout failed:', err);
      // 에러가 발생해도 사용자 상태는 초기화
      setUser(null);
      window.location.reload();
    }
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
        synthSettings: p.type === 'synth' && p.synthSettings ? p.synthSettings : null,
        color: p.color,
        image: p.image
      }));

    // Capture Full State
    const globalSettings = {
      mixerLevels: useStore.getState().mixerLevels,
      trackStates: useStore.getState().trackStates,
      effects: useStore.getState().effects,
      launchQuantization: useStore.getState().launchQuantization,
      currentThemeId: useStore.getState().currentThemeId,
      customBackgroundImage: useStore.getState().customBackgroundImage,
      visualizerMode: useStore.getState().visualizerMode,
      showVisualizer: useStore.getState().showVisualizer
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
              {/* Custom Background Layer (zIndex: 0) - Only show if Dynamic Background is OFF */}
              {customBackgroundImage && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  backgroundImage: `url(${customBackgroundImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  zIndex: 0
                }} />
              )}

              {/* Static Theme Background (zIndex: -1) - Only show if Custom is OFF */}
              {!customBackgroundImage && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  background: currentTheme.background,
                  zIndex: -1
                }} />
              )}

              {/* 3D Visualizer (Dynamic) - Enabled for all themes if showVisualizer is true */}
              {useStore.getState().showVisualizer !== false && (
                <Visualizer3D
                  primaryColor={currentTheme.primaryColor}
                  // If logic: Custom BG is 'effective' only if it exists AND dynamic is off
                  hasCustomBackground={!!customBackgroundImage && !(preferences?.dynamicBackground ?? true)}
                  mode={visualizerMode || currentTheme.visualizerMode || 'default'}
                  dynamicMode={preferences?.dynamicBackground ?? true}
                />
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

                  {/* Single Consolidated Row */}
                  <div className="header-row">

                    {/* Left Group: Transport Controls */}
                    <TransportControls />

                    {/* Right Group: Tools & User */}
                    <div className="header-right-group">

                      {/* Home */}
                      <Link
                        to="/"
                        className="glass-btn"
                      >
                        🏠 Home
                      </Link>

                      {/* Library (Left Sidebar) */}
                      <button
                        onClick={() => useStore.getState().toggleLeftSidebar()}
                        className={`glass-btn ${isLeftSidebarOpen ? 'active' : ''}`}
                      >
                        📂 Files
                      </button>

                      {/* Presets Manager */}
                      <button
                        onClick={() => setIsPresetManagerOpen(true)}
                        className={`glass-btn ${isPresetManagerOpen ? 'active' : ''}`}
                      >
                        🎹 Presets
                      </button>



                      {/* Help */}
                      <button
                        onClick={() => setIsInstructionOpen(!isInstructionOpen)}
                        className={`glass-btn ${isInstructionOpen ? 'active' : ''}`}
                        title="Keyboard Shortcuts"
                      >
                        ❔ Help
                      </button>

                      {/* Settings */}
                      <button
                        onClick={() => setIsSettingsOpen(true)}
                        className={`glass-btn ${isSettingsOpen ? 'active' : ''}`}
                        title="Settings"
                      >
                        ⚙️ Settings
                      </button>
                      <div className="header-divider"></div>

                      {/* User Actions */}
                      {user ? (
                        <div className="user-badge" style={{ marginLeft: 0 }}>
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
                </div >
              )
              }

              {/* (Duplicate Header Block Removed) */}

              {/* ... central grid ... */}
              <div style={{ position: 'relative', zIndex: 20 }}>
                <Grid />

                {/* Preset Manager Modal */}
                {isPresetManagerOpen && <PresetManagerModal onClose={() => setIsPresetManagerOpen(false)} />}

                {/* Settings Modal */}
                {isSettingsOpen && <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />}
              </div>

            </main >

            {/* 3. Right Sidebar (Absolute overlay) - Hidden in Live Mode */}
            {/* 3. Right Sidebar (Absolute overlay) - Hidden in Live Mode via CSS in component if needed, but for now allow it */}
            <RightSidebar />

            {/* --- Modals (Root Level for High Z-Index) --- */}


            {/* Virtual Piano */}
            {
              playingPadId !== null && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000 }}>
                  <VirtualPiano
                    padId={playingPadId}
                    instrumentManager={instrumentManager}
                    onClose={() => useStore.getState().setPlayingPadId(null)}
                  />
                </div>
              )
            }

            {/* Preview Mode Piano/Drums */}
            {
              previewMode.isOpen && previewMode.type !== 'drums' && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000 }}>
                  <VirtualPiano
                    previewMode={true}
                    type={previewMode.type}
                    preset={previewMode.preset}
                    instrumentManager={instrumentManager}
                    onClose={() => useStore.getState().setPreviewMode(false)}
                  />
                </div>
              )
            }

            {
              previewMode.isOpen && previewMode.type === 'drums' && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000 }}>
                  <VirtualDrums
                    previewMode={true}
                    type={previewMode.type}
                    preset={previewMode.preset}
                    instrumentManager={instrumentManager}
                    onClose={() => useStore.getState().setPreviewMode(false)}
                  />
                </div>
              )
            }
          </div >
        )}
      </ErrorBoundary >
    </div >
  );
}

export default App;
