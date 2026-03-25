import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../services/prisma';
import { authenticate } from '../middleware/auth';

export const promotionsRouter = Router();
promotionsRouter.use(authenticate);

// GET /api/promotions
promotionsRouter.get('/', async (_req, res: Response): Promise<void> => {
  const promotions = await prisma.promotion.findMany({
    include: {
      cursus: true,
      planifications: {
        include: { cours: true },
        orderBy: { dateDebut: 'asc' },
      },
    },
    orderBy: { dateDebut: 'desc' },
  });
  res.json(promotions);
});

// GET /api/promotions/:id
promotionsRouter.get('/:id', async (req, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  const promotion = await prisma.promotion.findUnique({
    where: { id },
    include: {
      cursus: {
        include: {
          cours: { include: { cours: true }, orderBy: { ordre: 'asc' } },
        },
      },
      planifications: {
        include: {
          cours: { include: { formateurs: { include: { formateur: true } } } },
        },
        orderBy: { dateDebut: 'asc' },
      },
    },
  });
  if (!promotion) {
    res.status(404).json({ error: 'Promotion non trouvée' });
    return;
  }
  res.json(promotion);
});

// POST /api/promotions
promotionsRouter.post('/',
  body('nom').notEmpty(),
  body('code').notEmpty(),
  body('cursusId').isInt(),
  body('dateDebut').isISO8601(),
  body('dateFin').isISO8601(),
  async (req, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const { nom, code, cursusId, dateDebut, dateFin, effectif } = req.body;
    try {
      const promotion = await prisma.promotion.create({
        data: { nom, code, cursusId, dateDebut: new Date(dateDebut), dateFin: new Date(dateFin), effectif },
      });
      res.status(201).json(promotion);
    } catch {
      res.status(409).json({ error: 'Code déjà utilisé' });
    }
  }
);

// PUT /api/promotions/:id
promotionsRouter.put('/:id', async (req, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  const { nom, code, cursusId, dateDebut, dateFin, effectif } = req.body;
  const promotion = await prisma.promotion.update({
    where: { id },
    data: {
      nom, code, cursusId,
      dateDebut: dateDebut ? new Date(dateDebut) : undefined,
      dateFin: dateFin ? new Date(dateFin) : undefined,
      effectif,
    },
  });
  res.json(promotion);
});

// DELETE /api/promotions/:id
promotionsRouter.delete('/:id', async (req, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  await prisma.promotion.delete({ where: { id } });
  res.status(204).send();
});
