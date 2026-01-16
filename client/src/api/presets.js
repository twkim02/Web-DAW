import client from './client';

export const getPresets = async () => {
    const response = await client.get('/presets');
    return response.data;
};

export const getPreset = async (id) => {
    const response = await client.get(`/presets/${id}`);
    return response.data;
};

export const savePreset = async (data) => {
    // data: { title, bpm, mappings }
    const response = await client.post('/presets', data);
    return response.data;
};
