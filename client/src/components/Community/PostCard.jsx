import React from 'react';
import { useNavigate } from 'react-router-dom';
import useStore from '../../store/useStore';
import { deletePost } from '../../api/posts';

/**
 * 게시글 카드 컴포넌트 (MVP)
 */
const PostCard = ({ post, showEditDelete = false, onDelete }) => {
    const navigate = useNavigate();
    const user = useStore((state) => state.user);

    const handleClick = () => {
        navigate(`/community/${post.id}`);
    };

    const handleApplyPreset = async (e) => {
        e.stopPropagation(); // PostCard 클릭 이벤트 방지
        
        const postId = post.id;
        if (!postId) {
            alert('게시글 정보를 찾을 수 없습니다.');
            return;
        }

        // Post ID를 저장하여 downloadPost API로 프리셋 데이터 가져오기
        localStorage.setItem('loadPostId', postId.toString());
        localStorage.setItem('skipStartPage', 'true');

        // 메인 페이지로 이동 (START 페이지 생략, App.jsx에서 자동으로 초기화)
        window.location.href = '/';
    };

    const handleDetail = (e) => {
        e.stopPropagation();
        navigate(`/community/${post.id}`);
    };

    const handleDelete = async (e) => {
        e.stopPropagation();
        if (!window.confirm('정말 삭제하시겠습니까?')) return;

        try {
            await deletePost(post.id);
            alert('게시글이 삭제되었습니다.');
            if (onDelete) {
                onDelete(post.id);
            } else {
                // 페이지 새로고침
                window.location.reload();
            }
        } catch (err) {
            console.error('Failed to delete post:', err);
            alert('삭제에 실패했습니다: ' + (err.response?.data?.message || err.message));
        }
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
            <div style={{ display: 'flex', gap: '15px', fontSize: '0.85rem', color: '#888', alignItems: 'center', flexWrap: 'wrap' }}>
                <span>👤 {post.User?.nickname || 'Unknown'}</span>
                <span>❤️ {post.likeCount || 0}</span>
                <span>⬇️ {post.downloadCount || 0}</span>
                <span>📅 {new Date(post.createdAt).toLocaleDateString()}</span>
                <div style={{ display: 'flex', gap: '5px', marginLeft: 'auto' }}>
                    <button
                        onClick={handleApplyPreset}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '5px',
                            border: 'none',
                            backgroundColor: '#4CAF50',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                        }}
                    >
                        ✨ 적용
                    </button>
                    <button
                        onClick={handleDetail}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '5px',
                            border: 'none',
                            backgroundColor: '#2196F3',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                        }}
                    >
                        📝 상세
                    </button>
                    {showEditDelete && user && user.id === post.userId && (
                        <button
                            onClick={handleDelete}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '5px',
                                border: 'none',
                                backgroundColor: '#f44336',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: '0.85rem'
                            }}
                        >
                            🗑️ 삭제
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PostCard;
