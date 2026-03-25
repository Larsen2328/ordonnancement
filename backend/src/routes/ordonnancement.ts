import { Router, Response } from 'express';
import prisma from '../services/prisma';
import { authenticate } from '../middleware/auth';

export const ordonancementRouter = Router();
ordonancementRouter.use(authenticate);

// ─── Types internes ────────────────────────────────────────────────────────────

interface CoursNode {
  id: number;
  code: string;
  titre: string;
  dureeHeures: number;
  prerequisIds: number[];
  ordre: number;
}

interface OrdreSuggere {
  coursId: number;
  code: string;
  titre: string;
  ordreCalcule: number;
  raisonnement: string;
}

interface Alerte {
  type: 'CYCLE' | 'PREREQUIS_NON_RESPECTE' | 'CHEVAUCHEMENT' | 'FORMATEUR_INDISPONIBLE' | 'SALLE_INDISPONIBLE' | 'BLOC_INCOMPLET';
  message: string;
  coursId?: number;
  coursCode?: string;
  severite: 'ERROR' | 'WARNING' | 'INFO';
}

// ─── Tri topologique (algorithme de Kahn) ─────────────────────────────────────

/**
 * Kahn's algorithm pour tri topologique avec détection de cycle.
 * Retourne l'ordre calculé ou null si un cycle est détecté.
 *
 * Justification : L'algorithme de Kahn est idéal car :
 * - Il détecte les cycles (prérequis circulaires) nativement
 * - Il produit un ordre de priorité basé sur les dépendances
 * - Complexité O(V+E) : performant même pour de grands cursus
 * - Les résultats sont explicables : chaque nœud est placé après ses prérequis
 */
function triTopologique(cours: CoursNode[]): { ordre: number[]; cycle: boolean } {
  const inDegree = new Map<number, number>();
  const adjacence = new Map<number, number[]>();

  for (const c of cours) {
    if (!inDegree.has(c.id)) inDegree.set(c.id, 0);
    if (!adjacence.has(c.id)) adjacence.set(c.id, []);
  }

  for (const c of cours) {
    for (const prerequisId of c.prerequisIds) {
      adjacence.get(prerequisId)?.push(c.id);
      inDegree.set(c.id, (inDegree.get(c.id) || 0) + 1);
    }
  }

  // File des nœuds sans prérequis (tri par ordre manuel pour cohérence)
  const queue: number[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }
  queue.sort((a, b) => {
    const ca = cours.find(c => c.id === a);
    const cb = cours.find(c => c.id === b);
    return (ca?.ordre || 0) - (cb?.ordre || 0);
  });

  const resultat: number[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    resultat.push(current);

    const voisins = adjacence.get(current) || [];
    for (const voisin of voisins) {
      const newDeg = (inDegree.get(voisin) || 0) - 1;
      inDegree.set(voisin, newDeg);
      if (newDeg === 0) {
        queue.push(voisin);
        queue.sort((a, b) => {
          const ca = cours.find(c => c.id === a);
          const cb = cours.find(c => c.id === b);
          return (ca?.ordre || 0) - (cb?.ordre || 0);
        });
      }
    }
  }

  return {
    ordre: resultat,
    cycle: resultat.length !== cours.length,
  };
}

// ─── Détection d'alertes ──────────────────────────────────────────────────────

function detecterAlertes(cours: CoursNode[], ordreTopo: number[]): Alerte[] {
  const alertes: Alerte[] = [];
  const positionParId = new Map<number, number>();
  ordreTopo.forEach((id, idx) => positionParId.set(id, idx));

  for (const c of cours) {
    for (const prerequisId of c.prerequisIds) {
      const posCours = positionParId.get(c.id) ?? Infinity;
      const posPrereq = positionParId.get(prerequisId) ?? Infinity;
      if (posPrereq >= posCours) {
        const prerequis = cours.find(x => x.id === prerequisId);
        alertes.push({
          type: 'PREREQUIS_NON_RESPECTE',
          message: `Le cours "${c.titre}" (${c.code}) est placé avant son prérequis "${prerequis?.titre || prerequisId}"`,
          coursId: c.id,
          coursCode: c.code,
          severite: 'ERROR',
        });
      }
    }
  }

  return alertes;
}

// ─── GET /api/ordonnancement/cursus/:cursusId ─────────────────────────────────

ordonancementRouter.get('/cursus/:cursusId', async (req, res: Response): Promise<void> => {
  const cursusId = parseInt(req.params.cursusId);

  const cursus = await prisma.cursus.findUnique({
    where: { id: cursusId },
    include: {
      cours: {
        include: {
          cours: {
            include: {
              prerequis: true,
              competences: { include: { competence: { include: { bloc: true } } } },
              formateurs: { include: { formateur: { include: { disponibilites: true } } } },
            },
          },
        },
        orderBy: { ordre: 'asc' },
      },
    },
  });

  if (!cursus) {
    res.status(404).json({ error: 'Cursus non trouvé' });
    return;
  }

  const coursList: CoursNode[] = cursus.cours.map(cc => ({
    id: cc.cours.id,
    code: cc.cours.code,
    titre: cc.cours.titre,
    dureeHeures: cc.cours.dureeHeures,
    prerequisIds: cc.cours.prerequis.map(p => p.prerequisId),
    ordre: cc.ordre,
  }));

  const { ordre: ordreTopo, cycle } = triTopologique(coursList);

  const alertes: Alerte[] = [];

  if (cycle) {
    alertes.push({
      type: 'CYCLE',
      message: 'Un cycle de dépendances a été détecté dans les prérequis. Vérifiez les dépendances entre cours.',
      severite: 'ERROR',
    });
  } else {
    alertes.push(...detecterAlertes(coursList, ordreTopo));
  }

  // Vérification couverture des blocs de compétences
  const blocsCouverts = new Set<number>();
  const tousBlocs = new Set<number>();
  for (const cc of cursus.cours) {
    for (const comp of cc.cours.competences) {
      if (comp.competence.blocId) {
        blocsCouverts.add(comp.competence.blocId);
        tousBlocs.add(comp.competence.blocId);
      }
    }
  }

  // Suggestions d'ordre
  const suggestions: OrdreSuggere[] = ordreTopo.map((id, idx) => {
    const cours = coursList.find(c => c.id === id)!;
    const prerequiss = cours.prerequisIds.map(pid => coursList.find(c => c.id === pid)?.titre || pid);
    let raisonnement = idx === 0
      ? 'Premier cours : aucun prérequis requis'
      : `Placé après ses prérequis${prerequiss.length > 0 ? ` (${prerequiss.join(', ')})` : ''}`;
    return { coursId: id, code: cours.code, titre: cours.titre, ordreCalcule: idx + 1, raisonnement };
  });

  res.json({
    cursusId,
    intitule: cursus.intitule,
    nombreCours: coursList.length,
    ordreSuggere: suggestions,
    alertes,
    ordreActuel: cursus.cours.map(cc => ({
      coursId: cc.coursId,
      code: cc.cours.code,
      titre: cc.cours.titre,
      ordre: cc.ordre,
    })),
  });
});

// ─── POST /api/ordonnancement/cursus/:cursusId/appliquer ──────────────────────
// Applique le tri topologique comme ordre officiel

ordonancementRouter.post('/cursus/:cursusId/appliquer', async (req, res: Response): Promise<void> => {
  const cursusId = parseInt(req.params.cursusId);

  const cursus = await prisma.cursus.findUnique({
    where: { id: cursusId },
    include: {
      cours: {
        include: { cours: { include: { prerequis: true } } },
        orderBy: { ordre: 'asc' },
      },
    },
  });

  if (!cursus) {
    res.status(404).json({ error: 'Cursus non trouvé' });
    return;
  }

  const coursList: CoursNode[] = cursus.cours.map(cc => ({
    id: cc.cours.id,
    code: cc.cours.code,
    titre: cc.cours.titre,
    dureeHeures: cc.cours.dureeHeures,
    prerequisIds: cc.cours.prerequis.map(p => p.prerequisId),
    ordre: cc.ordre,
  }));

  const { ordre: ordreTopo, cycle } = triTopologique(coursList);

  if (cycle) {
    res.status(422).json({ error: 'Impossible d\'appliquer l\'ordre : cycle de dépendances détecté' });
    return;
  }

  // Applique l'ordre calculé
  await Promise.all(
    ordreTopo.map((coursId, idx) =>
      prisma.cursusCours.updateMany({
        where: { cursusId, coursId },
        data: { ordre: idx + 1 },
      })
    )
  );

  res.json({ success: true, message: `Ordre appliqué pour ${ordreTopo.length} cours` });
});

// ─── GET /api/ordonnancement/promotion/:promotionId/alertes ───────────────────
// Détecte les conflits pour une promotion planifiée

ordonancementRouter.get('/promotion/:promotionId/alertes', async (req, res: Response): Promise<void> => {
  const promotionId = parseInt(req.params.promotionId);

  const planifications = await prisma.planification.findMany({
    where: { promotionId },
    include: {
      cours: {
        include: {
          prerequis: true,
          formateurs: { include: { formateur: { include: { disponibilites: true } } } },
        },
      },
    },
    orderBy: { dateDebut: 'asc' },
  });

  const alertes: Alerte[] = [];

  // Vérification des chevauchements
  for (let i = 0; i < planifications.length; i++) {
    for (let j = i + 1; j < planifications.length; j++) {
      const a = planifications[i];
      const b = planifications[j];
      const chevauchement = a.dateDebut < b.dateFin && b.dateDebut < a.dateFin;
      if (chevauchement && a.salleId && b.salleId && a.salleId === b.salleId) {
        alertes.push({
          type: 'CHEVAUCHEMENT',
          message: `Chevauchement de salle entre "${a.cours.titre}" et "${b.cours.titre}"`,
          coursId: a.coursId,
          severite: 'ERROR',
        });
      }
    }
  }

  // Vérification des prérequis respectés dans la planification
  const coursParId = new Map(planifications.map(p => [p.coursId, p]));
  for (const planif of planifications) {
    for (const prereq of planif.cours.prerequis) {
      const planifPrereq = coursParId.get(prereq.prerequisId);
      if (planifPrereq && planifPrereq.dateFin > planif.dateDebut) {
        alertes.push({
          type: 'PREREQUIS_NON_RESPECTE',
          message: `Le cours "${planif.cours.titre}" commence avant la fin de son prérequis`,
          coursId: planif.coursId,
          coursCode: planif.cours.code,
          severite: 'ERROR',
        });
      }
    }
  }

  // Vérification disponibilité formateurs
  for (const planif of planifications) {
    for (const cf of planif.cours.formateurs) {
      const indispos = cf.formateur.disponibilites.filter(d => !d.disponible);
      for (const indispo of indispos) {
        const conflit =
          indispo.dateDebut <= planif.dateFin &&
          indispo.dateFin >= planif.dateDebut;
        if (conflit) {
          alertes.push({
            type: 'FORMATEUR_INDISPONIBLE',
            message: `Le formateur ${cf.formateur.prenom} ${cf.formateur.nom} est indisponible lors du cours "${planif.cours.titre}"`,
            coursId: planif.coursId,
            coursCode: planif.cours.code,
            severite: 'ERROR',
          });
        }
      }
    }
  }

  res.json({ promotionId, nombreAlertes: alertes.length, alertes });
});
