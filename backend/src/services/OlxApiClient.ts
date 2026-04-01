import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { config } from '../config/AppConfig.js';
import { OlxTokenRepository } from '../db/repositories/OlxTokenRepository.js';
import { OlxAuthService } from './OlxAuthService.js';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

function createClient(): AxiosInstance {
  const client = axios.create({
    baseURL: `${config.olx.apiUrl}/partner`,
    headers: { 'Version': '2.0', 'Content-Type': 'application/json' },
  });

  client.interceptors.request.use(async (req: InternalAxiosRequestConfig) => {
    let token = await OlxTokenRepository.get();
    if (!token) throw new Error('OLX not connected. Please authorize in Settings.');

    if (token.expiresAt - Date.now() < FIVE_MINUTES_MS) {
      token = await OlxAuthService.refreshToken(token.refreshToken);
    }

    req.headers['Authorization'] = `Bearer ${token.accessToken}`;
    return req;
  });

  client.interceptors.response.use(
    (res) => res,
    async (error) => {
      if (error.response?.status === 401 && !error.config._retried) {
        const token = await OlxTokenRepository.get();
        if (token) {
          error.config._retried = true;
          const fresh = await OlxAuthService.refreshToken(token.refreshToken);
          error.config.headers['Authorization'] = `Bearer ${fresh.accessToken}`;
          return client.request(error.config);
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
}

export const olxApi = createClient();
