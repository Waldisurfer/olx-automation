import { Router } from 'express';
import { OlxAuthService } from '../services/OlxAuthService.js';

export const authRouter = Router();

authRouter.get('/olx/url', (_req, res) => {
  res.json({ url: OlxAuthService.getAuthorizationUrl() });
});

authRouter.get('/olx/callback', async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      res.status(400).json({ error: 'Missing code parameter' });
      return;
    }
    await OlxAuthService.exchangeCode(code);
    res.send('<script>window.close()</script><p>Połączono z OLX! Możesz zamknąć tę kartę.</p>');
  } catch (err) {
    next(err);
  }
});

authRouter.get('/olx/status', async (_req, res, next) => {
  try {
    res.json(await OlxAuthService.getStatus());
  } catch (err) {
    next(err);
  }
});

authRouter.delete('/olx/disconnect', async (_req, res, next) => {
  try {
    await OlxAuthService.disconnect();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});
