import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { EVENEMENT_SESSION_EXPIREE } from '@/lib/api/client'
import { authApi } from './auth.api'
import { AuthContext, type AuthContextValue, type StatutSession } from './auth-context'
import type { ConnexionDonnees, Utilisateur } from './auth.types'

interface EtatSession {
  statut: StatutSession
  utilisateur: Utilisateur | null
}

const DECONNECTE: EtatSession = { statut: 'deconnecte', utilisateur: null }

/** Fournit la session de l'utilisateur à toute l'application. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [session, setSession] = useState<EtatSession>({ statut: 'chargement', utilisateur: null })

  // Au chargement : restaure la session à partir du cookie httpOnly (GET /api/moi)
  useEffect(() => {
    let actif = true
    authApi
      .moi()
      .then((utilisateur) => actif && setSession({ statut: 'connecte', utilisateur }))
      .catch(() => actif && setSession(DECONNECTE))
    return () => {
      actif = false
    }
  }, [])

  // Session expirée ou compte désactivé en cours de navigation : retour à l'état déconnecté
  useEffect(() => {
    const onExpiration = () => {
      setSession(DECONNECTE)
      queryClient.clear()
    }
    window.addEventListener(EVENEMENT_SESSION_EXPIREE, onExpiration)
    return () => window.removeEventListener(EVENEMENT_SESSION_EXPIREE, onExpiration)
  }, [queryClient])

  const connecter = useCallback(
    async (donnees: ConnexionDonnees) => {
      const utilisateur = await authApi.connexion(donnees)
      queryClient.clear()
      setSession({ statut: 'connecte', utilisateur })
      return utilisateur
    },
    [queryClient],
  )

  const deconnecter = useCallback(async () => {
    try {
      await authApi.deconnexion()
    } finally {
      setSession(DECONNECTE)
      // Aucune donnée du compte précédent ne doit rester en mémoire
      queryClient.clear()
    }
  }, [queryClient])

  const rafraichir = useCallback(async () => {
    const utilisateur = await authApi.moi()
    setSession({ statut: 'connecte', utilisateur })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ ...session, connecter, deconnecter, rafraichir }),
    [session, connecter, deconnecter, rafraichir],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
