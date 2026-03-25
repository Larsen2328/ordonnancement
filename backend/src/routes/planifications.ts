import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../services/prisma';
import { authenticate } from '../middleware/auth';

export const planificationsRouter = Router();
planificationsRouter.use(authenticate);

// GET /api/planifications?promotionId=X
planificationsRouter.get('/', async (req, res: Response): Promise<void> => {
  const promotionId = req.query.promotionId ? parseInt(req.query.promotionId as string) : undefined;
  const planifications = await prisma.planification.findMany({
    where: promotionId ? { promotionId } : undefined,
    include: {
      cours: {
        include: {
          formateurs: { include: { formateur: true } },
          competences: { include: { competence: true } },
        },
      },
      promotion: true,
    },
    orderBy: { dateDebut: 'asc' },
  });
  res.json(planifications);
});

// POST /api/planifications
planificationsRouter.post('/',
  body('promotionId').isInt(),
  body('coursId').isInt(),
  body('dateDebut').isISO8601(),
  body('dateFin').isISO8601(),
  async (req, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const { promotionId, coursId, salleId, dateDebut, dateFin, statut, notes } = req.body;
    const planification = await prisma.planification.create({
      data: {
        promotionId,
        coursId,
        salleId,
        dateDebut: new Date(dateDebut),
        dateFin: new Date(dateFin),
        statut: statut || 'PLANIFIE',
        notes,
      },
      include: { cours: true, promotion: true },
    });
    res.status(201).json(planification);
  }
);

// PUT /api/planifications/:id
planificationsRouter.put('/:id', async (req, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  const { salleId, dateDebut, dateFin, statut, notes } = req.body;
  const planification = await prisma.planification.update({
    where: { id },
    data: {
      salleId,
      dateDebut: dateDebut ? new Date(dateDebut) : undefined,
      dateFin: dateFin ? new Date(dateFin) : undefined,
      statut,
      notes,
    },
    include: { cours: true, promotion: true },
  });
  res.json(planification);
});

// DELETE /api/planifications/:id
planificationsRouter.delete('/:id', async (req, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  await prisma.planification.delete({ where: { id } });
  res.status(204).send();
});
