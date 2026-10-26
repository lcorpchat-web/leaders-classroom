import { couleurClasse, type Seance } from '@/features/seances'
import { cx } from '@/lib/cx'
import { formaterCreneau, formaterJourLong, grilleMois, memeJour, nomsJours } from '@/lib/dates'
import styles from '../CalendrierPage.module.css'

interface MoisGrilleProps {
  mois: Date
  seances: Seance[]
  onChoisir: (seance: Seance) => void
}

/** Vue « Mois » du calendrier : semaines du lundi au dimanche (maquette 05). */
export function MoisGrille({ mois, seances, onChoisir }: MoisGrilleProps) {
  const jours = grilleMois(mois)
  const aujourdhui = new Date()

  return (
    <div className={styles.grilleConteneur}>
      <div className={styles.grille} role="grid" aria-label="Calendrier du mois">
        <div role="row" className={styles.ligneEntete}>
          {nomsJours.map((nom) => (
            <div key={nom} role="columnheader" className={styles.entete}>
              {nom}
            </div>
          ))}
        </div>

        <div className={styles.cases}>
          {jours.map((jour) => {
            const duJour = seances.filter((s) => memeJour(new Date(s.debut), jour))
            const horsMois = jour.getMonth() !== mois.getMonth()
            const estAujourdhui = memeJour(jour, aujourdhui)
            return (
              <div
                key={jour.toISOString()}
                role="gridcell"
                aria-label={`${formaterJourLong(jour)}, ${duJour.length} séance(s)`}
                className={cx(styles.case, horsMois && styles.horsMois)}
              >
                <span className={cx(styles.numero, estAujourdhui && styles.aujourdhui)}>{jour.getDate()}</span>
                {duJour.map((seance) => {
                  const couleur = couleurClasse(seance.classe.id)
                  return (
                    <button
                      key={seance.id}
                      type="button"
                      className={cx(styles.evenement, seance.statut === 'ANNULEE' && styles.evenementAnnule)}
                      style={{ background: couleur.fond, color: couleur.texte, borderLeftColor: couleur.accent }}
                      onClick={() => onChoisir(seance)}
                      title={`${seance.titre} — ${seance.classe.nom}`}
                    >
                      <span className={styles.evenementHeure}>{formaterCreneau(new Date(seance.debut), seance.dureeMinutes)}</span>
                      <span className={styles.evenementClasse}>{seance.classe.nom}</span>
                      <span className={styles.evenementTitre}>{seance.titre}</span>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
