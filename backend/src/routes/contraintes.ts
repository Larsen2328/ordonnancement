import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../services/prisma';
import { authenticate } from '../middleware/auth';

export const contraIntesRouter = Router();
contraIntesRouter.use(authenticate);

// GET /api/contraintes
contraIntesRouter.get('/', async (_req, res: Response): Promise<void> => {
  const contraintes = await prisma.contrainte.findMany({
    include: { cours: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(contraintes);
});

// POST /api/contraintes
contraIntesRouter.post('/',
  body('type').notEmpty(),
  body('description').notEmpty(),
  async (req, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const { coursId, type, description, parametres, actif } = req.body;
    const contrainte = await prisma.contrainte.create({
      data: { coursId, type, description, parametres: parametres ? JSON.stringify(parametres) : undefined, actif: actif !== false },
    });
    res.status(201).json(contrainte);
  }
);

// PUT /api/contraintes/:id
contraIntesRouter.put('/:id', async (req, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  const { type, description, parametres, actif } = req.body;
  const contrainte = await prisma.contrainte.update({
    where: { id },
    data: { type, description, parametres: parametres ? JSON.stringify(parametres) : undefined, actif },
  });
  res.json(contrainte);
});

// DELETE /api/contraintes/:id
contraIntesRouter.delete('/:id', async (req, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  await prisma.contrainte.delete({ where: { id } });
  res.status(204).send();
});
