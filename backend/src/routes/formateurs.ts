import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../services/prisma';
import { authenticate } from '../middleware/auth';

export const formateursRouter = Router();
formateursRouter.use(authenticate);

// GET /api/formateurs
formateursRouter.get('/', async (_req, res: Response): Promise<void> => {
  const formateurs = await prisma.formateur.findMany({
    include: {
      coursFormateurs: { include: { cours: true } },
      disponibilites: { orderBy: { dateDebut: 'asc' } },
    },
    orderBy: { nom: 'asc' },
  });
  res.json(formateurs);
});

// GET /api/formateurs/:id
formateursRouter.get('/:id', async (req, res: Response): Promise<void> => {
  const id = parseInt(String(req.params["id"]));
  const formateur = await prisma.formateur.findUnique({
    where: { id },
    include: {
      coursFormateurs: { include: { cours: true } },
      disponibilites: { orderBy: { dateDebut: 'asc' } },
    },
  });
  if (!formateur) {
    res.status(404).json({ error: 'Formateur non trouvé' });
    return;
  }
  res.json(formateur);
});

// POST /api/formateurs
formateursRouter.post('/',
  body('nom').notEmpty(),
  body('prenom').notEmpty(),
  body('email').isEmail(),
  async (req, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const { nom, prenom, email, telephone, specialites } = req.body;
    try {
      const formateur = await prisma.formateur.create({
        data: { nom, prenom, email, telephone, specialites: specialites ? JSON.stringify(specialites) : undefined },
      });
      res.status(201).json(formateur);
    } catch {
      res.status(409).json({ error: 'Email déjà utilisé' });
    }
  }
);

// PUT /api/formateurs/:id
formateursRouter.put('/:id', async (req, res: Response): Promise<void> => {
  const id = parseInt(String(req.params["id"]));
  const { nom, prenom, email, telephone, specialites } = req.body;
  const formateur = await prisma.formateur.update({
    where: { id },
    data: { nom, prenom, email, telephone, specialites: specialites ? JSON.stringify(specialites) : undefined },
  });
  res.json(formateur);
});

// DELETE /api/formateurs/:id
formateursRouter.delete('/:id', async (req, res: Response): Promise<void> => {
  const id = parseInt(String(req.params["id"]));
  await prisma.formateur.delete({ where: { id } });
  res.status(204).send();
});

// POST /api/formateurs/:id/disponibilites
formateursRouter.post('/:id/disponibilites',
  body('dateDebut').isISO8601(),
  body('dateFin').isISO8601(),
  async (req, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const formateurId = parseInt(String((req as any).params?.id ?? req.params?.['id']));
    const { dateDebut, dateFin, disponible, motif } = req.body;
    const dispo = await prisma.disponibiliteFormateur.create({
      data: { formateurId, dateDebut: new Date(dateDebut), dateFin: new Date(dateFin), disponible: disponible !== false, motif },
    });
    res.status(201).json(dispo);
  }
);

// DELETE /api/formateurs/disponibilites/:dispoId
formateursRouter.delete('/disponibilites/:dispoId', async (req, res: Response): Promise<void> => {
  const id = parseInt(req.params.dispoId);
  await prisma.disponibiliteFormateur.delete({ where: { id } });
  res.status(204).send();
});
