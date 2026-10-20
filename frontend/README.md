# Leaders Classroom — Frontend

Application React + Vite + TypeScript (SPA).

## Commandes

```bash
npm install
cp .env.example .env.local   # facultatif : URL du site institutionnel, vidéo
npm run dev                  # http://localhost:5173
npm run build                # vérification TypeScript + build de production dans dist/
npm run lint
```

## Organisation du code

```
src/
├── app/                 Point d'entrée applicatif : App, routeur
├── assets/images/       Images (logo, visuels)
├── components/
│   ├── layout/          Structure commune des pages (Header, PublicLayout…)
│   └── ui/              Composants génériques sans logique métier (Button, Container…)
├── config/              Routes, navigation, paramètres du site (lus depuis .env)
├── lib/                 Utilitaires transverses
├── pages/               Une page = un dossier
│   └── home/
│       ├── HomePage.tsx
│       ├── home.content.ts   Textes et chiffres de la page
│       └── sections/         Sections de la page (Hero, Features, Stats)
└── styles/
    ├── tokens.css       Jetons de design : couleurs, typographie, espacements
    └── global.css       Réinitialisation et utilitaires globaux
```

## Conventions

- **Styles** : CSS Modules (`Composant.module.css` à côté du composant). Aucune couleur ni taille en dur :
  toujours les variables de `styles/tokens.css`.
- **Imports** : alias `@/` pour `src/` (ex. `import { Button } from '@/components/ui/Button'`).
- **Composants** : un dossier par composant réutilisable avec un `index.ts` qui l'exporte.
- **Chemins** : toujours via `config/routes.ts`, jamais de chaîne en dur.
- **Contenu** : les textes éditoriaux sont séparés des composants (`*.content.ts`).
- **Secrets** : aucun. Les variables `VITE_*` sont publiques et visibles dans le navigateur.
