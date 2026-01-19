import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Grid from './components/Launchpad/Grid';
import useStore from './store/useStore';
import { audioEngine } from './audio/AudioEngine';
import { instrumentManager } from './audio/InstrumentManager'; // Import InstrumentManager
import VirtualPiano from './components/Instruments/VirtualPiano'; // Import VirtualPiano
import VirtualDrums from './components/Instruments/VirtualDrums'; // Import VirtualDrums
import { getCurrentUser, loginURL, devLoginURL, logout } from './api/auth';
import { getPresets, savePreset, getPreset } from './api/presets';
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

  const [isHeaderVisible, setIsHeaderVisible] = React.useState(true); // Header Toggle State
  const [isPresetManagerOpen, setIsPresetManagerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // User Preferences Hook
  const { preferences, loadPreferences } = useUserPreferences();

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
          setAudioContextReady(true);
        } catch (err) {
          console.error('Failed to initialize audio context:', err);
        }
      };

      initAudio();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setAudioContextReady]);

  // Check for post ID or preset ID from community page (load after START button is clicked)
  useEffect(() => {
    const checkAndLoadPreset = async () => {
      const postId = localStorage.getItem('loadPostId');
      const presetId = localStorage.getItem('loadPresetId');

      if (isAudioContextReady) {
        if (postId) {
          // Post ID가 있으면 downloadPost API로 프리셋 데이터 가져오기
          localStorage.removeItem('loadPostId');
          setTimeout(async () => {
            try {
              const { downloadPost } = await import('./api/posts');
              const { getPresets, savePreset } = await import('./api/presets');
              const result = await downloadPost(parseInt(postId));

              if (result.post && result.post.Preset) {
                const originalPreset = result.post.Preset;

                // 로그인한 사용자인 경우, 해당 preset이 본인 계정에 있는지 확인
                const user = useStore.getState().user;
                if (user) {
                  try {
                    const myPresets = await getPresets();
                    // 본인 계정의 presets 목록에서 원본 presetId와 동일한 preset이 있는지 확인
                    const existingPreset = myPresets.find(p => p.id === originalPreset.id);

                    if (!existingPreset) {
                      // 본인 계정에 해당 preset이 없으면 복사본 생성
                      console.log('Creating copy of preset:', originalPreset.id);

                      // KeyMappings를 savePreset 형식으로 변환
                      const mappings = (originalPreset.KeyMappings || []).map(m => ({
                        keyChar: m.keyChar,
                        mode: m.mode,
                        volume: m.volume,
                        type: m.type || null,
                        note: m.note || null,
                        assetId: m.assetId || null,
                        synthSettings: m.synthSettings || null
                      }));

                      // 새 preset 생성
                      const newPreset = await savePreset({
                        title: originalPreset.title,
                        bpm: originalPreset.bpm,
                        masterVolume: originalPreset.masterVolume,
                        isQuantized: originalPreset.isQuantized,
                        settings: originalPreset.settings,
                        mappings: mappings
                      });

                      console.log('Created new preset:', newPreset.id);

                      // 새로 생성된 preset의 전체 데이터 가져오기 (KeyMappings 포함)
                      const { getPreset } = await import('./api/presets');
                      const fullNewPreset = await getPreset(newPreset.id);

                      // 새로 생성된 preset으로 로드
                      loadPresetFromData(fullNewPreset);

                      // presets 목록 새로고침
                      fetchPresets();
                    } else {
                      // 이미 본인 계정에 있으면 기존 preset으로 로드
                      loadPresetFromData(originalPreset);
                    }
                  } catch (err) {
                    console.error('Failed to check or copy preset:', err);
                    // 에러 발생 시 원본 프리셋으로 로드 시도
                    loadPresetFromData(originalPreset);
                  }
                } else {
                  // 로그인하지 않은 경우 원본 프리셋으로 로드
                  loadPresetFromData(originalPreset);
                }
              }
            } catch (err) {
              console.error('Failed to load preset from post:', err);
              alert('프리셋을 불러오는데 실패했습니다.');
            }
          }, 500);
        } else if (presetId) {
          // Preset ID가 있으면 직접 로드 (자신의 프리셋)
          localStorage.removeItem('loadPresetId');
          setTimeout(() => {
            loadPresetData(parseInt(presetId));
          }, 500);
        }
      }
    };

    checkAndLoadPreset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAudioContextReady]);

  const fetchPresets = async () => {
    try {
      const data = await getPresets();
      useStore.getState().setPresets(data);
    } catch (e) {
      // console.error(e);
    }
  };

  // 프리셋 데이터를 직접 로드하는 함수 (Post에서 가져온 데이터 또는 API로 가져온 데이터)
  const loadPresetFromData = (preset) => {
    if (!preset) return;

    try {
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
      alert(`Loaded: ${preset.title || 'Preset'}`);
    } catch (e) {
      console.error(e);
      alert('Failed to load preset');
    }
  };

  const loadPresetData = async (presetId) => {
    if (!presetId) return;

    try {
      // API 함수 사용 (세션 기반 인증 자동 처리) - 자신의 프리셋만 가능
      const preset = await getPreset(presetId);
      loadPresetFromData(preset);
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

  const handleStart = () => {
    // Community 페이지로 이동
    window.location.href = '/community';
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
              {/* Dynamic Theme Visualizer (Moved to Grid.jsx for layering) */}
              {/* Left here only for static wallpaper support if needed? 
                  BackgroundVisualizer contains ThreeVisualizer + Logic. 
                  Now Grid handles ThreeVisualizer directly. 
                  App should handle just the WALLPAPER (Static).
              */}

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

                  {/* Single Consolidated Row */}
                  <div className="header-row" style={{ justifyContent: 'space-between', width: '100%' }}>

                    {/* Left Group: Tempo & Metro */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      {/* BPM Control */}
                      <div className="glass-input-group" style={{ gap: '0' }}>
                        <label className="glass-label" style={{ marginRight: '8px' }}>BPM</label>
                        <button
                          onClick={() => setBpm(Math.max(20, bpm - 1))}
                          className="glass-btn"
                          style={{ padding: '2px 8px', borderRadius: '4px 0 0 4px', borderRight: 'none', background: 'var(--glass-bg-medium)' }}
                        >-</button>
                        <input
                          type="number"
                          value={bpm}
                          onChange={(e) => setBpm(parseInt(e.target.value) || 120)}
                          className="glass-input"
                          style={{ borderRadius: '0', width: '40px', borderLeft: 'none', borderRight: 'none', textAlign: 'center' }}
                        />
                        <button
                          onClick={() => setBpm(Math.min(300, bpm + 1))}
                          className="glass-btn"
                          style={{ padding: '2px 8px', borderRadius: '0 4px 4px 0', borderLeft: 'none', background: 'var(--glass-bg-medium)' }}
                        >+</button>
                      </div>

                      {/* Metronome */}
                      <button onClick={() => setIsMetronomeOn(!isMetronomeOn)}
                        className={`glass-btn ${isMetronomeOn ? 'active-metro' : ''}`}
                        style={{ minWidth: '70px' }}
                      >
                        METRO
                      </button>
                    </div>

                    {/* Right Group: Tools & User */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

                      {/* Help */}
                      <button
                        onClick={() => setIsInstructionOpen(!isInstructionOpen)}
                        className={`glass-btn ${isInstructionOpen ? 'active' : ''}`}
                        title="Keyboard Shortcuts"
                        style={{ fontSize: '0.9rem' }}
                      >
                        ❔ Help
                      </button>

                      {/* Presets */}
                      <button
                        onClick={() => setIsPresetManagerOpen(true)}
                        className="glass-btn"
                        style={{ borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 16px' }}
                      >
                        📂 Presets
                      </button>

                      {/* Community Link (Added from new-community) */}
                      <Link
                        to="/community"
                        className="glass-btn"
                        style={{ borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 16px', textDecoration: 'none', color: 'inherit' }}
                      >
                        💬 Community
                      </Link>

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
