import axios from 'axios';

// Dynamically determine the base URL
// If accessed via localhost, use localhost:3001
// If accessed via IP (e.g., 10.249...), use that IP:3001
const baseURL = window.location.hostname === 'localhost'
    ? 'http://localhost:3001'
    : `http://${window.location.hostname}:3001`;

const client = axios.create({
    baseURL: baseURL,
    withCredentials: true, // Important for session cookies
});

// Response interceptor: 401 에러를 조용히 처리 (로그인하지 않은 상태는 정상)
client.interceptors.response.use(
    (response) => response,
    (error) => {
        // /auth/user 엔드포인트의 401 에러는 조용히 처리 (로그인하지 않은 상태)
        if (error.config && error.config.url && error.config.url.includes('/auth/user') && error.response?.status === 401) {
            // 401 에러를 조용히 처리하기 위해 Promise를 reject하지 않고 조용히 반환
            // 하지만 실제로는 catch 블록에서 처리해야 하므로, 여기서는 그냥 통과
            return Promise.reject(error);
        }
        // 다른 에러는 그대로 전달
        return Promise.reject(error);
    }
);

export default client;
