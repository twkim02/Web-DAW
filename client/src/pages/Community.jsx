import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';
import PostList from '../components/Community/PostList';
import PostDetail from '../components/Community/PostDetail';
import PostCreate from '../components/Community/PostCreate';

/**
 * 게시판 메인 페이지 (MVP)
 */
const Community = () => {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);

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
          {user && (
            <button
              onClick={() => navigate('/community/create')}
              style={{
                padding: '10px 20px',
                borderRadius: '5px',
                border: 'none',
                backgroundColor: '#4CAF50',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              ✏️ 작성하기
            </button>
          )}
        </div>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<PostList />} />
          <Route path="/:id" element={<PostDetail />} />
          <Route path="/create" element={<PostCreate />} />
        </Routes>
      </div>
    </div>
  );
};

export default Community;
