import { apiRequest } from '@/lib/api/client'
import type { Seance } from '@/features/seances'

export interface AccesSalle {
  /** URL de connexion signée par le serveur ; null en mode simulation (aucun serveur BBB configuré) */
  urlSalle: string | null
  simulation: boolean
  seance: Seance
}

export type EtatParticipant = 'EN_LIGNE' | 'PARTI' | 'NON_ARRIVE'

export interface Participant {
  id: string
  nom: string
  prenom: string
  role: 'ENSEIGNANT' | 'APPRENANT'
  etat: EtatParticipant
  arrivee: string | null
  statut: 'PRESENT' | 'RETARD' | 'ABSENT' | null
}

export const salleApi = {
  demarrer: (id: string) => apiRequest<AccesSalle>(`/seances/${id}/demarrer`, { method: 'POST' }),
  rejoindre: (id: string) => apiRequest<AccesSalle>(`/seances/${id}/rejoindre`, { method: 'POST' }),
  quitter: (id: string) => apiRequest<void>(`/seances/${id}/quitter`, { method: 'POST' }),
  terminer: (id: string) => apiRequest<{ seance: Seance }>(`/seances/${id}/terminer`, { method: 'POST' }),
  participants: (id: string) => apiRequest<{ seance: Seance; participants: Participant[] }>(`/seances/${id}/participants`),

  /** Sortie à la fermeture de l'onglet : requête garantie même pendant le déchargement de la page */
  quitterEnArrierePlan: (id: string) => navigator.sendBeacon(`/api/seances/${id}/quitter`),
}
