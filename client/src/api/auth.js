import client from './client';

export const getCurrentUser = async () => {
    try {
        const response = await client.get('/auth/user');
        return response.data;
    } catch (error) {
        // 401 Unauthorized는 로그인하지 않은 상태를 의미하므로 정상적인 동작
        // 다른 에러만 콘솔에 표시
        if (error.response && error.response.status === 401) {
            // 로그인하지 않은 상태 - 조용히 처리
            return null;
        }
        // 401이 아닌 다른 에러는 콘솔에 표시
        console.error('Error fetching current user:', error);
        return null;
    }
};

export const logout = async () => {
    await client.get('/auth/logout');
};

export const loginURL = 'http://localhost:3001/auth/google';
export const devLoginURL = 'http://localhost:3001/auth/dev_login';
