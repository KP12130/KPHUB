export const API_BASE = import.meta.env.VITE_API_BASE || (import.meta.env.PROD ? '' : (window.location.hostname === '127.0.0.1' ? 'http://127.0.0.1:5000' : 'http://localhost:5000'));
