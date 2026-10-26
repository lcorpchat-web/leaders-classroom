import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { Support } from '@/features/supports'
import { apiRequest, query } from '@/lib/api/client'

/** Données des pages « Mes cours », « Mes étudiants » et « Mes documents » du menu. */

export interface Cours {
  id: string
  nom: string
  description: string | null
  image: string | null
  categorie: string | null
  niveau: string | null
  enseignants: Array<{ id: string; prenom: string; nom: string; photo: string | null }>
  nbApprenants: number
  nbSupports: number
  nbSeances: number
  progression: number
  prochaineSeance: { id: string; titre: string; debut: string } | null
}

export interface Etudiant {
  id: string
  nom: string
  prenom: string
  email: string
  telephone: string | null
  matricule: string | null
  photo: string | null
  actif: boolean
  classes: Array<{ id: string; nom: string }>
  tauxPresence: number | null
}

interface Filtres {
  classeId?: string
  recherche?: string
}

export function useMesCours() {
  return useQuery({ queryKey: ['espace', 'cours'], queryFn: async () => (await apiRequest<{ cours: Cours[] }>('/moi/cours')).cours })
}

export function useMesEtudiants(filtres: Filtres) {
  return useQuery({
    queryKey: ['espace', 'etudiants', filtres],
    queryFn: async () => (await apiRequest<{ etudiants: Etudiant[] }>(`/moi/etudiants${query({ ...filtres })}`)).etudiants,
    placeholderData: keepPreviousData,
  })
}

export function useMesDocuments(filtres: Filtres) {
  return useQuery({
    queryKey: ['supports', 'mes-documents', filtres],
    queryFn: async () => (await apiRequest<{ documents: Support[] }>(`/moi/documents${query({ ...filtres })}`)).documents,
    placeholderData: keepPreviousData,
  })
}
