import { apiRequest, query } from '@/lib/api/client'
import type { Seance } from '@/features/seances'

export type StatutPresence = 'PRESENT' | 'RETARD' | 'ABSENT'

interface ApprenantResume {
  id: string
  nom: string
  prenom: string
  email: string
  matricule: string | null
}

export interface LignePresence {
  apprenant: ApprenantResume
  /** null tant que la séance n'est pas terminée */
  statut: StatutPresence | null
  arrivee: string | null
  depart: string | null
  dureeMinutes: number
  connexions: number
}

export interface FeuillePresence {
  seance: Pick<Seance, 'id' | 'titre' | 'debut' | 'dureeMinutes' | 'statut' | 'classe'>
  lignes: LignePresence[]
}

export interface MesPresences {
  resume: { seances: number; present: number; retard: number; absent: number; taux: number | null }
  historique: Array<{
    seance: Pick<Seance, 'id' | 'titre' | 'debut' | 'dureeMinutes' | 'classe'>
    statut: StatutPresence
    arrivee: string | null
    dureeMinutes: number
    connexions: number
  }>
}

export interface RapportClasse {
  seancesTerminees: number
  tauxMoyen: number | null
  lignes: Array<{ apprenant: ApprenantResume; present: number; retard: number; absent: number; taux: number | null }>
}

export const presencesApi = {
  feuille: (seanceId: string) => apiRequest<FeuillePresence>(`/seances/${seanceId}/presences`),
  corriger: (seanceId: string, corrections: Array<{ apprenantId: string; statut: StatutPresence }>) =>
    apiRequest<FeuillePresence>(`/seances/${seanceId}/presences`, { method: 'PUT', body: { corrections } }),
  mesPresences: () => apiRequest<MesPresences>('/moi/presences'),
  rapport: (classeId: string) => apiRequest<RapportClasse>(`/presences/rapport${query({ classeId })}`),
}

export const libellesStatutPresence: Record<StatutPresence, string> = {
  PRESENT: 'Présent',
  RETARD: 'En retard',
  ABSENT: 'Absent',
}

export const tonStatutPresence = { PRESENT: 'succes', RETARD: 'attention', ABSENT: 'danger' } as const
