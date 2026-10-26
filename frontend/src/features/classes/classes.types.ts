export interface Personne {
  id: string
  nom: string
  prenom: string
  email: string
  photo?: string | null
}

export interface Classe {
  id: string
  nom: string
  description: string | null
  dateDebut: string
  dateFin: string | null
  capaciteMax: number | null
  /** Maquette 04 : vignette, catégorie, niveau, langue d'enseignement */
  image: string | null
  categorie: string | null
  niveau: string | null
  langue: string | null
  active: boolean
  creeLe: string
  enseignants: Personne[]
  /** Apprenants dont l'inscription est VALIDEE */
  nbApprenants: number
}

export type StatutInscription = 'EN_ATTENTE' | 'VALIDEE' | 'RETIREE'

export interface Inscription {
  statut: StatutInscription
  dateInscription: string
  apprenant: Personne & { matricule: string | null; actif: boolean }
}

export interface ClasseDetail extends Classe {
  /** Vide pour un apprenant ; inscriptions VALIDEE seulement pour un enseignant */
  inscriptions: Inscription[]
}

export interface FiltresClasses {
  active?: boolean
  recherche?: string
  page?: number
  parPage?: number
}

export interface ClasseSaisie {
  nom: string
  description: string
  dateDebut: string
  dateFin: string | null
  capaciteMax: number | null
  categorie?: string | null
  niveau?: string | null
  langue?: string | null
}

export const libellesStatutInscription: Record<StatutInscription, string> = {
  EN_ATTENTE: 'En attente',
  VALIDEE: 'Validée',
  RETIREE: 'Retirée',
}
