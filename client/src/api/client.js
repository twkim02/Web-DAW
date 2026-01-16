import axios from 'axios';

const client = axios.create({
    baseURL: 'http://localhost:3001',
    withCredentials: true, // Important for session cookies
});

export default client;
