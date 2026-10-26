import { useQuery } from '@tanstack/react-query'
import type { Seance } from '@/features/seances'
import type { Support } from '@/features/supports'
import { apiRequest, query } from '@/lib/api/client'

export type Periode = 'semaine' | 'mois' | 'semestre'

interface Commun {
  seances: {
    enCours: Seance[]
    prochaines: Seance[]
    cetteSemaine: number
    /** Nombre d'apprenants inscrits par classe (liste des séances de la maquette 03) */
    effectifs: Record<string, number>
  }
}

interface Mesure {
  valeur: number | null
  evolution: number | null
}

export interface Statistiques {
  periode: Periode
  apprenants: Mesure
  tauxPresence: Mesure
  seancesRealisees: Mesure
  documents: Mesure
  presences: { present: number; retard: number; absent: number; taux: number | null }
}

export interface ClasseTableau {
  id: string
  nom: string
  image: string | null
  capaciteMax: number | null
  nbApprenants: number
  tauxPresence: number | null
}

export interface Activite {
  type: 'DOCUMENT' | 'SEANCE_TERMINEE' | 'INSCRIPTION' | 'SEANCE_PROGRAMMEE'
  titre: string
  detail: string
  date: string
}

export interface CoursApprenant {
  id: string
  nom: string
  image: string | null
  enseignant: { id: string; prenom: string; nom: string } | null
  progression: number
}

export type TableauDeBord = Commun &
  (
    | {
        role: 'APPRENANT'
        indicateurs: { classes: number; seancesSemaine: number; tauxPresence: number | null; documents: number }
        cours: CoursApprenant[]
        supports: Support[]
      }
    | {
        role: 'ENSEIGNANT'
        indicateurs: { classes: number; apprenants: number | null; seancesSemaine: number; tauxPresence: number | null }
        statistiques: Statistiques
        classes: ClasseTableau[]
        activites: Activite[]
        supports: Support[]
      }
    | {
        role: 'ADMIN'
        indicateurs: { apprenants: number; enseignants: number; classes: number; tauxPresence: number | null }
        statistiques: Statistiques
        classes: ClasseTableau[]
        activites: Activite[]
      }
  )

/** Données du tableau de bord (GET /api/moi/tableau-de-bord), actualisées chaque minute */
export function useTableauDeBord(periode: Periode = 'semaine') {
  return useQuery({
    queryKey: ['tableau-de-bord', periode],
    queryFn: () => apiRequest<TableauDeBord>(`/moi/tableau-de-bord${query({ periode })}`),
    refetchInterval: 60_000,
  })
}

/** Fil des notifications (cloche) construit à partir des données du tableau de bord */
export function notifications(tdb: TableauDeBord | undefined): Activite[] {
  if (!tdb) return []
  const direct: Activite[] = tdb.seances.enCours.map((s) => ({
    type: 'SEANCE_PROGRAMMEE',
    titre: 'Séance en direct',
    detail: `${s.titre} — ${s.classe.nom}`,
    date: s.debut,
  }))
  if (tdb.role !== 'APPRENANT') return [...direct, ...tdb.activites]
  return [
    ...direct,
    ...tdb.supports.map((s) => ({
      type: 'DOCUMENT' as const,
      titre: 'Nouveau document',
      detail: `${s.titre} — ${s.classe.nom}`,
      date: s.deposeLe,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date))
}
