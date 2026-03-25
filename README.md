# OrdonForm – Application de gestion pédagogique & ordonnancement des cours

Application web full-stack pour la gestion des cursus de formation dans un établissement d'enseignement supérieur, avec un focus sur l'ordonnancement pédagogique des cours.

## 🏗 Architecture

```
ordonnancement/
├── backend/          # API REST (Node.js + Express + TypeScript + Prisma + SQLite)
└── frontend/         # Interface utilisateur (React + TypeScript + Vite + TailwindCSS)
```

## 🚀 Démarrage rapide

### 1. Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
npm run dev
```

Le serveur démarre sur `http://localhost:3001`

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

L'application démarre sur `http://localhost:5173`

### Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin | admin@formation.fr | admin123 |
| Responsable | responsable@formation.fr | resp123 |

## 🔀 Algorithme d'ordonnancement (Kahn)

L'ordonnancement utilise l'**algorithme de Kahn** (tri topologique) :

1. Les cours sans prérequis sont placés en premier
2. Leurs dépendants sont placés ensuite
3. Les cycles sont détectés et signalés
4. Chaque position est expliquée ("placé après ses prérequis X, Y")
5. L'ordre calculé peut être appliqué au cursus en un clic

## 📦 Technologies

**Backend** : Node.js + Express + TypeScript + Prisma + SQLite + JWT + Winston

**Frontend** : React 18 + TypeScript + Vite + TailwindCSS + TanStack Query + Recharts
