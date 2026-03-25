import { Router, Response } from 'express';
import prisma from '../services/prisma';
import { authenticate } from '../middleware/auth';

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);

// GET /api/dashboard
dashboardRouter.get('/', async (_req, res: Response): Promise<void> => {
  const [
    nbCursus,
    nbCours,
    nbFormateurs,
    nbSalles,
    nbPromotions,
    nbCompetences,
    coursByType,
    coursByModalite,
    recentLogs,
  ] = await Promise.all([
    prisma.cursus.count(),
    prisma.cours.count(),
    prisma.formateur.count(),
    prisma.salle.count(),
    prisma.promotion.count(),
    prisma.competence.count(),
    prisma.cours.groupBy({ by: ['type'], _count: { id: true } }),
    prisma.cours.groupBy({ by: ['modalite'], _count: { id: true } }),
    prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { nom: true, prenom: true } } },
    }),
  ]);

  // Volume horaire total
  const volumeHoraire = await prisma.cours.aggregate({ _sum: { dureeHeures: true } });

  // Charge par formateur
  const chargeFormateurs = await prisma.coursFormateur.groupBy({
    by: ['formateurId'],
    _count: { coursId: true },
  });

  res.json({
    statistiques: {
      nbCursus,
      nbCours,
      nbFormateurs,
      nbSalles,
      nbPromotions,
      nbCompetences,
      volumeHoraireTotalHeures: volumeHoraire._sum.dureeHeures || 0,
    },
    repartitionParType: coursByType.map(r => ({ type: r.type, count: r._count.id })),
    repartitionParModalite: coursByModalite.map(r => ({ modalite: r.modalite, count: r._count.id })),
    chargeFormateurs: chargeFormateurs.map(r => ({
      formateurId: r.formateurId,
      nbCours: r._count.coursId,
    })),
    activiteRecente: recentLogs,
  });
});
