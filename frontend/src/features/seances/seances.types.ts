import type { BadgeTon } from '@/components/ui/Badge'

export type StatutSeance = 'PROGRAMMEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE'

export interface Seance {
  id: string
  titre: string
  /** Instant ISO (UTC) */
  debut: string
  dureeMinutes: number
  statut: StatutSeance
  enregistree: boolean
  classe: { id: string; nom: string; image?: string | null }
  enseignant: { id: string; nom: string; prenom: string; photo?: string | null }
}

export interface SeanceSaisie {
  titre: string
  /** Instant ISO */
  debut: string
  dureeMinutes: number
  enseignantId?: string
  repetition?: { jusquAu: string }
}

export const libellesStatutSeance: Record<StatutSeance, string> = {
  PROGRAMMEE: 'Programmée',
  EN_COURS: 'En direct',
  TERMINEE: 'Terminée',
  ANNULEE: 'Annulée',
}

export const tonStatutSeance: Record<StatutSeance, BadgeTon> = {
  PROGRAMMEE: 'info',
  EN_COURS: 'succes',
  TERMINEE: 'neutre',
  ANNULEE: 'danger',
}

/** Durées proposées à la programmation (maquette 04 : « Durée par séance ») */
export const dureesProposees = [30, 45, 60, 90, 120, 150, 180, 240]
