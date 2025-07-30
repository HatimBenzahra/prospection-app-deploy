const SERVER_HOST = import.meta.env.VITE_SERVER_HOST || window.location.hostname;
const API_PORT = import.meta.env.VITE_API_PORT || '3000';

export const API_BASE_URL = `https://${SERVER_HOST}:${API_PORT}`;
