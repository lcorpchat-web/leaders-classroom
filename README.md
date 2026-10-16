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

- Node.js 20.19 ou plus récent
- PostgreSQL 15 ou plus récent (à partir de l'étape 2)

## Démarrage

### Backend

```bash
cd backend
cp .env.example .env   # puis adapter les valeurs
npm install
npm run dev            # http://localhost:4000/api/health
```

Scripts : `dev` (rechargement à chaud), `build` (compilation dans `dist/`), `start` (exécute le build), `typecheck`.

### Frontend

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```
