import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { utilisateursApi } from './utilisateurs.api'
import type { FiltresUtilisateurs, UtilisateurSaisie } from './utilisateurs.types'

export const clesUtilisateurs = {
  tous: ['utilisateurs'] as const,
  liste: (filtres: FiltresUtilisateurs) => ['utilisateurs', 'liste', filtres] as const,
}

export function useUtilisateurs(filtres: FiltresUtilisateurs, active = true) {
  return useQuery({
    queryKey: clesUtilisateurs.liste(filtres),
    queryFn: () => utilisateursApi.lister(filtres),
    placeholderData: keepPreviousData,
    enabled: active,
  })
}

/** Invalide toutes les listes après une modification */
function useInvalider() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: clesUtilisateurs.tous })
}

export function useCreerUtilisateur() {
  const invalider = useInvalider()
  return useMutation({ mutationFn: (donnees: UtilisateurSaisie) => utilisateursApi.creer(donnees), onSuccess: invalider })
}

export function useModifierUtilisateur() {
  const invalider = useInvalider()
  return useMutation({
    mutationFn: ({ id, ...donnees }: { id: string } & Parameters<typeof utilisateursApi.modifier>[1]) =>
      utilisateursApi.modifier(id, donnees),
    onSuccess: invalider,
  })
}

export function useReinitialiserMotDePasse() {
  const invalider = useInvalider()
  return useMutation({ mutationFn: (id: string) => utilisateursApi.reinitialiserMotDePasse(id), onSuccess: invalider })
}
