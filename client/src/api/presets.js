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
    // data: { title, bpm, masterVolume?, isQuantized?, mappings }
    // mappings: Array<{ keyChar, mode, volume, type?, note?, assetId?, synthSettings? }>
    const response = await client.post('/presets', data);
    return response.data;
};

export const deletePreset = async (id) => {
    const response = await client.delete(`/presets/${id}`);
    return response.data;
};
