import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { seancesApi } from './seances.api'
import type { SeanceSaisie } from './seances.types'

export const clesSeances = {
  toutes: ['seances'] as const,
  planning: (debut: Date, fin: Date, classeId?: string) =>
    ['seances', 'planning', debut.toISOString(), fin.toISOString(), classeId ?? null] as const,
}

/** Détail d'une séance visible par l'utilisateur */
export function useSeance(id: string) {
  return useQuery({ queryKey: ['seances', 'detail', id], queryFn: () => seancesApi.obtenir(id), enabled: Boolean(id) })
}

/** Séances visibles par l'utilisateur entre deux instants (GET /api/moi/planning) */
export function usePlanning(debut: Date, fin: Date, classeId?: string) {
  return useQuery({
    queryKey: clesSeances.planning(debut, fin, classeId),
    queryFn: () => seancesApi.planning(debut, fin, classeId),
    placeholderData: keepPreviousData,
  })
}

function useInvaliderSeances() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: clesSeances.toutes }),
      queryClient.invalidateQueries({ queryKey: ['tableau-de-bord'] }),
    ])
}

export function useProgrammerSeances() {
  const invalider = useInvaliderSeances()
  return useMutation({
    mutationFn: ({ classeId, ...donnees }: SeanceSaisie & { classeId: string }) => seancesApi.programmer(classeId, donnees),
    onSuccess: invalider,
  })
}

export function useModifierSeance() {
  const invalider = useInvaliderSeances()
  return useMutation({
    mutationFn: ({ id, ...donnees }: { id: string } & Partial<Pick<SeanceSaisie, 'titre' | 'debut' | 'dureeMinutes'>>) =>
      seancesApi.modifier(id, donnees),
    onSuccess: invalider,
  })
}

export function useAnnulerSeance() {
  const invalider = useInvaliderSeances()
  return useMutation({ mutationFn: (id: string) => seancesApi.annuler(id), onSuccess: invalider })
}
