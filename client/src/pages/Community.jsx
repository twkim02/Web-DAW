import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import { getPosts, getMyPosts } from '../api/posts';
import { getCurrentUser, loginURL, devLoginURL, logout } from '../api/auth';
import { audioEngine } from '../audio/AudioEngine';
import PostDetail from '../components/Community/PostDetail';
import PostCreate from '../components/Community/PostCreate';
import PostCard from '../components/Community/PostCard';

/**
 * 게시판 메인 페이지 (재구성)
 */
const Community = () => {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const setAudioContextReady = useStore((state) => state.setAudioContextReady);
  const [otherDesigns, setOtherDesigns] = useState([]);
  const [myDesigns, setMyDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 사용자 정보 로드 (로그인 후 리다이렉트 시 사용)
  useEffect(() => {
    const checkUser = async () => {
      const userData = await getCurrentUser();
      if (userData) {
        setUser(userData);
      }
    };
    checkUser();
  }, [setUser]);

  // Other Design (공개된 게시글들) 로드
  useEffect(() => {
    const fetchOtherDesigns = async () => {
      try {
        const data = await getPosts({ page: 1, limit: 20, sort: 'created' });
        setOtherDesigns(data.posts || []);
      } catch (err) {
        console.error('Failed to fetch other designs:', err);
        setError('게시글을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchOtherDesigns();
  }, []);

  // My Design (내 게시글들) 로드
  useEffect(() => {
    const fetchMyDesigns = async () => {
      if (!user) {
        setMyDesigns([]);
        return;
      }

      try {
        const data = await getMyPosts({ page: 1, limit: 20 });
        setMyDesigns(data.posts || []);
      } catch (err) {
        console.error('Failed to fetch my designs:', err);
      }
    };

    fetchMyDesigns();
  }, [user]);

  const handleGoogleLogin = () => {
    window.location.href = loginURL;
  };

  const handleDevLogin = () => {
    window.location.href = devLoginURL;
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      // 페이지 새로고침하여 상태 초기화
      window.location.reload();
    } catch (err) {
      console.error('Logout failed:', err);
      // 에러가 발생해도 사용자 상태는 초기화하고 새로고침
      setUser(null);
      window.location.reload();
    }
  };

  const handleNewProject = async () => {
    // 오디오 컨텍스트 초기화
    try {
      // Tone.js context 시작
      await import('tone').then(t => t.start());
      
      // Audio Engine 초기화
      await audioEngine.init();
      
      // 상태 업데이트
      setAudioContextReady(true);
      
      // 메인 페이지로 이동
      navigate('/');
    } catch (e) {
      console.error('[Community] Failed to initialize audio:', e);
      // 오디오 초기화 실패해도 메인 페이지로 이동
      navigate('/');
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0a0a0a', 
      color: '#fff',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px',
          paddingBottom: '20px',
          borderBottom: '1px solid #333'
        }}>
          <h1 style={{ margin: 0 }}>💬 Community</h1>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {!user ? (
              <>
                <button
                  onClick={handleGoogleLogin}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '5px',
                    border: 'none',
                    backgroundColor: '#4285F4',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  🔐 Google 로그인
                </button>
                <button
                  onClick={handleDevLogin}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '5px',
                    border: '1px solid #444',
                    backgroundColor: '#2a2a2a',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  Dev 로그인
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ marginRight: '10px', color: '#aaa' }}>
                  👤 {user.nickname || user.username}
                </span>
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '5px',
                    border: 'none',
                    backgroundColor: '#f44336',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  로그아웃
                </button>
              </div>
            )}
            <button
              onClick={handleNewProject}
              style={{
                padding: '10px 20px',
                borderRadius: '5px',
                border: 'none',
                backgroundColor: '#2196F3',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              ✨ 새로 만들기
            </button>
          </div>
        </div>

        {/* Routes for detail and create pages */}
        <Routes>
          <Route path="/:id" element={<PostDetail />} />
          <Route path="/create" element={<PostCreate />} />
          <Route path="/" element={
            <>
              {/* Other Design Section */}
              <section style={{ marginBottom: '50px' }}>
                <h2 style={{ marginBottom: '20px', fontSize: '1.5rem' }}>Other Design</h2>
                {loading ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                    로딩 중...
                  </div>
                ) : error ? (
                  <div style={{ padding: '20px', color: '#f44336' }}>
                    {error}
                  </div>
                ) : otherDesigns.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                    공개된 프리셋이 없습니다.
                  </div>
                ) : (
                  <div>
                    {otherDesigns.map(post => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                )}
              </section>

              {/* My Design Section */}
              <section>
                <h2 style={{ marginBottom: '20px', fontSize: '1.5rem' }}>My Design</h2>
                {!user ? (
                  <div style={{ 
                    padding: '40px', 
                    textAlign: 'center', 
                    backgroundColor: '#1a1a1a',
                    borderRadius: '10px',
                    border: '1px solid #333'
                  }}>
                    <p style={{ color: '#888', fontSize: '1.1rem', margin: 0 }}>
                      로그인을 하면 본인이 만든 프리셋을 볼 수 있습니다.
                    </p>
                  </div>
                ) : myDesigns.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                    아직 만든 프리셋이 없습니다.
                  </div>
                ) : (
                  <div>
                    {myDesigns.map(post => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                )}
              </section>
            </>
          } />
        </Routes>
      </div>
    </div>
  );
};

export default Community;
