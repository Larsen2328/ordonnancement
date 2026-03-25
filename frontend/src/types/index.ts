// ─── Entités principales ──────────────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: string;
}

export interface BlocCompetence {
  id: number;
  code: string;
  intitule: string;
  description?: string;
  rncp?: string;
}

export interface Competence {
  id: number;
  code: string;
  intitule: string;
  description?: string;
  blocId?: number;
  bloc?: BlocCompetence;
}

export interface Formateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  specialites?: string;
  disponibilites?: DisponibiliteFormateur[];
  coursFormateurs?: { cours: Cours }[];
}

export interface DisponibiliteFormateur {
  id: number;
  formateurId: number;
  dateDebut: string;
  dateFin: string;
  disponible: boolean;
  motif?: string;
}

export interface Salle {
  id: number;
  nom: string;
  code: string;
  capacite: number;
  type: string;
  equipements?: string;
  batiment?: string;
  disponibilites?: DisponibiliteSalle[];
}

export interface DisponibiliteSalle {
  id: number;
  salleId: number;
  dateDebut: string;
  dateFin: string;
  disponible: boolean;
  motif?: string;
}

export interface Cours {
  id: number;
  code: string;
  titre: string;
  description?: string;
  dureeHeures: number;
  dureeDays?: number;
  niveau?: string;
  modalite: 'PRESENTIEL' | 'DISTANCIEL' | 'HYBRIDE';
  type: 'THEORIQUE' | 'TP' | 'PROJET' | 'EVALUATION' | 'ATELIER' | 'ACCOMPAGNEMENT';
  objectifs?: string;
  prerequisTexte?: string;
  competences?: { competence: Competence }[];
  formateurs?: { formateur: Formateur; role: string }[];
  prerequis?: { prerequis: Cours }[];
  dependances?: { cours: Cours }[];
}

export interface CursusCours {
  coursId: number;
  ordre: number;
  obligatoire: boolean;
  cours: Cours;
}

export interface Cursus {
  id: number;
  code: string;
  intitule: string;
  description?: string;
  niveau?: string;
  dureeHeures?: number;
  version: number;
  actif: boolean;
  cours?: CursusCours[];
  promotions?: Promotion[];
}

export interface Promotion {
  id: number;
  nom: string;
  code: string;
  cursusId: number;
  dateDebut: string;
  dateFin: string;
  effectif?: number;
  cursus?: Cursus;
  planifications?: Planification[];
}

export interface Planification {
  id: number;
  promotionId: number;
  coursId: number;
  salleId?: number;
  dateDebut: string;
  dateFin: string;
  statut: 'PLANIFIE' | 'CONFIRME' | 'ANNULE';
  notes?: string;
  cours?: Cours;
  promotion?: Promotion;
}

export interface Contrainte {
  id: number;
  coursId?: number;
  type: string;
  description: string;
  parametres?: string;
  actif: boolean;
  cours?: Cours;
}

// ─── Ordonnancement ───────────────────────────────────────────────────────────

export interface OrdreItem {
  coursId: number;
  code: string;
  titre: string;
  ordreCalcule: number;
  raisonnement: string;
}

export interface Alerte {
  type: string;
  message: string;
  coursId?: number;
  coursCode?: string;
  severite: 'ERROR' | 'WARNING' | 'INFO';
}

export interface OrdonancementResult {
  cursusId: number;
  intitule: string;
  nombreCours: number;
  ordreSuggere: OrdreItem[];
  alertes: Alerte[];
  ordreActuel: { coursId: number; code: string; titre: string; ordre: number }[];
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardData {
  statistiques: {
    nbCursus: number;
    nbCours: number;
    nbFormateurs: number;
    nbSalles: number;
    nbPromotions: number;
    nbCompetences: number;
    volumeHoraireTotalHeures: number;
  };
  repartitionParType: { type: string; count: number }[];
  repartitionParModalite: { modalite: string; count: number }[];
  chargeFormateurs: { formateurId: number; nbCours: number }[];
  activiteRecente: AuditLog[];
}

export interface AuditLog {
  id: number;
  userId?: number;
  action: string;
  entite: string;
  entiteId?: number;
  ancienneValeur?: string;
  nouvelleValeur?: string;
  createdAt: string;
  user?: { nom: string; prenom: string };
}
