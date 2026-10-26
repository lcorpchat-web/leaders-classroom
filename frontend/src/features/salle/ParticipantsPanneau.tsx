import { Avatar } from '@/components/ui/Avatar'
import { cx } from '@/lib/cx'
import { formaterHeure } from '@/lib/dates'
import type { EtatParticipant, Participant } from './salle.api'
import styles from './Salle.module.css'

const libellesEtat: Record<EtatParticipant, string> = {
  EN_LIGNE: 'En ligne',
  PARTI: 'A quitté la salle',
  NON_ARRIVE: 'Pas encore arrivé',
}

/** Panneau « Participants » de la salle (maquette 07) : état de chacun, mis à jour en continu. */
export function ParticipantsPanneau({ participants, moiId }: { participants: Participant[]; moiId?: string }) {
  const animateurs = participants.filter((p) => p.role === 'ENSEIGNANT')
  const apprenants = participants.filter((p) => p.role === 'APPRENANT')
  const enLigne = apprenants.filter((p) => p.etat === 'EN_LIGNE').length

  const ligne = (p: Participant) => (
    <li key={p.id} className={styles.participant}>
      <span className={styles.avatar}>
        <Avatar prenom={p.prenom} nom={p.nom} taille="sm" />
        <span className={cx(styles.pastilleEtat, styles[p.etat])} aria-hidden />
      </span>
      <span className={styles.participantTexte}>
        <span className={styles.participantNom}>
          {p.prenom} {p.nom}
          {p.id === moiId && ' (vous)'}
        </span>
        <span className={styles.participantEtat}>
          {libellesEtat[p.etat]}
          {p.arrivee && p.etat !== 'NON_ARRIVE' && ` · arrivé à ${formaterHeure(new Date(p.arrivee))}`}
        </span>
      </span>
    </li>
  )

  return (
    <section className={styles.panneau} aria-labelledby="titre-participants">
      <h2 id="titre-participants" className={styles.panneauTitre}>
        Participants
        <span className={styles.compteur}>
          {enLigne} / {apprenants.length} apprenants en ligne
        </span>
      </h2>

      <h3 className={styles.groupe}>Animateur{animateurs.length > 1 ? 's' : ''}</h3>
      <ul role="list" className={styles.participants}>
        {animateurs.map(ligne)}
      </ul>

      <h3 className={styles.groupe}>Apprenants ({apprenants.length})</h3>
      <ul role="list" className={styles.participants}>
        {apprenants.map(ligne)}
      </ul>
    </section>
  )
}
