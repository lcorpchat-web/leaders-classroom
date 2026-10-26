import type { Role } from '@/features/auth'

export interface UtilisateurAdmin {
  id: string
  nom: string
  prenom: string
  email: string
  telephone: string | null
  role: Role
  matricule: string | null
  specialite: string | null
  photo: string | null
  ville: string | null
  actif: boolean
  doitChangerMotDePasse: boolean
  creeLe: string
}

export interface FiltresUtilisateurs {
  role?: Role
  actif?: boolean
  recherche?: string
  page?: number
  parPage?: number
}

export interface UtilisateurSaisie {
  nom: string
  prenom: string
  email: string
  telephone: string
  role: Role
  matricule: string
  specialite: string
}

export interface ResultatMotDePasse {
  utilisateur: UtilisateurAdmin
  motDePasseProvisoire: string
}
