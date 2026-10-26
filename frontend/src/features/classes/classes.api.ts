import { apiRequest, query, type Page } from '@/lib/api/client'
import type { Classe, ClasseDetail, ClasseSaisie, FiltresClasses, StatutInscription } from './classes.types'

export const classesApi = {
  lister: (filtres: FiltresClasses) => apiRequest<Page<Classe>>(`/classes${query({ ...filtres })}`),

  obtenir: async (id: string) => (await apiRequest<{ classe: ClasseDetail }>(`/classes/${id}`)).classe,

  creer: async (donnees: ClasseSaisie & { enseignantIds: string[] }) =>
    (await apiRequest<{ classe: Classe }>('/classes', { method: 'POST', body: donnees })).classe,

  modifier: async (id: string, donnees: Partial<ClasseSaisie> & { active?: boolean }) =>
    (await apiRequest<{ classe: Classe }>(`/classes/${id}`, { method: 'PATCH', body: donnees })).classe,

  affecterEnseignant: (id: string, enseignantId: string) =>
    apiRequest(`/classes/${id}/enseignants`, { method: 'POST', body: { enseignantId } }),

  retirerEnseignant: (id: string, enseignantId: string) =>
    apiRequest<void>(`/classes/${id}/enseignants/${enseignantId}`, { method: 'DELETE' }),

  inscrire: (id: string, apprenantId: string) =>
    apiRequest(`/classes/${id}/inscriptions`, { method: 'POST', body: { apprenantId } }),

  changerStatutInscription: (id: string, apprenantId: string, statut: Exclude<StatutInscription, 'EN_ATTENTE'>) =>
    apiRequest(`/classes/${id}/inscriptions/${apprenantId}`, { method: 'PATCH', body: { statut } }),
}
