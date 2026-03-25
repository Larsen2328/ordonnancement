import { Router, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../services/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

export const cursusRouter = Router();
cursusRouter.use(authenticate);

// GET /api/cursus
cursusRouter.get('/', async (_req, res: Response): Promise<void> => {
  const cursus = await prisma.cursus.findMany({
    include: {
      cours: { include: { cours: true }, orderBy: { ordre: 'asc' } },
      promotions: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(cursus);
});

// GET /api/cursus/:id
cursusRouter.get('/:id', async (req, res: Response): Promise<void> => {
  const id = parseInt(String(req.params["id"]));
  const cursus = await prisma.cursus.findUnique({
    where: { id },
    include: {
      cours: {
        include: {
          cours: {
            include: {
              competences: { include: { competence: true } },
              formateurs: { include: { formateur: true } },
              prerequis: { include: { prerequis: true } },
            },
          },
        },
        orderBy: { ordre: 'asc' },
      },
      promotions: true,
      versions: { orderBy: { version: 'desc' }, take: 5 },
    },
  });
  if (!cursus) {
    res.status(404).json({ error: 'Cursus non trouvé' });
    return;
  }
  res.json(cursus);
});

// POST /api/cursus
cursusRouter.post('/',
  body('code').notEmpty(),
  body('intitule').notEmpty(),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const { code, intitule, description, niveau, dureeHeures } = req.body;
    try {
      const cursus = await prisma.cursus.create({
        data: { code, intitule, description, niveau, dureeHeures },
      });
      await prisma.auditLog.create({
        data: { userId: req.user?.id, action: 'CREATE', entite: 'Cursus', entiteId: cursus.id, nouvelleValeur: JSON.stringify(cursus) },
      });
      res.status(201).json(cursus);
    } catch {
      res.status(409).json({ error: 'Code déjà utilisé' });
    }
  }
);

// PUT /api/cursus/:id
cursusRouter.put('/:id',
  body('intitule').optional().notEmpty(),
  async (req: AuthRequest, res: Response): Promise<void> => {
    const id = parseInt(String(req.params["id"]));
    const { code, intitule, description, niveau, dureeHeures, actif } = req.body;

    const existing = await prisma.cursus.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Cursus non trouvé' });
      return;
    }

    // Create a version snapshot before updating
    await prisma.cursusVersion.create({
      data: {
        cursusId: id,
        version: existing.version,
        snapshot: JSON.stringify(existing),
        createdBy: req.user?.id,
      },
    });

    const cursus = await prisma.cursus.update({
      where: { id },
      data: { code, intitule, description, niveau, dureeHeures, actif, version: { increment: 1 } },
    });
    await prisma.auditLog.create({
      data: { userId: req.user?.id, action: 'UPDATE', entite: 'Cursus', entiteId: id, ancienneValeur: JSON.stringify(existing), nouvelleValeur: JSON.stringify(cursus) },
    });
    res.json(cursus);
  }
);

// DELETE /api/cursus/:id
cursusRouter.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parseInt(String(req.params["id"]));
  await prisma.cursus.delete({ where: { id } });
  await prisma.auditLog.create({
    data: { userId: req.user?.id, action: 'DELETE', entite: 'Cursus', entiteId: id },
  });
  res.status(204).send();
});

// POST /api/cursus/:id/cours - Ajouter un cours au cursus
cursusRouter.post('/:id/cours', async (req: AuthRequest, res: Response): Promise<void> => {
  const cursusId = parseInt(String(req.params["id"]));
  const { coursId, ordre, obligatoire } = req.body;

  try {
    const link = await prisma.cursusCours.create({
      data: { cursusId, coursId, ordre: ordre || 0, obligatoire: obligatoire !== false },
    });
    res.status(201).json(link);
  } catch {
    res.status(409).json({ error: 'Ce cours est déjà dans le cursus' });
  }
});

// DELETE /api/cursus/:id/cours/:coursId
cursusRouter.delete('/:id/cours/:coursId', async (_req, res: Response): Promise<void> => {
  const cursusId = parseInt(_req.params.id);
  const coursId = parseInt(_req.params.coursId);
  await prisma.cursusCours.deleteMany({ where: { cursusId, coursId } });
  res.status(204).send();
});

// PUT /api/cursus/:id/ordre - Réordonner les cours
cursusRouter.put('/:id/ordre', async (req, res: Response): Promise<void> => {
  const cursusId = parseInt(String(req.params["id"]));
  const { ordre } = req.body as { ordre: { coursId: number; ordre: number }[] };

  await Promise.all(
    ordre.map(({ coursId, ordre: o }) =>
      prisma.cursusCours.updateMany({ where: { cursusId, coursId }, data: { ordre: o } })
    )
  );
  res.json({ success: true });
});

// GET /api/cursus/:id/versions
cursusRouter.get('/:id/versions', async (req, res: Response): Promise<void> => {
  const cursusId = parseInt(String(req.params["id"]));
  const versions = await prisma.cursusVersion.findMany({
    where: { cursusId },
    orderBy: { version: 'desc' },
  });
  res.json(versions);
});
