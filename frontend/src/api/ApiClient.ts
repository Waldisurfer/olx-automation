import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/api` : '/api',
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('authToken');
  const sessionId = localStorage.getItem('sessionId');
  if (token) {
    cfg.headers['Authorization'] = `Bearer ${token}`;
  } else if (sessionId) {
    cfg.headers['X-Session-Id'] = sessionId;
  }
  return cfg;
});

apiClient.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg = err.response?.data?.error ?? err.message ?? 'Unknown error';
    return Promise.reject(new Error(msg));
  }
);
