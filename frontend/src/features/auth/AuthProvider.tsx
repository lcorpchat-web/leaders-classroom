import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi } from './auth.api'
import { AuthContext, type AuthContextValue, type StatutSession } from './auth-context'
import type { ConnexionDonnees, Utilisateur } from './auth.types'

interface EtatSession {
  statut: StatutSession
  utilisateur: Utilisateur | null
}

/** Fournit la session de l'utilisateur à toute l'application. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<EtatSession>({ statut: 'chargement', utilisateur: null })

  // Au chargement : restaure la session à partir du cookie httpOnly (GET /api/moi)
  useEffect(() => {
    let actif = true
    authApi
      .moi()
      .then((utilisateur) => actif && setSession({ statut: 'connecte', utilisateur }))
      .catch(() => actif && setSession({ statut: 'deconnecte', utilisateur: null }))
    return () => {
      actif = false
    }
  }, [])

  const connecter = useCallback(async (donnees: ConnexionDonnees) => {
    const utilisateur = await authApi.connexion(donnees)
    setSession({ statut: 'connecte', utilisateur })
    return utilisateur
  }, [])

  const deconnecter = useCallback(async () => {
    try {
      await authApi.deconnexion()
    } finally {
      setSession({ statut: 'deconnecte', utilisateur: null })
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ ...session, connecter, deconnecter }),
    [session, connecter, deconnecter],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
