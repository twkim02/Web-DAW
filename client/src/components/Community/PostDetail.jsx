import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPost, likePost, downloadPost, deletePost, togglePublish, getComments, addComment, deleteComment, forkPost } from '../../api/posts';
import useStore from '../../store/useStore';
import EditPostModal from './EditPostModal';

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
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Comments State
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);

    useEffect(() => {
        const fetchPostAndComments = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch Post
                const postData = await getPost(id);
                setPost(postData);

                // Fetch Comments
                setLoadingComments(true);
                const commentsData = await getComments(id);
                setComments(commentsData);
            } catch (err) {
                setError(err.response?.data?.message || '게시글을 불러오는데 실패했습니다.');
                console.error('Failed to fetch post/comments:', err);
            } finally {
                setLoading(false);
                setLoadingComments(false);
            }
        };

        if (id) {
            fetchPostAndComments();
        }
    }, [id]);

    const handleLike = async () => {
        if (!user) return alert('로그인이 필요합니다.');
        try {
            const result = await likePost(id);
            if (post) setPost({ ...post, likeCount: result.likeCount });
        } catch (err) {
            alert('오류: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDownload = async () => {
        if (!user) return alert('로그인이 필요합니다.');
        try {
            const result = await downloadPost(id);
            if (post) setPost({ ...post, downloadCount: result.downloadCount });
            alert('다운로드 완료!');
        } catch (err) {
            alert('오류: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleFork = async () => {
        if (!user) return alert('로그인이 필요합니다.');
        if (window.confirm('이 디자인을 내 라이브러리로 복사(Fork)하시겠습니까?')) {
            try {
                const result = await forkPost(id);
                alert('내 라이브러리에 저장되었습니다! (Remix)');
                // Optionally navigate to preset manager or reloading
                // For now, just update download count as forking counts as a download usually?
                // Logic in server increments downloadCount too. 
                if (post) setPost({ ...post, downloadCount: post.downloadCount + 1 });
            } catch (err) {
                alert('Fork 실패: ' + (err.response?.data?.message || err.message));
            }
        }
    };

    const handleApplyPreset = async () => {
        if (!post) return;

        // 1. Try to use linked preset
        if (post.Preset) {
            localStorage.setItem('loadPostId', post.id.toString());
            // We usually load by ID, but since we might have snapshot data logic in App.jsx...
            // Actually App.jsx loads by ID then fetches from server.
            // If preset is deleted, fetching by ID won't work for the Preset logic, 
            // but fetching the Post by ID will return the snapshot.

            // To support snapshot loading, we might need to store the data directly 
            // OR update App.jsx to handle 'loadPostId' by fetching the POST, not the PRESET.
            // Current App.jsx logic: calls getPost(id) if loadPostId is present? 
            // Let's check App.jsx. Assuming standard flow:
            localStorage.setItem('loadPostId', post.id.toString());
        }
        // 2. If valid preset link is missing but we have snapshot
        else if (post.presetData) {
            // We can't just set an ID because the preset doesn't exist.
            // We need to pass the data validation.
            // Strategy: Save snapshot to localStorage as 'tempPresetData' 
            // and update App.jsx to load it? 
            // Or simpler: The current architecture might rely on fetching.
            // Let's stick to 'loadPostId' and ensure App.jsx fetches the POST and extracts data.
            localStorage.setItem('loadPostId', post.id.toString());
        }

        localStorage.setItem('skipStartPage', 'true');
        window.location.href = '/workspace';
    };

    const handleDelete = async () => {
        if (!window.confirm('정말 삭제하시겠습니까?')) return;
        try {
            await deletePost(id);
            alert('삭제되었습니다.');
            navigate('/community');
        } catch (err) {
            alert('오류: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleTogglePublish = async () => {
        try {
            const result = await togglePublish(id);
            if (post) setPost({ ...post, isPublished: result.isPublished });
            alert(result.message);
        } catch (err) {
            alert('오류: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleAddComment = async () => {
        if (!user) return alert('로그인이 필요합니다.');
        if (!newComment.trim()) return;

        try {
            const addedComment = await addComment(id, newComment);
            setComments([...comments, addedComment]);
            setNewComment('');
        } catch (err) {
            alert('댓글 작성 실패: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
        try {
            await deleteComment(id, commentId);
            setComments(comments.filter(c => c.id !== commentId));
        } catch (err) {
            alert('댓글 삭제 실패: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleEditSuccess = () => {
        const refresh = async () => {
            const data = await getPost(id);
            setPost(data);
        };
        refresh();
    };

    const isOwner = user && post && user.id === post.userId;

    if (loading) return <div style={{ padding: '20px', color: '#fff' }}>Loading...</div>;
    if (error || !post) return <div style={{ padding: '20px', color: '#f44336' }}>Error: {error}</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', color: '#fff' }}>
            <button
                onClick={() => navigate('/community')}
                style={{
                    marginBottom: '20px',
                    padding: '8px 16px',
                    borderRadius: '5px',
                    border: '1px solid #444',
                    backgroundColor: 'transparent',
                    color: '#ccc',
                    cursor: 'pointer'
                }}
            >
                ← Back to List
            </button>

            {/* Post Header */}
            <h1 style={{ marginTop: 0, fontSize: '2.5rem' }}>{post.title}</h1>
            <div style={{ display: 'flex', gap: '15px', color: '#aaa', marginBottom: '20px', fontSize: '0.9rem' }}>
                <span>👤 {post.User?.nickname}</span>
                <span>📅 {new Date(post.createdAt).toLocaleDateString()}</span>
                <span>❤️ {post.likeCount} Likes</span>
                <span>⬇️ {post.downloadCount} Downloads</span>
                <span>👁️ {post.viewCount || 0} Views</span>
            </div>

            {/* Description Box */}
            <div style={{
                padding: '24px',
                backgroundColor: '#1a1a1a',
                borderRadius: '12px',
                marginBottom: '30px',
                border: '1px solid #333',
                lineHeight: '1.6'
            }}>
                {post.description || <span style={{ color: '#555', fontStyle: 'italic' }}>No description provided.</span>}

                {post.tags && post.tags.length > 0 && (
                    <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                        {post.tags.map((tag, idx) => (
                            <span
                                key={idx}
                                onClick={() => navigate(`/community?tag=${tag}`)}
                                style={{
                                    padding: '4px 10px',
                                    backgroundColor: '#333',
                                    borderRadius: '12px',
                                    fontSize: '0.8rem',
                                    color: '#ddd',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#444'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#333'}
                            >
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Actions Bar */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '40px' }}>
                <button onClick={handleApplyPreset} style={actionButtonStyle('#2196F3')}>
                    ✨ Apply Preset
                </button>
                <button onClick={handleFork} style={actionButtonStyle('#9C27B0')}>
                    🍴 Fork to Library
                </button>
                <button onClick={handleLike} disabled={!user} style={actionButtonStyle(user ? '#e91e63' : '#555')}>
                    ❤️ Like
                </button>
                {/* Owner Actions */}
                {isOwner && (
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
                        <button onClick={handleTogglePublish} style={actionButtonStyle('transparent', true)}>
                            {post.isPublished ? '🔒 Unpublish' : '🔓 Publish'}
                        </button>
                        <button onClick={() => setIsEditModalOpen(true)} style={actionButtonStyle('#FF9800')}>
                            ✏️ Edit
                        </button>
                        <button onClick={handleDelete} style={actionButtonStyle('#f44336')}>
                            🗑️ Delete
                        </button>
                    </div>
                )}
            </div>

            {/* Comments Section */}
            <div style={{ borderTop: '1px solid #333', paddingTop: '30px' }}>
                <h3 style={{ marginBottom: '20px' }}>💬 Comments ({comments.length})</h3>

                {/* Comment List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
                    {loadingComments ? (
                        <div style={{ color: '#666' }}>Loading comments...</div>
                    ) : comments.length === 0 ? (
                        <div style={{ color: '#666', fontStyle: 'italic' }}>No comments yet. Be the first!</div>
                    ) : (
                        comments.map(comment => (
                            <div key={comment.id} style={{
                                padding: '15px',
                                backgroundColor: '#111',
                                borderRadius: '8px',
                                border: '1px solid #222'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {comment.User?.avatarUrl ? (
                                            <img src={comment.User.avatarUrl} alt="avatar" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                                        ) : (
                                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#333' }}></div>
                                        )}
                                        <span style={{ fontWeight: 'bold', color: '#ddd' }}>{comment.User?.nickname}</span>
                                        <span style={{ fontSize: '0.8rem', color: '#666' }}>{new Date(comment.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    {user && user.id === comment.userId && (
                                        <button
                                            onClick={() => handleDeleteComment(comment.id)}
                                            style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '0.8rem' }}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                                <div style={{ color: '#ccc', lineHeight: '1.5' }}>{comment.content}</div>
                            </div>
                        ))
                    )}
                </div>

                {/* Add Comment Input */}
                {user ? (
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                            style={{
                                flex: 1,
                                padding: '12px 15px',
                                borderRadius: '8px',
                                border: '1px solid #333',
                                backgroundColor: '#111',
                                color: '#fff'
                            }}
                        />
                        <button
                            onClick={handleAddComment}
                            disabled={!newComment.trim()}
                            style={{
                                padding: '0 24px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: '#333',
                                color: '#fff',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            Post
                        </button>
                    </div>
                ) : (
                    <div style={{ padding: '15px', backgroundColor: '#111', borderRadius: '8px', textAlign: 'center', color: '#666' }}>
                        Log in to leave a comment.
                    </div>
                )}
            </div>

            {/* Edit Modal (Existing) */}
            {isOwner && (
                <EditPostModal
                    post={post}
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onSuccess={handleEditSuccess}
                />
            )}
        </div>
    );
};

// Styles helper
const actionButtonStyle = (bgColor, isOutline = false) => ({
    padding: '10px 18px',
    borderRadius: '6px',
    border: isOutline ? '1px solid #444' : 'none',
    backgroundColor: bgColor,
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
});

export default PostDetail;
