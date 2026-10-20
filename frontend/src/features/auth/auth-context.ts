import { createContext } from 'react'
import type { ConnexionDonnees, Utilisateur } from './auth.types'

export type StatutSession = 'chargement' | 'connecte' | 'deconnecte'

export interface AuthContextValue {
  statut: StatutSession
  utilisateur: Utilisateur | null
  connecter: (donnees: ConnexionDonnees) => Promise<Utilisateur>
  deconnecter: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
