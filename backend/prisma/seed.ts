import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seed...');

  // ─── Utilisateurs ──────────────────────────────────────────────────────
  const adminPwd = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@formation.fr' },
    update: {},
    create: { email: 'admin@formation.fr', password: adminPwd, nom: 'Admin', prenom: 'Super', role: 'ADMIN' },
  });

  const respPwd = await bcrypt.hash('resp123', 10);
  const responsable = await prisma.user.upsert({
    where: { email: 'responsable@formation.fr' },
    update: {},
    create: { email: 'responsable@formation.fr', password: respPwd, nom: 'Martin', prenom: 'Sophie', role: 'RESPONSABLE' },
  });

  console.log('✅ Utilisateurs créés');

  // ─── Blocs de compétences ─────────────────────────────────────────────
  const bloc1 = await prisma.blocCompetence.upsert({
    where: { code: 'BC-DEV' },
    update: {},
    create: { code: 'BC-DEV', intitule: 'Développement logiciel', description: 'Conception et développement d\'applications', rncp: 'RNCP35475' },
  });
  const bloc2 = await prisma.blocCompetence.upsert({
    where: { code: 'BC-DATA' },
    update: {},
    create: { code: 'BC-DATA', intitule: 'Science des données', description: 'Analyse et traitement des données', rncp: 'RNCP35475' },
  });
  const bloc3 = await prisma.blocCompetence.upsert({
    where: { code: 'BC-ARCHI' },
    update: {},
    create: { code: 'BC-ARCHI', intitule: 'Architecture & DevOps', description: 'Infrastructure et déploiement continu' },
  });

  // ─── Compétences ──────────────────────────────────────────────────────
  const comp1 = await prisma.competence.upsert({ where: { code: 'C-PYTHON' }, update: {}, create: { code: 'C-PYTHON', intitule: 'Programmation Python', blocId: bloc1.id } });
  const comp2 = await prisma.competence.upsert({ where: { code: 'C-JS' }, update: {}, create: { code: 'C-JS', intitule: 'JavaScript / TypeScript', blocId: bloc1.id } });
  const comp3 = await prisma.competence.upsert({ where: { code: 'C-SQL' }, update: {}, create: { code: 'C-SQL', intitule: 'Bases de données SQL', blocId: bloc1.id } });
  const comp4 = await prisma.competence.upsert({ where: { code: 'C-ML' }, update: {}, create: { code: 'C-ML', intitule: 'Machine Learning', blocId: bloc2.id } });
  const comp5 = await prisma.competence.upsert({ where: { code: 'C-DOCKER' }, update: {}, create: { code: 'C-DOCKER', intitule: 'Conteneurisation Docker', blocId: bloc3.id } });
  const comp6 = await prisma.competence.upsert({ where: { code: 'C-GIT' }, update: {}, create: { code: 'C-GIT', intitule: 'Gestion de version Git', blocId: bloc3.id } });
  const comp7 = await prisma.competence.upsert({ where: { code: 'C-ALGO' }, update: {}, create: { code: 'C-ALGO', intitule: 'Algorithmique fondamentale', blocId: bloc1.id } });

  console.log('✅ Compétences créées');

  // ─── Formateurs ───────────────────────────────────────────────────────
  const f1 = await prisma.formateur.upsert({
    where: { email: 'dupont.pierre@formation.fr' },
    update: {},
    create: { nom: 'Dupont', prenom: 'Pierre', email: 'dupont.pierre@formation.fr', telephone: '0601020304', specialites: JSON.stringify(['Python', 'Data Science', 'Machine Learning']) },
  });
  const f2 = await prisma.formateur.upsert({
    where: { email: 'leroy.marie@formation.fr' },
    update: {},
    create: { nom: 'Leroy', prenom: 'Marie', email: 'leroy.marie@formation.fr', telephone: '0605060708', specialites: JSON.stringify(['JavaScript', 'React', 'Node.js']) },
  });
  const f3 = await prisma.formateur.upsert({
    where: { email: 'bernard.jean@formation.fr' },
    update: {},
    create: { nom: 'Bernard', prenom: 'Jean', email: 'bernard.jean@formation.fr', telephone: '0609101112', specialites: JSON.stringify(['Docker', 'Kubernetes', 'CI/CD']) },
  });

  // Indisponibilités formateurs
  const existingDispos = await prisma.disponibiliteFormateur.count({ where: { formateurId: f1.id } });
  if (existingDispos === 0) {
    await prisma.disponibiliteFormateur.createMany({
      data: [
        { formateurId: f1.id, dateDebut: new Date('2024-08-01'), dateFin: new Date('2024-08-31'), disponible: false, motif: 'Congés annuels' },
        { formateurId: f2.id, dateDebut: new Date('2024-12-24'), dateFin: new Date('2025-01-05'), disponible: false, motif: 'Congés de fin d\'année' },
      ],
    });
  }

  console.log('✅ Formateurs créés');

  // ─── Salles ───────────────────────────────────────────────────────────
  const s1 = await prisma.salle.upsert({
    where: { code: 'S-INFO-01' },
    update: {},
    create: { nom: 'Salle Informatique 01', code: 'S-INFO-01', capacite: 20, type: 'SALLE_INFO', equipements: JSON.stringify(['PC', 'Vidéoprojecteur', 'Tableau blanc']), batiment: 'Bâtiment A' },
  });
  const s2 = await prisma.salle.upsert({
    where: { code: 'S-INFO-02' },
    update: {},
    create: { nom: 'Salle Informatique 02', code: 'S-INFO-02', capacite: 25, type: 'SALLE_INFO', equipements: JSON.stringify(['PC', 'Vidéoprojecteur', 'Tableau interactif']), batiment: 'Bâtiment A' },
  });
  const s3 = await prisma.salle.upsert({
    where: { code: 'S-CONF' },
    update: {},
    create: { nom: 'Salle de conférence', code: 'S-CONF', capacite: 40, type: 'SALLE', equipements: JSON.stringify(['Vidéoprojecteur', 'Système audio', 'Webcam']), batiment: 'Bâtiment B' },
  });

  console.log('✅ Salles créées');

  // ─── Cours ────────────────────────────────────────────────────────────
  const cours: Array<{ code: string; titre: string; dureeHeures: number; modalite: string; type: string; prerequisCodes?: string[] }> = [
    { code: 'C01', titre: 'Introduction à l\'algorithmique', dureeHeures: 21, modalite: 'PRESENTIEL', type: 'THEORIQUE' },
    { code: 'C02', titre: 'Python - Bases', dureeHeures: 28, modalite: 'PRESENTIEL', type: 'THEORIQUE', prerequisCodes: ['C01'] },
    { code: 'C03', titre: 'Python - Avancé', dureeHeures: 21, modalite: 'PRESENTIEL', type: 'TP', prerequisCodes: ['C02'] },
    { code: 'C04', titre: 'Bases de données SQL', dureeHeures: 21, modalite: 'PRESENTIEL', type: 'THEORIQUE', prerequisCodes: ['C01'] },
    { code: 'C05', titre: 'Git & GitHub', dureeHeures: 14, modalite: 'PRESENTIEL', type: 'TP' },
    { code: 'C06', titre: 'JavaScript - Fondamentaux', dureeHeures: 28, modalite: 'PRESENTIEL', type: 'THEORIQUE', prerequisCodes: ['C01'] },
    { code: 'C07', titre: 'Introduction au Machine Learning', dureeHeures: 28, modalite: 'PRESENTIEL', type: 'THEORIQUE', prerequisCodes: ['C03', 'C04'] },
    { code: 'C08', titre: 'Projet Data Science', dureeHeures: 35, modalite: 'HYBRIDE', type: 'PROJET', prerequisCodes: ['C07'] },
    { code: 'C09', titre: 'Docker & Déploiement', dureeHeures: 21, modalite: 'PRESENTIEL', type: 'TP', prerequisCodes: ['C05'] },
    { code: 'C10', titre: 'Évaluation finale', dureeHeures: 7, modalite: 'PRESENTIEL', type: 'EVALUATION', prerequisCodes: ['C07', 'C08'] },
  ];

  const coursCreated: Record<string, number> = {};
  for (const c of cours) {
    const created = await prisma.cours.upsert({
      where: { code: c.code },
      update: {},
      create: { code: c.code, titre: c.titre, dureeHeures: c.dureeHeures, modalite: c.modalite, type: c.type },
    });
    coursCreated[c.code] = created.id;
  }

  // Prérequis
  for (const c of cours) {
    if (c.prerequisCodes) {
      for (const prerequisCode of c.prerequisCodes) {
        const coursId = coursCreated[c.code];
        const prerequisId = coursCreated[prerequisCode];
        await prisma.coursPrerequisite.upsert({
          where: { coursId_prerequisId: { coursId, prerequisId } },
          update: {},
          create: { coursId, prerequisId },
        });
      }
    }
  }

  // Compétences des cours
  const compAssociations: Array<{ code: string; compIds: number[] }> = [
    { code: 'C01', compIds: [comp7.id] },
    { code: 'C02', compIds: [comp1.id, comp7.id] },
    { code: 'C03', compIds: [comp1.id] },
    { code: 'C04', compIds: [comp3.id] },
    { code: 'C05', compIds: [comp6.id] },
    { code: 'C06', compIds: [comp2.id] },
    { code: 'C07', compIds: [comp4.id, comp1.id] },
    { code: 'C08', compIds: [comp4.id] },
    { code: 'C09', compIds: [comp5.id] },
    { code: 'C10', compIds: [comp4.id, comp1.id] },
  ];

  for (const assoc of compAssociations) {
    const coursId = coursCreated[assoc.code];
    for (const competenceId of assoc.compIds) {
      await prisma.coursCompetence.upsert({
        where: { coursId_competenceId: { coursId, competenceId } },
        update: {},
        create: { coursId, competenceId },
      });
    }
  }

  // Formateurs des cours
  const formateurAssociations = [
    { coursId: coursCreated['C01'], formateurId: f1.id },
    { coursId: coursCreated['C02'], formateurId: f1.id },
    { coursId: coursCreated['C03'], formateurId: f1.id },
    { coursId: coursCreated['C07'], formateurId: f1.id },
    { coursId: coursCreated['C08'], formateurId: f1.id },
    { coursId: coursCreated['C06'], formateurId: f2.id },
    { coursId: coursCreated['C09'], formateurId: f3.id },
    { coursId: coursCreated['C05'], formateurId: f3.id },
  ];
  for (const fa of formateurAssociations) {
    await prisma.coursFormateur.upsert({
      where: { coursId_formateurId: { coursId: fa.coursId, formateurId: fa.formateurId } },
      update: {},
      create: { coursId: fa.coursId, formateurId: fa.formateurId },
    });
  }

  console.log('✅ Cours créés');

  // ─── Cursus ───────────────────────────────────────────────────────────
  const cursus = await prisma.cursus.upsert({
    where: { code: 'DATASCIENCE-L3' },
    update: {},
    create: {
      code: 'DATASCIENCE-L3',
      intitule: 'Data Science & Intelligence Artificielle - Niveau 6',
      description: 'Formation intensive en science des données et IA pour les métiers de la data',
      niveau: 'Bac+3',
      dureeHeures: 224,
    },
  });

  // Associer tous les cours au cursus
  const coursOrdre = ['C01', 'C05', 'C04', 'C02', 'C06', 'C03', 'C09', 'C07', 'C08', 'C10'];
  for (let i = 0; i < coursOrdre.length; i++) {
    const code = coursOrdre[i];
    const coursId = coursCreated[code];
    await prisma.cursusCours.upsert({
      where: { cursusId_coursId: { cursusId: cursus.id, coursId } },
      update: {},
      create: { cursusId: cursus.id, coursId, ordre: i + 1 },
    });
  }

  console.log('✅ Cursus créé');

  // ─── Promotion ────────────────────────────────────────────────────────
  const promotion = await prisma.promotion.upsert({
    where: { code: 'DS-2024-01' },
    update: {},
    create: {
      nom: 'Data Science - Promotion 2024',
      code: 'DS-2024-01',
      cursusId: cursus.id,
      dateDebut: new Date('2024-09-02'),
      dateFin: new Date('2025-06-30'),
      effectif: 20,
    },
  });

  // Planifications exemples
  const planifData = [
    { code: 'C01', start: '2024-09-02', end: '2024-09-06', salleId: s1.id },
    { code: 'C05', start: '2024-09-09', end: '2024-09-11', salleId: s1.id },
    { code: 'C04', start: '2024-09-12', end: '2024-09-16', salleId: s1.id },
    { code: 'C02', start: '2024-09-23', end: '2024-09-27', salleId: s1.id },
    { code: 'C06', start: '2024-09-30', end: '2024-10-04', salleId: s2.id },
    { code: 'C03', start: '2024-10-07', end: '2024-10-11', salleId: s1.id },
    { code: 'C09', start: '2024-10-14', end: '2024-10-16', salleId: s1.id },
    { code: 'C07', start: '2024-10-21', end: '2024-10-25', salleId: s1.id },
    { code: 'C08', start: '2024-11-04', end: '2024-11-08', salleId: s2.id },
    { code: 'C10', start: '2024-11-18', end: '2024-11-18', salleId: s3.id },
  ];

  for (const p of planifData) {
    await prisma.planification.create({
      data: {
        promotionId: promotion.id,
        coursId: coursCreated[p.code],
        salleId: p.salleId,
        dateDebut: new Date(p.start),
        dateFin: new Date(p.end),
        statut: 'PLANIFIE',
      },
    });
  }

  console.log('✅ Promotion et planifications créées');

  // ─── Logs d'audit ─────────────────────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      { userId: admin.id, action: 'CREATE', entite: 'Cursus', entiteId: cursus.id, nouvelleValeur: JSON.stringify({ code: cursus.code, intitule: cursus.intitule }) },
      { userId: responsable.id, action: 'CREATE', entite: 'Promotion', entiteId: promotion.id, nouvelleValeur: JSON.stringify({ code: promotion.code }) },
    ],
  });

  console.log('✅ Logs d\'audit créés');
  console.log('\n🎉 Seed terminé avec succès !');
  console.log('\n👤 Comptes de test :');
  console.log('  Admin    : admin@formation.fr / admin123');
  console.log('  Responsable : responsable@formation.fr / resp123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
