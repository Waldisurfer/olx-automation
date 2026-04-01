import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { config } from '../config/AppConfig.js';

export interface AuthRequest extends Request {
  userId?: number;
  sessionId?: string;
}

export function authMiddleware(req: AuthRequest, _res: Response, next: NextFunction): void {
  const auth = req.headers['authorization'];
  if (auth?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(auth.slice(7), config.jwtSecret) as { userId: number };
      req.userId = payload.userId;
    } catch {}
  }

  if (!req.userId) {
    const sid = req.headers['x-session-id'] as string | undefined;
    if (sid) req.sessionId = sid;
  }

  next();
}
