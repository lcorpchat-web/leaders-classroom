export type Role = 'ADMIN' | 'ENSEIGNANT' | 'APPRENANT'

export interface Utilisateur {
  id: string
  nom: string
  prenom: string
  email: string
  role: Role
}

export interface ConnexionDonnees {
  email: string
  motDePasse: string
  seSouvenir: boolean
}

export const libellesRole: Record<Role, string> = {
  ADMIN: 'Administrateur',
  ENSEIGNANT: 'Enseignant',
  APPRENANT: 'Apprenant',
}
