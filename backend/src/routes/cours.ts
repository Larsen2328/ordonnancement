import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../services/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

export const coursRouter = Router();
coursRouter.use(authenticate);

// GET /api/cours
coursRouter.get('/', async (_req, res: Response): Promise<void> => {
  const cours = await prisma.cours.findMany({
    include: {
      competences: { include: { competence: true } },
      formateurs: { include: { formateur: true } },
      prerequis: { include: { prerequis: true } },
      dependances: { include: { cours: true } },
    },
    orderBy: { code: 'asc' },
  });
  res.json(cours);
});

// GET /api/cours/:id
coursRouter.get('/:id', async (req, res: Response): Promise<void> => {
  const id = parseInt(String(req.params["id"]));
  const cours = await prisma.cours.findUnique({
    where: { id },
    include: {
      competences: { include: { competence: true } },
      formateurs: { include: { formateur: true } },
      prerequis: { include: { prerequis: true } },
      dependances: { include: { cours: true } },
      salles: { include: { salle: true } },
    },
  });
  if (!cours) {
    res.status(404).json({ error: 'Cours non trouvé' });
    return;
  }
  res.json(cours);
});

// POST /api/cours
coursRouter.post('/',
  body('code').notEmpty(),
  body('titre').notEmpty(),
  body('dureeHeures').isInt({ min: 1 }),
  body('modalite').optional().isIn(['PRESENTIEL', 'DISTANCIEL', 'HYBRIDE']),
  body('type').optional().isIn(['THEORIQUE', 'TP', 'PROJET', 'EVALUATION', 'ATELIER', 'ACCOMPAGNEMENT']),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const { code, titre, description, dureeHeures, dureeDays, niveau, modalite, type, objectifs, prerequisTexte } = req.body;
    try {
      const cours = await prisma.cours.create({
        data: { code, titre, description, dureeHeures, dureeDays, niveau, modalite, type, objectifs, prerequisTexte },
      });
      await prisma.auditLog.create({
        data: { userId: req.user?.id, action: 'CREATE', entite: 'Cours', entiteId: cours.id },
      });
      res.status(201).json(cours);
    } catch {
      res.status(409).json({ error: 'Code déjà utilisé' });
    }
  }
);

// PUT /api/cours/:id
coursRouter.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params["id"]));
  const { code, titre, description, dureeHeures, dureeDays, niveau, modalite, type, objectifs, prerequisTexte } = req.body;

  const cours = await prisma.cours.update({
    where: { id },
    data: { code, titre, description, dureeHeures, dureeDays, niveau, modalite, type, objectifs, prerequisTexte },
  });
  await prisma.auditLog.create({
    data: { userId: req.user?.id, action: 'UPDATE', entite: 'Cours', entiteId: id },
  });
  res.json(cours);
});

// DELETE /api/cours/:id
coursRouter.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params["id"]));
  await prisma.cours.delete({ where: { id } });
  await prisma.auditLog.create({
    data: { userId: req.user?.id, action: 'DELETE', entite: 'Cours', entiteId: id },
  });
  res.status(204).send();
});

// POST /api/cours/:id/prerequis
coursRouter.post('/:id/prerequis', async (req, res: Response): Promise<void> => {
  const coursId = parseInt(String(req.params["id"]));
  const { prerequisId } = req.body;

  if (coursId === prerequisId) {
    res.status(400).json({ error: 'Un cours ne peut pas être son propre prérequis' });
    return;
  }

  try {
    await prisma.coursPrerequisite.create({ data: { coursId, prerequisId } });
    res.status(201).json({ coursId, prerequisId });
  } catch {
    res.status(409).json({ error: 'Ce prérequis existe déjà' });
  }
});

// DELETE /api/cours/:id/prerequis/:prerequisId
coursRouter.delete('/:id/prerequis/:prerequisId', async (req, res: Response): Promise<void> => {
  const coursId = parseInt(String(req.params["id"]));
  const prerequisId = parseInt(req.params.prerequisId);
  await prisma.coursPrerequisite.deleteMany({ where: { coursId, prerequisId } });
  res.status(204).send();
});

// POST /api/cours/:id/competences
coursRouter.post('/:id/competences', async (req, res: Response): Promise<void> => {
  const coursId = parseInt(String(req.params["id"]));
  const { competenceId } = req.body;
  try {
    await prisma.coursCompetence.create({ data: { coursId, competenceId } });
    res.status(201).json({ coursId, competenceId });
  } catch {
    res.status(409).json({ error: 'Cette compétence est déjà associée' });
  }
});

// DELETE /api/cours/:id/competences/:competenceId
coursRouter.delete('/:id/competences/:competenceId', async (req, res: Response): Promise<void> => {
  const coursId = parseInt(String(req.params["id"]));
  const competenceId = parseInt(req.params.competenceId);
  await prisma.coursCompetence.delete({ where: { coursId_competenceId: { coursId, competenceId } } });
  res.status(204).send();
});

// POST /api/cours/:id/formateurs
coursRouter.post('/:id/formateurs', async (req, res: Response): Promise<void> => {
  const coursId = parseInt(String(req.params["id"]));
  const { formateurId, role } = req.body;
  try {
    await prisma.coursFormateur.create({ data: { coursId, formateurId, role: role || 'PRINCIPAL' } });
    res.status(201).json({ coursId, formateurId });
  } catch {
    res.status(409).json({ error: 'Ce formateur est déjà assigné' });
  }
});

// DELETE /api/cours/:id/formateurs/:formateurId
coursRouter.delete('/:id/formateurs/:formateurId', async (req, res: Response): Promise<void> => {
  const coursId = parseInt(String(req.params["id"]));
  const formateurId = parseInt(req.params.formateurId);
  await prisma.coursFormateur.delete({ where: { coursId_formateurId: { coursId, formateurId } } });
  res.status(204).send();
});
