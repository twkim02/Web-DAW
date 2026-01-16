import client from './client';

export const getCurrentUser = async () => {
    try {
        const response = await client.get('/auth/user');
        return response.data;
    } catch (error) {
        return null;
    }
};

export const logout = async () => {
    await client.get('/auth/logout');
};

export const loginURL = 'http://localhost:3001/auth/google';
export const devLoginURL = 'http://localhost:3001/auth/dev_login';
