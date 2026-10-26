import { CalendarDays, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { cx } from '@/lib/cx'
import { formaterCreneau, formaterJourCourt } from '@/lib/dates'
import { couleurClasse } from '../couleurs'
import { libellesStatutSeance, tonStatutSeance, type Seance } from '../seances.types'
import styles from './Seances.module.css'

interface ListeSeancesProps {
  seances: Seance[]
  onChoisir: (seance: Seance) => void
  /** Masque le nom de la classe (liste affichée dans la page d'une classe) */
  sansClasse?: boolean
}

/** Liste compacte de séances (prochaines séances, séances d'une classe…). */
export function ListeSeances({ seances, onChoisir, sansClasse = false }: ListeSeancesProps) {
  return (
    <ul role="list" className={styles.liste}>
      {seances.map((seance) => {
        const debut = new Date(seance.debut)
        const couleur = couleurClasse(seance.classe.id)
        return (
          <li key={seance.id}>
            <button
              type="button"
              className={cx(styles.element, seance.statut === 'ANNULEE' && styles.annulee)}
              onClick={() => onChoisir(seance)}
            >
              <span className={styles.date} style={{ background: couleur.fond, color: couleur.texte }}>
                <span className={styles.dateJour}>{debut.getDate()}</span>
                <span className={styles.dateMois}>{debut.toLocaleDateString('fr-FR', { month: 'short' })}</span>
              </span>
              <span className={styles.elementTexte}>
                <span className={styles.elementTitre}>{seance.titre}</span>
                {!sansClasse && <span className={styles.elementClasse}>{seance.classe.nom}</span>}
                <span className={styles.elementInfos}>
                  <span>
                    <CalendarDays size={14} aria-hidden />
                    {formaterJourCourt(debut)}
                  </span>
                  <span>
                    <Clock size={14} aria-hidden />
                    {formaterCreneau(debut, seance.dureeMinutes)}
                  </span>
                </span>
              </span>
              <Badge ton={tonStatutSeance[seance.statut]}>{libellesStatutSeance[seance.statut]}</Badge>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
