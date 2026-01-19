import client from './client';

export const uploadFile = async (file, category = 'sample') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    const response = await client.post('/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};
