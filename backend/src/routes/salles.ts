import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../services/prisma';
import { authenticate } from '../middleware/auth';

export const sallesRouter = Router();
sallesRouter.use(authenticate);

// GET /api/salles
sallesRouter.get('/', async (_req, res: Response): Promise<void> => {
  const salles = await prisma.salle.findMany({
    include: { disponibilites: { orderBy: { dateDebut: 'asc' } } },
    orderBy: { nom: 'asc' },
  });
  res.json(salles);
});

// GET /api/salles/:id
sallesRouter.get('/:id', async (req, res: Response): Promise<void> => {
  const id = parseInt(req.params.id as string);
  const salle = await prisma.salle.findUnique({
    where: { id },
    include: { disponibilites: true },
  });
  if (!salle) {
    res.status(404).json({ error: 'Salle non trouvée' });
    return;
  }
  res.json(salle);
});

// POST /api/salles
sallesRouter.post('/',
  body('nom').notEmpty(),
  body('code').notEmpty(),
  body('capacite').isInt({ min: 1 }),
  async (req, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const { nom, code, capacite, type, equipements, batiment } = req.body;
    try {
      const salle = await prisma.salle.create({
        data: { nom, code, capacite, type, equipements: equipements ? JSON.stringify(equipements) : undefined, batiment },
      });
      res.status(201).json(salle);
    } catch {
      res.status(409).json({ error: 'Code déjà utilisé' });
    }
  }
);

// PUT /api/salles/:id
sallesRouter.put('/:id', async (req, res: Response): Promise<void> => {
  const id = parseInt(req.params.id as string);
  const { nom, code, capacite, type, equipements, batiment } = req.body;
  const salle = await prisma.salle.update({
    where: { id },
    data: { nom, code, capacite, type, equipements: equipements ? JSON.stringify(equipements) : undefined, batiment },
  });
  res.json(salle);
});

// DELETE /api/salles/:id
sallesRouter.delete('/:id', async (req, res: Response): Promise<void> => {
  const id = parseInt(req.params.id as string);
  await prisma.salle.delete({ where: { id } });
  res.status(204).send();
});

// POST /api/salles/:id/disponibilites
sallesRouter.post('/:id/disponibilites',
  body('dateDebut').isISO8601(),
  body('dateFin').isISO8601(),
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const salleId = parseInt(req.params.id);
    const { dateDebut, dateFin, disponible, motif } = req.body;
    const dispo = await prisma.disponibiliteSalle.create({
      data: { salleId, dateDebut: new Date(dateDebut), dateFin: new Date(dateFin), disponible: disponible !== false, motif },
    });
    res.status(201).json(dispo);
  }
);
