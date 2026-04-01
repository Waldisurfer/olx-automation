import axios from 'axios';
import { config } from '../config/AppConfig.js';
import { OlxTokenRepository } from '../db/repositories/OlxTokenRepository.js';
import type { OlxTokenResponse, OlxStoredToken } from '../types/OlxApi.types.js';

export const OlxAuthService = {
  getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      client_id: config.olx.clientId,
      response_type: 'code',
      redirect_uri: config.olx.redirectUri,
      scope: 'read write v2',
    });
    return `${config.olx.baseUrl}/oauth/authorize/?${params.toString()}`;
  },

  async exchangeCode(code: string): Promise<OlxStoredToken> {
    const response = await axios.post<OlxTokenResponse>(
      `${config.olx.apiUrl}/open/oauth/token`,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: config.olx.redirectUri,
        client_id: config.olx.clientId,
        client_secret: config.olx.clientSecret,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const token = responseToStored(response.data);
    await OlxTokenRepository.save(token);
    return token;
  },

  async refreshToken(refreshToken: string): Promise<OlxStoredToken> {
    const response = await axios.post<OlxTokenResponse>(
      `${config.olx.apiUrl}/open/oauth/token`,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: config.olx.clientId,
        client_secret: config.olx.clientSecret,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    const token = responseToStored(response.data);
    await OlxTokenRepository.save(token);
    return token;
  },

  async getStatus(): Promise<{ connected: boolean; expiresAt?: string }> {
    const token = await OlxTokenRepository.get();
    if (!token) return { connected: false };
    return {
      connected: true,
      expiresAt: new Date(token.expiresAt).toISOString(),
    };
  },

  async disconnect(): Promise<void> {
    await OlxTokenRepository.delete();
  },
};

function responseToStored(data: OlxTokenResponse): OlxStoredToken {
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}
