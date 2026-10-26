/** Chemins des pages de l'application : toujours passer par ces constantes, jamais de chaîne en dur. */
export const routes = {
  accueil: '/',
  connexion: '/connexion',
  tableauDeBord: '/tableau-de-bord',
  motDePasse: '/mon-compte/mot-de-passe',
  utilisateurs: '/utilisateurs',
  classes: '/classes',
  nouvelleClasse: '/classes/nouvelle',
  classe: (id: string) => `/classes/${id}`,
  calendrier: '/calendrier',
  /** Salle de classe virtuelle ; animer = démarrage par l'enseignant */
  salle: (id: string, animer = false) => `/seances/${id}/salle${animer ? '?animer=1' : ''}`,
  presences: '/presences',
  mesPresences: '/mes-presences',
  mesCours: '/mes-cours',
  etudiants: '/mes-etudiants',
  documents: '/mes-documents',
  evaluations: '/evaluations',
  messages: '/messages',
  certificats: '/certificats',
  profil: '/mon-profil',
  parametres: '/parametres',
} as const
