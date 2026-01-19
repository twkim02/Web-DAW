import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPost, likePost, downloadPost, deletePost, togglePublish } from '../../api/posts';
import useStore from '../../store/useStore';

/**
 * 게시글 상세 컴포넌트 (MVP)
 */
const PostDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const user = useStore((state) => state.user);
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPost = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getPost(id);
                setPost(data);
            } catch (err) {
                setError(err.response?.data?.message || '게시글을 불러오는데 실패했습니다.');
                console.error('Failed to fetch post:', err);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchPost();
        }
    }, [id]);

    const handleLike = async () => {
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }

        try {
            const result = await likePost(id);
            if (post) {
                setPost({ ...post, likeCount: result.likeCount });
            }
        } catch (err) {
            alert('좋아요에 실패했습니다: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDownload = async () => {
        if (!user) {
            alert('로그인이 필요합니다.');
            return;
        }

        try {
            const result = await downloadPost(id);
            // TODO: 프리셋 데이터를 로드하는 로직 추가 필요
            // 현재는 다운로드 카운트만 업데이트
            if (post) {
                setPost({ ...post, downloadCount: result.downloadCount });
            }
            alert('프리셋을 다운로드했습니다! (현재는 카운트만 증가합니다)');
        } catch (err) {
            alert('다운로드에 실패했습니다: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('정말 삭제하시겠습니까?')) return;

        try {
            await deletePost(id);
            alert('게시글이 삭제되었습니다.');
            navigate('/community');
        } catch (err) {
            alert('삭제에 실패했습니다: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleTogglePublish = async () => {
        try {
            const result = await togglePublish(id);
            if (post) {
                setPost({ ...post, isPublished: result.isPublished });
            }
            alert(result.message);
        } catch (err) {
            alert('공개 상태 변경에 실패했습니다: ' + (err.response?.data?.message || err.message));
        }
    };

    const isOwner = user && post && user.id === post.userId;

    if (loading) {
        return <div style={{ padding: '20px', color: '#fff' }}>로딩 중...</div>;
    }

    if (error || !post) {
        return (
            <div style={{ padding: '20px', color: '#f44336' }}>
                <p>에러: {error || '게시글을 찾을 수 없습니다.'}</p>
                <button
                    onClick={() => navigate('/community')}
                    style={{ padding: '8px 16px', marginTop: '10px' }}
                >
                    목록으로
                </button>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
            <button
                onClick={() => navigate('/community')}
                style={{
                    padding: '8px 16px',
                    marginBottom: '20px',
                    borderRadius: '5px',
                    border: '1px solid #444',
                    backgroundColor: '#2a2a2a',
                    color: '#fff',
                    cursor: 'pointer'
                }}
            >
                ← 목록으로
            </button>

            <h1 style={{ marginTop: 0 }}>{post.title}</h1>

            {post.description && (
                <div style={{ marginBottom: '20px', color: '#aaa', lineHeight: '1.6' }}>
                    {post.description}
                </div>
            )}

            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#1a1a1a', borderRadius: '8px' }}>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '10px', fontSize: '0.9rem', color: '#888' }}>
                    <span>👤 {post.User?.nickname || 'Unknown'}</span>
                    <span>📅 {new Date(post.createdAt).toLocaleString()}</span>
                    <span>❤️ {post.likeCount || 0}</span>
                    <span>⬇️ {post.downloadCount || 0}</span>
                </div>
                {post.Preset && (
                    <div style={{ fontSize: '0.9rem', color: '#aaa' }}>
                        프리셋: {post.Preset.title} (BPM: {post.Preset.bpm})
                    </div>
                )}
            </div>

            {/* 액션 버튼 */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                    onClick={handleLike}
                    disabled={!user}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '5px',
                        border: 'none',
                        backgroundColor: user ? '#f44336' : '#555',
                        color: '#fff',
                        cursor: user ? 'pointer' : 'not-allowed',
                        opacity: user ? 1 : 0.5
                    }}
                >
                    ❤️ 좋아요 ({post.likeCount || 0})
                </button>
                <button
                    onClick={handleDownload}
                    disabled={!user}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '5px',
                        border: 'none',
                        backgroundColor: user ? '#4CAF50' : '#555',
                        color: '#fff',
                        cursor: user ? 'pointer' : 'not-allowed',
                        opacity: user ? 1 : 0.5
                    }}
                >
                    ⬇️ 다운로드 ({post.downloadCount || 0})
                </button>

                {isOwner && (
                    <>
                        <button
                            onClick={handleTogglePublish}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '5px',
                                border: '1px solid #444',
                                backgroundColor: '#2a2a2a',
                                color: '#fff',
                                cursor: 'pointer'
                            }}
                        >
                            {post.isPublished ? '🔒 비공개로 전환' : '🔓 공개로 전환'}
                        </button>
                        <button
                            onClick={handleDelete}
                            style={{
                                padding: '10px 20px',
                                borderRadius: '5px',
                                border: 'none',
                                backgroundColor: '#f44336',
                                color: '#fff',
                                cursor: 'pointer'
                            }}
                        >
                            🗑️ 삭제
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default PostDetail;
