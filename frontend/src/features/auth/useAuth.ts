import { use } from 'react'
import { AuthContext } from './auth-context'

/** Accès à la session courante (utilisateur, connexion, déconnexion). */
export function useAuth() {
  const contexte = use(AuthContext)
  if (!contexte) {
    throw new Error('useAuth doit être utilisé à l’intérieur de <AuthProvider>')
  }
  return contexte
}
