export type Role = 'ADMIN' | 'ENSEIGNANT' | 'APPRENANT'

export interface Utilisateur {
  id: string
  nom: string
  prenom: string
  email: string
  role: Role
  /** Nom du fichier de la photo de profil (null : initiales) */
  photo: string | null
  /** Mot de passe provisoire : l'utilisateur doit en choisir un nouveau avant de continuer */
  doitChangerMotDePasse: boolean
}

export interface ConnexionDonnees {
  email: string
  motDePasse: string
  seSouvenir: boolean
}

export interface ChangementMotDePasse {
  motDePasseActuel: string
  nouveauMotDePasse: string
}

export const libellesRole: Record<Role, string> = {
  ADMIN: 'Administrateur',
  ENSEIGNANT: 'Enseignant',
  APPRENANT: 'Apprenant',
}
