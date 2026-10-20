# Leaders Classroom

Espace pédagogique en ligne de l'Institut Leader's Corporation : cours, classes virtuelles (BigBlueButton), planning et présences.

## Structure

| Dossier | Contenu |
|---|---|
| `frontend/` | Application React + Vite + TypeScript (SPA) |
| `backend/` | API REST Node.js + Express + TypeScript, PostgreSQL via Prisma |
| `document/` | Cahier de conception et proposition de solution |
| `DESIGN.PNG/` | Maquettes des écrans |

## Prérequis

- Node.js 20 LTS (20.19 ou plus récent)
- Docker Desktop (base PostgreSQL 16 de développement)

## Démarrage

### Base de données

```bash
docker compose up -d   # PostgreSQL 16 sur localhost:5434
```

### Backend

```bash
cd backend
cp .env.example .env   # puis adapter les valeurs
npm install
npm run db:generate    # génère le client Prisma
npm run db:migrate     # applique les migrations
npm run db:seed        # comptes et classe de démonstration
npm run dev            # http://localhost:4000/api/health
```

Scripts : `dev` (rechargement à chaud), `build` (compilation dans `dist/`), `start` (exécute le build), `typecheck`,
`db:generate`, `db:migrate`, `db:deploy` (production), `db:seed`, `db:reset`, `db:studio` (interface graphique de la base).

Comptes de démonstration (mot de passe `Leaders2026!`, développement uniquement) :
`admin@`, `paul.mbuye@`, `jean.dupont@`, `samuel.kouame@` suivis de `leaders-classroom.local`.

### Frontend

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```
