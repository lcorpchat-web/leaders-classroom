import { apiRequest, query, type Page } from '@/lib/api/client'
import type { FiltresUtilisateurs, ResultatMotDePasse, UtilisateurAdmin, UtilisateurSaisie } from './utilisateurs.types'

export const utilisateursApi = {
  lister: (filtres: FiltresUtilisateurs) =>
    apiRequest<Page<UtilisateurAdmin>>(`/utilisateurs${query({ ...filtres })}`),

  creer: (donnees: UtilisateurSaisie) =>
    apiRequest<ResultatMotDePasse>('/utilisateurs', { method: 'POST', body: donnees }),

  modifier: (id: string, donnees: Partial<Omit<UtilisateurSaisie, 'role'>> & { actif?: boolean }) =>
    apiRequest<{ utilisateur: UtilisateurAdmin }>(`/utilisateurs/${id}`, { method: 'PATCH', body: donnees }),

  reinitialiserMotDePasse: (id: string) =>
    apiRequest<ResultatMotDePasse>(`/utilisateurs/${id}/reinitialiser-mot-de-passe`, { method: 'POST' }),
}
