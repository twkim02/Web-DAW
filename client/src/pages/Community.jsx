import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useSearchParams } from 'react-router-dom';
import styles from './Community.module.css';
import useStore from '../store/useStore';
import { getPosts, getMyPosts } from '../api/posts';
import { getCurrentUser, getLoginURL, getDevLoginURL, logout } from '../api/auth';
import { audioEngine } from '../audio/AudioEngine';
import PostDetail from '../components/Community/PostDetail';
import PostCreate from '../components/Community/PostCreate';
import PostCard from '../components/Community/PostCard';
import Skeleton from '../components/UI/Skeleton';
import { useToast } from '../components/UI/ToastContext';

const PostCardSkeleton = () => (
  <div className={styles.card} style={{ pointerEvents: 'none' }}>
    <div style={{ height: '140px', marginBottom: '12px' }}>
      <Skeleton width="100%" height="100%" borderRadius="8px" />
    </div>
    <div style={{ padding: '0 4px' }}>
      <Skeleton width="60%" height="20px" borderRadius="4px" style={{ marginBottom: '8px' }} />
      <Skeleton width="40%" height="16px" borderRadius="4px" style={{ marginBottom: '16px' }} />
      <div style={{ display: 'flex', gap: '8px' }}>
        <Skeleton width="30%" height="32px" borderRadius="16px" />
        <Skeleton width="30%" height="32px" borderRadius="16px" />
      </div>
    </div>
  </div>
);

const Community = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryTag = searchParams.get('tag');
  const user = useStore((state) => state.user);
  const setUser = useStore((state) => state.setUser);
  const setAudioContextReady = useStore((state) => state.setAudioContextReady);

  // Tabs: 'discover' | 'library'
  const [activeTab, setActiveTab] = useState('discover');

  // Filters & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState(queryTag || '');
  const [sortBy, setSortBy] = useState('created'); // 'created' or 'popular'
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 12;

  // Data State
  const [otherDesigns, setOtherDesigns] = useState([]);
  const [myDesigns, setMyDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync filterTag with query param
  useEffect(() => {
    if (queryTag) {
      setFilterTag(queryTag);
      setActiveTab('discover'); // Switch to discover if tag is present
    }
  }, [queryTag]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // User Load
  useEffect(() => {
    const checkUser = async () => {
      const userData = await getCurrentUser();
      if (userData) setUser(userData);
    };
    checkUser();
  }, [setUser]);

  // Fetch Other Designs (Discover)
  useEffect(() => {
    if (activeTab !== 'discover') return;

    const fetchOtherDesigns = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {
          page: page,
          limit: LIMIT,
          sort: sortBy,
          search: debouncedSearch,
          tag: filterTag
        };
        const data = await getPosts(params);
        // exclude own posts? optional. keeping logic same for now.
        const filteredPosts = user
          ? (data.posts || []).filter(post => post.userId !== user.id)
          : (data.posts || []);

        setOtherDesigns(filteredPosts);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        console.error('Failed to fetch other designs:', err);
        setError('Failed to load posts.');
      } finally {
        setLoading(false);
      }
    };
    fetchOtherDesigns();
  }, [user, sortBy, debouncedSearch, page, filterTag, activeTab]);

  // Fetch My Designs (Library)
  useEffect(() => {
    if (activeTab !== 'library' || !user) return;

    const fetchMyDesigns = async () => {
      try {
        const data = await getMyPosts({ page: 1, limit: 20 });
        setMyDesigns(data.posts || []);
      } catch (err) {
        console.error('Failed to fetch my designs:', err);
        setMyDesigns([]);
      }
    };
    fetchMyDesigns();
  }, [user, activeTab]);

  const handleGoogleLogin = () => window.location.href = getLoginURL(window.location.pathname);
  const handleDevLogin = () => window.location.href = getDevLoginURL(window.location.pathname);

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      window.location.href = '/'; // Reload/Redirect
    } catch (err) {
      addToast('Logout failed, but session cleared', 'warning');
      setUser(null);
      window.location.href = '/';
    }
  };

  const handleNewProject = async () => {
    try {
      await import('tone').then(t => t.start());
      await audioEngine.init();
      setAudioContextReady(true);
      navigate('/workspace');
    } catch (e) {
      console.error('[Community] Failed to initialize audio:', e);
      navigate('/workspace');
    }
  };

  return (
    <div className={styles.container}>
      {/* Sidebar Navigation (Optional or just Header based) - Sticking to Header for now based on previous requests */}

      <div className={styles.inner}>
        {/* Header Hero Area */}
        <div className={styles.heroHeader}>
          <div className={styles.topBar}>
            <div className={styles.logoGroup}>
              <h1 onClick={() => navigate('/')} className={styles.logo} title="Go to Home">Web-DAW</h1>
              <span className={styles.divider}>/</span>
              <h1 className={styles.pageTitle}>Community</h1>
            </div>
            <div className={styles.authGroup}>
              {!user ? (
                <>
                  <button onClick={handleGoogleLogin} className={`${styles.btn} ${styles.btnLogin}`}>Sign In</button>
                  {process.env.NODE_ENV === 'development' && <button onClick={handleDevLogin} className={`${styles.btn} ${styles.btnDev}`}>Dev</button>}
                </>
              ) : (
                <div className={styles.userInfo}>
                  <div className={styles.avatar} style={{ backgroundImage: user.avatarUrl ? `url(${user.avatarUrl})` : 'none' }}></div>
                  <span className={styles.userName}>{user.nickname}</span>
                  <button onClick={handleLogout} className={styles.btnLogoutText}>Logout</button>
                </div>
              )}
              <button onClick={handleNewProject} className={`${styles.btn} ${styles.btnPrimary}`}>+ Create</button>
            </div>
          </div>

          <div className={styles.heroContent}>
            <h2 className={styles.heroTitle}>Discover Sounds</h2>
            <p className={styles.heroSubtitle}>Explore thousands of beats, loops, and presets created by the community.</p>

            <div className={styles.searchBarWrapper}>
              <input
                type="text"
                placeholder="Search tracks, tags, or artists..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (activeTab === 'library') setActiveTab('discover');
                  setPage(1);
                }}
                className={styles.heroSearchInput}
              />
            </div>

            {/* Tags Row */}
            {filterTag && (
              <div className={styles.activeTagsRow}>
                <span className={styles.activeTagBadge}>
                  #{filterTag}
                  <button onClick={() => { setFilterTag(''); setSearchParams({}); }} className={styles.closeTagBtn}>×</button>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabNav}>
          <button
            className={`${styles.tabBtn} ${activeTab === 'discover' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('discover')}
          >
            Discover
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === 'library' ? styles.activeTab : ''}`}
            onClick={() => {
              if (!user) return addToast('Please login to view your library', 'info');
              setActiveTab('library');
            }}
          >
            My Library
          </button>

          {/* Sort Control (Only visible in Discover) */}
          {activeTab === 'discover' && (
            <div className={styles.sortControl}>
              <div className={styles.sortControl}>
                <button
                  className={`${styles.sortBtn} ${sortBy === 'created' ? styles.activeSort : ''}`}
                  onClick={() => { setSortBy('created'); setPage(1); }}
                >
                  Newest
                </button>
                <div className={styles.sortDivider}></div>
                <button
                  className={`${styles.sortBtn} ${sortBy === 'popular' ? styles.activeSort : ''}`}
                  onClick={() => { setSortBy('popular'); setPage(1); }}
                >
                  Popular
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className={styles.contentArea}>
          <Routes>
            <Route path=":id" element={<PostDetail />} />
            <Route path="create" element={<PostCreate />} />
            <Route index element={
              <>
                {activeTab === 'discover' && (
                  <>
                    {loading ? (
                      <div className={styles.grid}>
                        {Array.from({ length: 8 }).map((_, i) => (
                          <PostCardSkeleton key={i} />
                        ))}
                      </div>
                    ) : error ? (
                      <div className={styles.errorState}>{error}</div>
                    ) : otherDesigns.length === 0 ? (
                      <div className={styles.emptyState}>No results found. Try a different search term.</div>
                    ) : (
                      <div className={styles.grid}>
                        {otherDesigns.map(post => <PostCard key={post.id} post={post} />)}
                      </div>
                    )}

                    {totalPages > 1 && (
                      <div className={styles.pagination}>
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className={styles.pageBtn}>Previous</button>
                        <span className={styles.pageInfo}>{page} / {totalPages}</span>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className={styles.pageBtn}>Next</button>
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'library' && (
                  <>
                    {!user ? (
                      <div className={styles.loginPrompt}>Please info to view your library.</div>
                    ) : myDesigns.length === 0 ? (
                      <div className={styles.emptyState}>
                        You haven't created anything yet. <br />
                        <span className={styles.linkText} onClick={handleNewProject}>Start your first project</span>
                      </div>
                    ) : (
                      <div className={styles.grid}>
                        {myDesigns.map(post => (
                          <PostCard
                            key={post.id}
                            post={post}
                            showEditDelete={true}
                            onDelete={(id) => setMyDesigns(prev => prev.filter(p => p.id !== id))}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            } />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Community;
