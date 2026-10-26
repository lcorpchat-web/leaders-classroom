import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supportsApi } from './supports.api'

export const clesSupports = {
  toutes: ['supports'] as const,
  classe: (classeId: string) => ['supports', classeId] as const,
}

export function useSupports(classeId: string) {
  return useQuery({ queryKey: clesSupports.classe(classeId), queryFn: () => supportsApi.lister(classeId) })
}

function useInvaliderSupports() {
  const queryClient = useQueryClient()
  // Les tableaux de bord affichent aussi les derniers supports
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: clesSupports.toutes }),
      queryClient.invalidateQueries({ queryKey: ['tableau-de-bord'] }),
    ])
}

export function useDeposerSupport(classeId: string) {
  const invalider = useInvaliderSupports()
  return useMutation({
    mutationFn: (donnees: Parameters<typeof supportsApi.deposer>[1]) => supportsApi.deposer(classeId, donnees),
    onSuccess: invalider,
  })
}

export function useSupprimerSupport() {
  const invalider = useInvaliderSupports()
  return useMutation({ mutationFn: (id: string) => supportsApi.supprimer(id), onSuccess: invalider })
}
