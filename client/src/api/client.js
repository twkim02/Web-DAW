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

export default client;
