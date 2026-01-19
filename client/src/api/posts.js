import client from './client';

/**
 * 게시글 목록 조회
 * @param {Object} params - 쿼리 파라미터
 * @param {number} [params.page=1] - 페이지 번호
 * @param {number} [params.limit=10] - 페이지당 항목 수
 * @param {string} [params.sort='created'] - 정렬 방식 ('created' 또는 'popular')
 * @returns {Promise<Object>} { posts, total, page, limit, totalPages }
 */
export const getPosts = async (params = {}) => {
    try {
        const response = await client.get('/api/posts', { params });
        return response.data;
    } catch (error) {
        console.error('Failed to get posts:', error);
        throw error;
    }
};

/**
 * 게시글 상세 조회
 * @param {number} id - 게시글 ID
 * @returns {Promise<Object>} 게시글 객체 (프리셋과 키 매핑 정보 포함)
 */
export const getPost = async (id) => {
    try {
        const response = await client.get(`/api/posts/${id}`);
        return response.data;
    } catch (error) {
        console.error('Failed to get post:', error);
        throw error;
    }
};

/**
 * 내 게시글 목록 조회
 * @param {Object} params - 쿼리 파라미터
 * @param {number} [params.page=1] - 페이지 번호
 * @param {number} [params.limit=10] - 페이지당 항목 수
 * @returns {Promise<Object>} { posts, total, page, limit, totalPages }
 */
export const getMyPosts = async (params = {}) => {
    try {
        const response = await client.get('/api/posts/user/my-posts', { params });
        return response.data;
    } catch (error) {
        console.error('Failed to get my posts:', error);
        throw error;
    }
};

/**
 * 게시글 생성
 * @param {Object} data - 게시글 데이터
 * @param {number} data.presetId - 프리셋 ID (필수)
 * @param {string} data.title - 게시글 제목 (필수)
 * @param {string} [data.description] - 게시글 설명
 * @param {boolean} [data.isPublished=true] - 공개 여부
 * @returns {Promise<Object>} 생성된 게시글 객체
 */
export const createPost = async (data) => {
    try {
        const response = await client.post('/api/posts', data);
        return response.data;
    } catch (error) {
        console.error('Failed to create post:', error);
        throw error;
    }
};

/**
 * 게시글 수정
 * @param {number} id - 게시글 ID
 * @param {Object} data - 수정할 데이터
 * @param {string} [data.title] - 제목
 * @param {string} [data.description] - 설명
 * @param {boolean} [data.isPublished] - 공개 여부
 * @returns {Promise<Object>} 수정된 게시글 객체
 */
export const updatePost = async (id, data) => {
    try {
        const response = await client.put(`/api/posts/${id}`, data);
        return response.data;
    } catch (error) {
        console.error('Failed to update post:', error);
        throw error;
    }
};

/**
 * 게시글 삭제
 * @param {number} id - 게시글 ID
 * @returns {Promise<Object>} { message: 'Post deleted successfully' }
 */
export const deletePost = async (id) => {
    try {
        const response = await client.delete(`/api/posts/${id}`);
        return response.data;
    } catch (error) {
        console.error('Failed to delete post:', error);
        throw error;
    }
};

/**
 * 게시글 좋아요
 * @param {number} id - 게시글 ID
 * @returns {Promise<Object>} { success: true, likeCount: number }
 */
export const likePost = async (id) => {
    try {
        const response = await client.post(`/api/posts/${id}/like`);
        return response.data;
    } catch (error) {
        console.error('Failed to like post:', error);
        throw error;
    }
};

/**
 * 게시글 다운로드 (프리셋 데이터 반환)
 * @param {number} id - 게시글 ID
 * @returns {Promise<Object>} { success: true, downloadCount: number, post: Object }
 */
export const downloadPost = async (id) => {
    try {
        const response = await client.post(`/api/posts/${id}/download`);
        return response.data;
    } catch (error) {
        console.error('Failed to download post:', error);
        throw error;
    }
};

/**
 * 게시글 포크 (프리셋 복사)
 * @param {number} id - 게시글 ID
 * @returns {Promise<Object>} { success: true, newPresetId: number }
 */
export const forkPost = async (id) => {
    try {
        const response = await client.post(`/api/posts/${id}/fork`);
        return response.data;
    } catch (error) {
        console.error('Failed to fork post:', error);
        throw error;
    }
};

/**
 * 댓글 목록 조회
 * @param {number} postId - 게시글 ID
 * @returns {Promise<Array>} 댓글 목록
 */
export const getComments = async (postId) => {
    try {
        const response = await client.get(`/api/posts/${postId}/comments`);
        return response.data;
    } catch (error) {
        console.error('Failed to get comments:', error);
        throw error;
    }
};

/**
 * 댓글 작성
 * @param {number} postId - 게시글 ID
 * @param {string} content - 댓글 내용
 * @returns {Promise<Object>} 생성된 댓글 객체
 */
export const addComment = async (postId, content) => {
    try {
        const response = await client.post(`/api/posts/${postId}/comments`, { content });
        return response.data;
    } catch (error) {
        console.error('Failed to add comment:', error);
        throw error;
    }
};

/**
 * 댓글 삭제
 * @param {number} postId - 게시글 ID (URL 구성용)
 * @param {number} commentId - 댓글 ID
 * @returns {Promise<Object>} { message: 'Comment deleted' }
 */
export const deleteComment = async (postId, commentId) => {
    try {
        const response = await client.delete(`/api/posts/${postId}/comments/${commentId}`);
        return response.data;
    } catch (error) {
        console.error('Failed to delete comment:', error);
        throw error;
    }
};

/**
 * 게시글 공개 여부 토글
 * @param {number} id - 게시글 ID
 * @returns {Promise<Object>} { success: true, isPublished: boolean, message: string }
 */
export const togglePublish = async (id) => {
    try {
        const response = await client.post(`/api/posts/${id}/publish`);
        return response.data;
    } catch (error) {
        console.error('Failed to toggle publish status:', error);
        throw error;
    }
};


