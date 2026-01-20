import client from './client';

/**
 * 그래픽 자산 목록 조회
 * @param {Object} params - 쿼리 파라미터
 * @param {string} [params.category] - 카테고리 필터 ('background', 'icon', 'texture', 'overlay', 'other')
 * @returns {Promise<Array>} GraphicAsset 배열
 */
export const getGraphicAssets = async (params = {}) => {
    try {
        const response = await client.get('/api/graphic-assets', { params });
        return response.data;
    } catch (error) {
        console.error('Failed to get graphic assets:', error);
        throw error;
    }
};

/**
 * 단일 그래픽 자산 조회
 * @param {number} id - GraphicAsset ID
 * @returns {Promise<Object>} GraphicAsset 객체
 */
export const getGraphicAsset = async (id) => {
    try {
        const response = await client.get(`/api/graphic-assets/${id}`);
        return response.data;
    } catch (error) {
        console.error('Failed to get graphic asset:', error);
        throw error;
    }
};

/**
 * 그래픽 자산 업로드
 * @param {File} file - 이미지 파일
 * @param {string} category - 카테고리 ('background', 'icon', 'texture', 'overlay', 'other')
 * @param {boolean} isPublic - 공개 여부
 * @returns {Promise<Object>} { message, asset }
 */
export const uploadGraphicAsset = async (file, category = 'background', isPublic = false) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    formData.append('isPublic', isPublic);

    const response = await client.post('/api/graphic-assets', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

/**
 * 그래픽 자산 수정
 * @param {number} id - GraphicAsset ID
 * @param {Object} data - 수정할 데이터
 * @param {string} [data.originalName] - 파일명
 * @param {boolean} [data.isPublic] - 공개 여부
 * @returns {Promise<Object>} 수정된 GraphicAsset 객체
 */
export const updateGraphicAsset = async (id, data) => {
    try {
        const response = await client.put(`/api/graphic-assets/${id}`, data);
        return response.data;
    } catch (error) {
        console.error('Failed to update graphic asset:', error);
        throw error;
    }
};

/**
 * 그래픽 자산 삭제
 * @param {number} id - GraphicAsset ID
 * @returns {Promise<Object>} { message }
 */
export const deleteGraphicAsset = async (id) => {
    try {
        const response = await client.delete(`/api/graphic-assets/${id}`);
        return response.data;
    } catch (error) {
        console.error('Failed to delete graphic asset:', error);
        throw error;
    }
};

/**
 * 그래픽 자산 배치 삭제
 * @param {number[]} ids - GraphicAsset ID 배열
 * @returns {Promise<Object>} { message }
 */
export const deleteGraphicAssets = async (ids) => {
    try {
        const response = await client.post('/api/graphic-assets/delete', { ids });
        return response.data;
    } catch (error) {
        console.error('Failed to delete graphic assets:', error);
        throw error;
    }
};
