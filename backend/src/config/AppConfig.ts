import { config as dotenvConfig } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// .env is at project root (two levels up from src/config/)
dotenvConfig({ path: join(__dirname, '../../../.env') });

export const config = {
  port: parseInt(process.env.PORT ?? '3001', 10),
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? 'http://localhost:3001',
  databaseUrl: process.env.DATABASE_URL ?? '',

  olx: {
    clientId: process.env.OLX_CLIENT_ID ?? '',
    clientSecret: process.env.OLX_CLIENT_SECRET ?? '',
    redirectUri: process.env.OLX_REDIRECT_URI ?? 'http://localhost:3001/api/auth/olx/callback',
    baseUrl: 'https://www.olx.pl',
    apiUrl: 'https://www.olx.pl/api',
  },

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY ?? '',
    model: 'claude-opus-4-6',
  },

  priceReduction: {
    defaultPercent: parseFloat(process.env.DEFAULT_PRICE_REDUCTION_PERCENT ?? '10'),
    defaultIntervalDays: parseInt(process.env.DEFAULT_REDUCTION_INTERVAL_DAYS ?? '14', 10),
    minPricePln: parseFloat(process.env.MIN_PRICE_PLN ?? '10'),
  },
};
