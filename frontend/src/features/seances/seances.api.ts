import { apiRequest, query } from '@/lib/api/client'
import type { Seance, SeanceSaisie } from './seances.types'

export const seancesApi = {
  planning: async (debut: Date, fin: Date, classeId?: string) =>
    (
      await apiRequest<{ seances: Seance[] }>(
        `/moi/planning${query({ debut: debut.toISOString(), fin: fin.toISOString(), classeId })}`,
      )
    ).seances,

  obtenir: async (id: string) => (await apiRequest<{ seance: Seance }>(`/seances/${id}`)).seance,

  programmer: async (classeId: string, donnees: SeanceSaisie) =>
    (await apiRequest<{ seances: Pick<Seance, 'id'>[] }>(`/classes/${classeId}/seances`, { method: 'POST', body: donnees }))
      .seances,

  modifier: async (id: string, donnees: Partial<Pick<SeanceSaisie, 'titre' | 'debut' | 'dureeMinutes'>>) =>
    (await apiRequest<{ seance: Seance }>(`/seances/${id}`, { method: 'PATCH', body: donnees })).seance,

  annuler: async (id: string) => (await apiRequest<{ seance: Seance }>(`/seances/${id}/annuler`, { method: 'POST' })).seance,
}
