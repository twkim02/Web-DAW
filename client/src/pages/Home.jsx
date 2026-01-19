import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Home.module.css';
import useStore from '../store/useStore';
import { getCurrentUser, getLoginURL, getDevLoginURL } from '../api/auth';

const Home = () => {
    const navigate = useNavigate();
    const user = useStore(state => state.user);
    const setUser = useStore(state => state.setUser);

    // Initial Auth Check
    useEffect(() => {
        if (!user) {
            getCurrentUser().then(userData => {
                if (userData) setUser(userData);
            });
        }
    }, [user, setUser]);

    const handleLogin = () => {
        window.location.href = getLoginURL(window.location.pathname);
    };

    return (
        <div className={styles.container}>
            {/* Background Accents */}
            <div className={styles.background}>
                <div className={styles.blob}></div>
                <div className={styles.blob}></div>
            </div>

            {/* Header */}
            <header className={styles.header}>
                <div className={styles.logo}>Web-DAW</div>
                <div className={styles.navGroup}>
                    {user ? (
                        <div className={styles.userBadge}>
                            <div className={styles.userAvatar}
                                style={{ backgroundImage: user.avatarUrl ? `url(${user.avatarUrl})` : 'none', backgroundSize: 'cover' }}>
                            </div>
                            <span>{user.nickname || user.username}</span>
                        </div>
                    ) : (
                        <>
                            <button onClick={handleLogin} className={styles.btnLogin}>Login</button>
                            {/* Dev Login for fallback */}
                            {process.env.NODE_ENV === 'development' && (
                                <button onClick={() => window.location.href = getDevLoginURL(window.location.pathname)} className={styles.btnLogin} style={{ opacity: 0.5 }}>Dev</button>
                            )}
                        </>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className={styles.main}>
                <h1 className={styles.heroTitle}>
                    Create Music,<br />Anywhere.
                </h1>
                <p className={styles.heroSubtitle}>
                    A professional-grade Digital Audio Workstation right in your browser.
                    No installation required.
                </p>

                <div className={styles.grid}>
                    {/* New Project Widget */}
                    <div className={styles.card} onClick={() => navigate('/workspace')}>
                        <div className={styles.cardIcon}>🎹</div>
                        <div>
                            <h2 className={styles.cardTitle}>New Project</h2>
                            <p className={styles.cardDesc}>Start a new session from scratch. Sequencer, Synths, and Samplers ready to go.</p>
                        </div>
                        <div className={styles.cardAction}>Enter Studio</div>
                    </div>

                    {/* Community Widget */}
                    <div className={styles.card} onClick={() => navigate('/community')}>
                        <div className={styles.cardIcon}>🌍</div>
                        <div>
                            <h2 className={styles.cardTitle}>Community</h2>
                            <p className={styles.cardDesc}>Explore thousands of beats shared by other creators. Fork, remix, and share your own.</p>
                        </div>
                        <div className={styles.cardAction}>Browse Tracks</div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Home;
