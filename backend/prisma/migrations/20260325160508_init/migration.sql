-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'LECTURE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Formateur" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "specialites" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Formateur_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DisponibiliteFormateur" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "formateurId" INTEGER NOT NULL,
    "dateDebut" DATETIME NOT NULL,
    "dateFin" DATETIME NOT NULL,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "motif" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DisponibiliteFormateur_formateurId_fkey" FOREIGN KEY ("formateurId") REFERENCES "Formateur" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Salle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "capacite" INTEGER NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'SALLE',
    "equipements" TEXT,
    "batiment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DisponibiliteSalle" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "salleId" INTEGER NOT NULL,
    "dateDebut" DATETIME NOT NULL,
    "dateFin" DATETIME NOT NULL,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "motif" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DisponibiliteSalle_salleId_fkey" FOREIGN KEY ("salleId") REFERENCES "Salle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BlocCompetence" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "intitule" TEXT NOT NULL,
    "description" TEXT,
    "rncp" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Competence" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "intitule" TEXT NOT NULL,
    "description" TEXT,
    "blocId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Competence_blocId_fkey" FOREIGN KEY ("blocId") REFERENCES "BlocCompetence" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cursus" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "intitule" TEXT NOT NULL,
    "description" TEXT,
    "niveau" TEXT,
    "dureeHeures" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CursusVersion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cursusId" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" TEXT NOT NULL,
    "createdBy" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CursusVersion_cursusId_fkey" FOREIGN KEY ("cursusId") REFERENCES "Cursus" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cours" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "dureeHeures" INTEGER NOT NULL,
    "dureeDays" INTEGER,
    "niveau" TEXT,
    "modalite" TEXT NOT NULL DEFAULT 'PRESENTIEL',
    "type" TEXT NOT NULL DEFAULT 'THEORIQUE',
    "objectifs" TEXT,
    "prerequisTexte" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CursusCours" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cursusId" INTEGER NOT NULL,
    "coursId" INTEGER NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "obligatoire" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "CursusCours_cursusId_fkey" FOREIGN KEY ("cursusId") REFERENCES "Cursus" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CursusCours_coursId_fkey" FOREIGN KEY ("coursId") REFERENCES "Cours" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CoursCompetence" (
    "coursId" INTEGER NOT NULL,
    "competenceId" INTEGER NOT NULL,

    PRIMARY KEY ("coursId", "competenceId"),
    CONSTRAINT "CoursCompetence_coursId_fkey" FOREIGN KEY ("coursId") REFERENCES "Cours" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CoursCompetence_competenceId_fkey" FOREIGN KEY ("competenceId") REFERENCES "Competence" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CoursFormateur" (
    "coursId" INTEGER NOT NULL,
    "formateurId" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'PRINCIPAL',

    PRIMARY KEY ("coursId", "formateurId"),
    CONSTRAINT "CoursFormateur_coursId_fkey" FOREIGN KEY ("coursId") REFERENCES "Cours" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CoursFormateur_formateurId_fkey" FOREIGN KEY ("formateurId") REFERENCES "Formateur" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CoursSalle" (
    "coursId" INTEGER NOT NULL,
    "salleId" INTEGER NOT NULL,

    PRIMARY KEY ("coursId", "salleId"),
    CONSTRAINT "CoursSalle_coursId_fkey" FOREIGN KEY ("coursId") REFERENCES "Cours" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CoursSalle_salleId_fkey" FOREIGN KEY ("salleId") REFERENCES "Salle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CoursPrerequisite" (
    "coursId" INTEGER NOT NULL,
    "prerequisId" INTEGER NOT NULL,

    PRIMARY KEY ("coursId", "prerequisId"),
    CONSTRAINT "CoursPrerequisite_coursId_fkey" FOREIGN KEY ("coursId") REFERENCES "Cours" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CoursPrerequisite_prerequisId_fkey" FOREIGN KEY ("prerequisId") REFERENCES "Cours" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Promotion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "cursusId" INTEGER NOT NULL,
    "dateDebut" DATETIME NOT NULL,
    "dateFin" DATETIME NOT NULL,
    "effectif" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Promotion_cursusId_fkey" FOREIGN KEY ("cursusId") REFERENCES "Cursus" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Planification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "promotionId" INTEGER NOT NULL,
    "coursId" INTEGER NOT NULL,
    "salleId" INTEGER,
    "dateDebut" DATETIME NOT NULL,
    "dateFin" DATETIME NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'PLANIFIE',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Planification_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "Promotion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Planification_coursId_fkey" FOREIGN KEY ("coursId") REFERENCES "Cours" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Contrainte" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "coursId" INTEGER,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "parametres" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Contrainte_coursId_fkey" FOREIGN KEY ("coursId") REFERENCES "Cours" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER,
    "action" TEXT NOT NULL,
    "entite" TEXT NOT NULL,
    "entiteId" INTEGER,
    "ancienneValeur" TEXT,
    "nouvelleValeur" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Formateur_userId_key" ON "Formateur"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Formateur_email_key" ON "Formateur"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Salle_code_key" ON "Salle"("code");

-- CreateIndex
CREATE UNIQUE INDEX "BlocCompetence_code_key" ON "BlocCompetence"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Competence_code_key" ON "Competence"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Cursus_code_key" ON "Cursus"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Cours_code_key" ON "Cours"("code");

-- CreateIndex
CREATE UNIQUE INDEX "CursusCours_cursusId_coursId_key" ON "CursusCours"("cursusId", "coursId");

-- CreateIndex
CREATE UNIQUE INDEX "Promotion_code_key" ON "Promotion"("code");

-- CreateIndex
CREATE INDEX "Planification_promotionId_idx" ON "Planification"("promotionId");

-- CreateIndex
CREATE INDEX "Planification_coursId_idx" ON "Planification"("coursId");
