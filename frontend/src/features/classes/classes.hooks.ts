import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { classesApi } from './classes.api'
import type { ClasseSaisie, FiltresClasses, StatutInscription } from './classes.types'

export const clesClasses = {
  toutes: ['classes'] as const,
  liste: (filtres: FiltresClasses) => ['classes', 'liste', filtres] as const,
  detail: (id: string) => ['classes', 'detail', id] as const,
}

export function useClasses(filtres: FiltresClasses) {
  return useQuery({
    queryKey: clesClasses.liste(filtres),
    queryFn: () => classesApi.lister(filtres),
    placeholderData: keepPreviousData,
  })
}

export function useClasse(id: string, active = true) {
  return useQuery({ queryKey: clesClasses.detail(id), queryFn: () => classesApi.obtenir(id), enabled: active && Boolean(id) })
}

function useInvaliderClasses() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: clesClasses.toutes })
}

export function useCreerClasse() {
  const invalider = useInvaliderClasses()
  return useMutation({
    mutationFn: (donnees: ClasseSaisie & { enseignantIds: string[] }) => classesApi.creer(donnees),
    onSuccess: invalider,
  })
}

export function useModifierClasse(id: string) {
  const invalider = useInvaliderClasses()
  return useMutation({
    mutationFn: (donnees: Partial<ClasseSaisie> & { active?: boolean }) => classesApi.modifier(id, donnees),
    onSuccess: invalider,
  })
}

export function useAffectations(id: string) {
  const invalider = useInvaliderClasses()
  const affecter = useMutation({
    mutationFn: (enseignantId: string) => classesApi.affecterEnseignant(id, enseignantId),
    onSuccess: invalider,
  })
  const retirer = useMutation({
    mutationFn: (enseignantId: string) => classesApi.retirerEnseignant(id, enseignantId),
    onSuccess: invalider,
  })
  return { affecter, retirer }
}

export function useInscriptions(id: string) {
  const invalider = useInvaliderClasses()
  const inscrire = useMutation({
    mutationFn: (apprenantId: string) => classesApi.inscrire(id, apprenantId),
    onSuccess: invalider,
  })
  const changerStatut = useMutation({
    mutationFn: ({ apprenantId, statut }: { apprenantId: string; statut: Exclude<StatutInscription, 'EN_ATTENTE'> }) =>
      classesApi.changerStatutInscription(id, apprenantId, statut),
    onSuccess: invalider,
  })
  return { inscrire, changerStatut }
}
