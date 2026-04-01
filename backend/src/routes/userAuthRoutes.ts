import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getPool } from '../db/database.js';
import { config } from '../config/AppConfig.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

export const userAuthRouter = Router();

userAuthRouter.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) { res.status(400).json({ error: 'Email i hasło są wymagane' }); return; }
    if (password.length < 6) { res.status(400).json({ error: 'Hasło musi mieć minimum 6 znaków' }); return; }

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await getPool().query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
      [email.toLowerCase().trim(), hash]
    );

    const token = jwt.sign({ userId: rows[0].id }, config.jwtSecret, { expiresIn: '30d' });
    res.status(201).json({ token, user: { id: rows[0].id, email: rows[0].email } });
  } catch (err: any) {
    if (err.code === '23505') { res.status(409).json({ error: 'Ten email jest już zajęty' }); return; }
    next(err);
  }
});

userAuthRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) { res.status(400).json({ error: 'Email i hasło są wymagane' }); return; }

    const { rows } = await getPool().query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (!rows.length) { res.status(401).json({ error: 'Nieprawidłowy email lub hasło' }); return; }

    const valid = await bcrypt.compare(password, rows[0].password);
    if (!valid) { res.status(401).json({ error: 'Nieprawidłowy email lub hasło' }); return; }

    const token = jwt.sign({ userId: rows[0].id }, config.jwtSecret, { expiresIn: '30d' });
    res.json({ token, user: { id: rows[0].id, email: rows[0].email } });
  } catch (err) { next(err); }
});

userAuthRouter.get('/me', async (req: AuthRequest, res) => {
  if (!req.userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
  const { rows } = await getPool().query('SELECT id, email FROM users WHERE id = $1', [req.userId]);
  if (!rows.length) { res.status(404).json({ error: 'User not found' }); return; }
  res.json(rows[0]);
});
