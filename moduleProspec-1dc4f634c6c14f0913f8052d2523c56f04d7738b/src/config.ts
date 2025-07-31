// Configuration pour production Render
const isProduction = window.location.hostname.includes('onrender.com');

const SERVER_HOST = import.meta.env.VITE_SERVER_HOST || 
  (isProduction ? 'prospection-backend.onrender.com' : window.location.hostname);

const API_PORT = import.meta.env.VITE_API_PORT || (isProduction ? '' : '3000');

export const API_BASE_URL = isProduction 
  ? `https://${SERVER_HOST}` 
  : `https://${SERVER_HOST}:${API_PORT}`;
