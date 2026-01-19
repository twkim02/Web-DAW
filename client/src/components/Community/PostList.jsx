import React, { useState, useEffect } from 'react';
import { getPosts } from '../../api/posts';
import PostCard from './PostCard';

/**
 * 게시글 목록 컴포넌트 (MVP)
 */
const PostList = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [sort, setSort] = useState('created');

    const fetchPosts = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getPosts({ page, limit: 10, sort });
            setPosts(data.posts || []);
            setTotalPages(data.totalPages || 1);
        } catch (err) {
            setError(err.message || '게시글을 불러오는데 실패했습니다.');
            console.error('Failed to fetch posts:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, [page, sort]);

    if (loading) {
        return <div style={{ padding: '20px', color: '#fff' }}>로딩 중...</div>;
    }

    if (error) {
        return (
            <div style={{ padding: '20px', color: '#f44336' }}>
                <p>에러: {error}</p>
                <button onClick={fetchPosts} style={{ padding: '8px 16px', marginTop: '10px' }}>
                    다시 시도
                </button>
            </div>
        );
    }

    return (
        <div>
            {/* 정렬 옵션 */}
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <label style={{ color: '#fff' }}>정렬:</label>
                <select
                    value={sort}
                    onChange={(e) => {
                        setSort(e.target.value);
                        setPage(1);
                    }}
                    style={{
                        padding: '5px 10px',
                        borderRadius: '5px',
                        border: '1px solid #444',
                        backgroundColor: '#2a2a2a',
                        color: '#fff'
                    }}
                >
                    <option value="created">최신순</option>
                    <option value="popular">인기순</option>
                </select>
            </div>

            {/* 게시글 목록 */}
            {posts.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                    게시글이 없습니다.
                </div>
            ) : (
                <>
                    {posts.map(post => (
                        <PostCard key={post.id} post={post} />
                    ))}

                    {/* 페이지네이션 */}
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '5px',
                                border: '1px solid #444',
                                backgroundColor: page === 1 ? '#333' : '#2a2a2a',
                                color: '#fff',
                                cursor: page === 1 ? 'not-allowed' : 'pointer',
                                opacity: page === 1 ? 0.5 : 1
                            }}
                        >
                            이전
                        </button>
                        <span style={{ color: '#fff', padding: '8px' }}>
                            {page} / {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '5px',
                                border: '1px solid #444',
                                backgroundColor: page === totalPages ? '#333' : '#2a2a2a',
                                color: '#fff',
                                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                                opacity: page === totalPages ? 0.5 : 1
                            }}
                        >
                            다음
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default PostList;
