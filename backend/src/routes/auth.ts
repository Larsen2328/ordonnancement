import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import prisma from '../services/prisma';
import { authenticate, generateToken, AuthRequest } from '../middleware/auth';

export const authRouter = Router();

// POST /api/auth/login
authRouter.post('/login',
  body('email').isEmail(),
  body('password').notEmpty(),
  async (req, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Identifiants invalides' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: 'Identifiants invalides' });
      return;
    }

    const token = generateToken(user);
    res.json({
      token,
      user: { id: user.id, email: user.email, nom: user.nom, prenom: user.prenom, role: user.role },
    });
  }
);

// GET /api/auth/me
authRouter.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, email: true, nom: true, prenom: true, role: true },
  });
  res.json(user);
});

// POST /api/auth/register (admin only in production)
authRouter.post('/register',
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('nom').notEmpty(),
  body('prenom').notEmpty(),
  body('role').optional().isIn(['ADMIN', 'RESPONSABLE', 'COORDINATEUR', 'FORMATEUR', 'LECTURE']),
  async (req, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password, nom, prenom, role } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email déjà utilisé' });
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashed, nom, prenom, role: role || 'LECTURE' },
    });

    const token = generateToken(user);
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, nom: user.nom, prenom: user.prenom, role: user.role },
    });
  }
);
