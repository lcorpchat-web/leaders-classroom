import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth, type Role } from '@/features/auth'
import { apiRequest } from '@/lib/api/client'

export interface Profil {
  id: string
  nom: string
  prenom: string
  email: string
  telephone: string | null
  role: Role
  matricule: string | null
  specialite: string | null
  photo: string | null
  ville: string | null
  biographie: string | null
  creeLe: string
}

export type ProfilSaisie = Partial<Pick<Profil, 'telephone' | 'ville' | 'biographie' | 'specialite'>>

const CLE = ['profil'] as const

export function useProfil() {
  return useQuery({ queryKey: CLE, queryFn: async () => (await apiRequest<{ profil: Profil }>('/moi/profil')).profil })
}

export function useModifierProfil() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (donnees: ProfilSaisie) =>
      (await apiRequest<{ profil: Profil }>('/moi/profil', { method: 'PATCH', body: donnees })).profil,
    onSuccess: (profil) => queryClient.setQueryData(CLE, profil),
  })
}

/** Photo de profil : la session est rechargée pour mettre à jour l'avatar partout */
export function usePhotoProfil() {
  const queryClient = useQueryClient()
  const { rafraichir } = useAuth()
  const apres = async () => {
    await Promise.all([rafraichir(), queryClient.invalidateQueries({ queryKey: CLE })])
  }
  const changer = useMutation({
    mutationFn: (fichier: File) => {
      const formulaire = new FormData()
      formulaire.append('image', fichier)
      return apiRequest<{ photo: string }>('/moi/photo', { method: 'PUT', body: formulaire })
    },
    onSuccess: apres,
  })
  const supprimer = useMutation({ mutationFn: () => apiRequest<void>('/moi/photo', { method: 'DELETE' }), onSuccess: apres })
  return { changer, supprimer }
}
