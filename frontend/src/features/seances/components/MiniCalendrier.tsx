import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cx } from '@/lib/cx'
import { ajouterJours, ajouterMois, debutMois, formaterMois, grilleMois, memeJour } from '@/lib/dates'
import { usePlanning } from '../seances.hooks'
import type { Seance } from '../seances.types'
import styles from './MiniCalendrier.module.css'

const INITIALES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

export interface LegendeMiniCalendrier {
  libelle: string
  couleur: string
}

interface MiniCalendrierProps {
  /** Couleur de la pastille d'un jour selon ses séances (null : pas de pastille) */
  couleurJour?: (seances: Seance[]) => string | null
  legende?: LegendeMiniCalendrier[]
  onChoisirJour?: (jour: Date, seances: Seance[]) => void
}

const couleurParDefaut = (seances: Seance[]) =>
  seances.some((s) => s.statut === 'EN_COURS') ? '#12b76a' : seances.some((s) => s.statut === 'PROGRAMMEE') ? '#fe7401' : '#2e90fa'

/** Calendrier mensuel compact (« Mon planning », « Mon calendrier », « Vue rapide » des maquettes). */
export function MiniCalendrier({ couleurJour = couleurParDefaut, legende, onChoisirJour }: MiniCalendrierProps) {
  const [mois, setMois] = useState(() => debutMois(new Date()))
  const jours = useMemo(() => grilleMois(mois), [mois])
  const { data: seances } = usePlanning(jours[0]!, ajouterJours(jours[jours.length - 1]!, 1))
  const aujourdhui = new Date()

  return (
    <div className={styles.calendrier}>
      <div className={styles.entete}>
        <button type="button" onClick={() => setMois((m) => ajouterMois(m, -1))} aria-label="Mois précédent">
          <ChevronLeft size={20} aria-hidden />
        </button>
        <p className={styles.mois} aria-live="polite">
          {formaterMois(mois)}
        </p>
        <button type="button" onClick={() => setMois((m) => ajouterMois(m, 1))} aria-label="Mois suivant">
          <ChevronRight size={20} aria-hidden />
        </button>
      </div>

      <div className={styles.grille}>
        {INITIALES.map((j) => (
          <span key={j} className={styles.jourSemaine}>
            {j}
          </span>
        ))}
        {jours.map((jour) => {
          const duJour = (seances ?? []).filter((s) => s.statut !== 'ANNULEE' && memeJour(new Date(s.debut), jour))
          const pastille = duJour.length > 0 ? couleurJour(duJour) : null
          const horsMois = jour.getMonth() !== mois.getMonth()
          const weekEnd = jour.getDay() === 0 || jour.getDay() === 6
          return (
            <button
              key={jour.toISOString()}
              type="button"
              className={cx(
                styles.jour,
                horsMois && styles.horsMois,
                weekEnd && styles.weekEnd,
                memeJour(jour, aujourdhui) && styles.aujourdhui,
                duJour.length > 0 && styles.avecSeance,
              )}
              onClick={() => onChoisirJour?.(jour, duJour)}
              aria-label={`${jour.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}${duJour.length ? `, ${duJour.length} séance(s)` : ''}`}
              tabIndex={horsMois ? -1 : 0}
            >
              {horsMois ? '' : jour.getDate()}
              {pastille && !horsMois && <span className={styles.pastille} style={{ background: pastille }} aria-hidden />}
            </button>
          )
        })}
      </div>

      {legende && (
        <ul role="list" className={styles.legende}>
          {legende.map((l) => (
            <li key={l.libelle}>
              <span className={styles.legendePastille} style={{ background: l.couleur }} aria-hidden />
              {l.libelle}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
