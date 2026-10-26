import { apiRequest } from '@/lib/api/client'
import type { ChangementMotDePasse, ConnexionDonnees, Utilisateur } from './auth.types'

/** Appels de l'API d'authentification et de l'espace personnel. */
export const authApi = {
  async connexion(donnees: ConnexionDonnees): Promise<Utilisateur> {
    const { utilisateur } = await apiRequest<{ utilisateur: Utilisateur }>('/auth/connexion', {
      method: 'POST',
      body: donnees,
    })
    return utilisateur
  },

  async deconnexion(): Promise<void> {
    await apiRequest<void>('/auth/deconnexion', { method: 'POST' })
  },

  async moi(): Promise<Utilisateur> {
    const { utilisateur } = await apiRequest<{ utilisateur: Utilisateur }>('/moi')
    return utilisateur
  },

  changerMotDePasse(donnees: ChangementMotDePasse): Promise<void> {
    return apiRequest<void>('/moi/mot-de-passe', { method: 'PATCH', body: donnees })
  },
}
