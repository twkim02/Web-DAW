import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * 게시글 카드 컴포넌트 (MVP)
 */
const PostCard = ({ post }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(`/community/${post.id}`);
    };

    return (
        <div
            onClick={handleClick}
            style={{
                border: '1px solid #444',
                borderRadius: '8px',
                padding: '15px',
                marginBottom: '15px',
                backgroundColor: '#1a1a1a',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#222'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1a1a1a'}
        >
            <h3 style={{ marginTop: 0, marginBottom: '10px', color: '#fff' }}>
                {post.title}
            </h3>
            {post.description && (
                <p style={{ color: '#aaa', marginBottom: '10px', fontSize: '0.9rem' }}>
                    {post.description.length > 100 
                        ? post.description.substring(0, 100) + '...' 
                        : post.description}
                </p>
            )}
            <div style={{ display: 'flex', gap: '15px', fontSize: '0.85rem', color: '#888' }}>
                <span>👤 {post.User?.nickname || 'Unknown'}</span>
                <span>❤️ {post.likeCount || 0}</span>
                <span>⬇️ {post.downloadCount || 0}</span>
                <span>📅 {new Date(post.createdAt).toLocaleDateString()}</span>
            </div>
        </div>
    );
};

export default PostCard;
