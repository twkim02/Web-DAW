import client from './client';

/**
 * 사용자 설정 조회
 * @returns {Promise<Object>} 사용자 설정 객체 (설정이 없으면 기본값 반환)
 */
export const getUserPreferences = async () => {
    try {
        const response = await client.get('/api/user/preferences');
        return response.data;
    } catch (error) {
        console.error('Failed to get user preferences:', error);
        throw error;
    }
};

/**
 * 사용자 설정 업데이트/생성
 * @param {Object} data - 설정 데이터
 * @param {number} [data.latencyMs] - 오디오 레이턴시 (밀리초, 0 이상)
 * @param {string} [data.visualizerMode] - 비주얼라이저 모드 (예: 'waveform', 'spectrum', 'bars')
 * @param {number} [data.defaultMasterVolume] - 기본 마스터 볼륨 (0.0 ~ 1.0)
 * @returns {Promise<Object>} 업데이트된 설정 객체
 */
export const updateUserPreferences = async (data) => {
    try {
        const response = await client.put('/api/user/preferences', data);
        return response.data;
    } catch (error) {
        console.error('Failed to update user preferences:', error);
        throw error;
    }
};

/**
 * 사용자 설정 생성 (신규만)
 * 이미 설정이 있으면 에러를 반환합니다.
 * @param {Object} data - 설정 데이터
 * @param {number} [data.latencyMs] - 오디오 레이턴시 (밀리초, 0 이상)
 * @param {string} [data.visualizerMode] - 비주얼라이저 모드
 * @param {number} [data.defaultMasterVolume] - 기본 마스터 볼륨 (0.0 ~ 1.0)
 * @returns {Promise<Object>} 생성된 설정 객체
 */
export const createUserPreferences = async (data) => {
    try {
        const response = await client.post('/api/user/preferences', data);
        return response.data;
    } catch (error) {
        console.error('Failed to create user preferences:', error);
        throw error;
    }
};
