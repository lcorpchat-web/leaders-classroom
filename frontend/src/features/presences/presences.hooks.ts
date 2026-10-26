import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { presencesApi, type StatutPresence } from './presences.api'

export const clesPresences = {
  toutes: ['presences'] as const,
  feuille: (seanceId: string) => ['presences', 'feuille', seanceId] as const,
  miennes: ['presences', 'miennes'] as const,
  rapport: (classeId: string) => ['presences', 'rapport', classeId] as const,
}

export function useFeuillePresence(seanceId: string) {
  return useQuery({
    queryKey: clesPresences.feuille(seanceId),
    queryFn: () => presencesApi.feuille(seanceId),
    enabled: Boolean(seanceId),
  })
}

export function useCorrigerPresences(seanceId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (corrections: Array<{ apprenantId: string; statut: StatutPresence }>) =>
      presencesApi.corriger(seanceId, corrections),
    onSuccess: (feuille) => {
      queryClient.setQueryData(clesPresences.feuille(seanceId), feuille)
      return queryClient.invalidateQueries({ queryKey: clesPresences.toutes })
    },
  })
}

export function useMesPresences() {
  return useQuery({ queryKey: clesPresences.miennes, queryFn: presencesApi.mesPresences })
}

export function useRapportClasse(classeId: string) {
  return useQuery({
    queryKey: clesPresences.rapport(classeId),
    queryFn: () => presencesApi.rapport(classeId),
    enabled: Boolean(classeId),
  })
}
