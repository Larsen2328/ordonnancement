import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../services/prisma';
import { authenticate } from '../middleware/auth';

export const competencesRouter = Router();
competencesRouter.use(authenticate);

// GET /api/competences
competencesRouter.get('/', async (_req, res: Response): Promise<void> => {
  const competences = await prisma.competence.findMany({
    include: { bloc: true },
    orderBy: { code: 'asc' },
  });
  res.json(competences);
});

// GET /api/competences/blocs
competencesRouter.get('/blocs', async (_req, res: Response): Promise<void> => {
  const blocs = await prisma.blocCompetence.findMany({
    include: { competences: true },
    orderBy: { code: 'asc' },
  });
  res.json(blocs);
});

// POST /api/competences/blocs
competencesRouter.post('/blocs',
  body('code').notEmpty(),
  body('intitule').notEmpty(),
  async (req, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const { code, intitule, description, rncp } = req.body;
    try {
      const bloc = await prisma.blocCompetence.create({ data: { code, intitule, description, rncp } });
      res.status(201).json(bloc);
    } catch {
      res.status(409).json({ error: 'Code déjà utilisé' });
    }
  }
);

// POST /api/competences
competencesRouter.post('/',
  body('code').notEmpty(),
  body('intitule').notEmpty(),
  async (req, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const { code, intitule, description, blocId } = req.body;
    try {
      const competence = await prisma.competence.create({ data: { code, intitule, description, blocId } });
      res.status(201).json(competence);
    } catch {
      res.status(409).json({ error: 'Code déjà utilisé' });
    }
  }
);

// PUT /api/competences/:id
competencesRouter.put('/:id', async (req, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  const { code, intitule, description, blocId } = req.body;
  const competence = await prisma.competence.update({ where: { id }, data: { code, intitule, description, blocId } });
  res.json(competence);
});

// DELETE /api/competences/:id
competencesRouter.delete('/:id', async (req, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  await prisma.competence.delete({ where: { id } });
  res.status(204).send();
});
