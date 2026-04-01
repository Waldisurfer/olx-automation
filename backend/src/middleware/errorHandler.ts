import type { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

export const errorHandler: ErrorRequestHandler = (err, _req: Request, res: Response, _next: NextFunction) => {
  const status = (err as { status?: number }).status ?? 500;
  const message = err instanceof Error ? err.message : 'Internal server error';
  console.error(`[ERROR] ${status}:`, err);
  res.status(status).json({ error: message });
};

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Not found' });
}
