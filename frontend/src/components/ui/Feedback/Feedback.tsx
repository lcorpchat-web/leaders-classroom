import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Inbox, LoaderCircle } from 'lucide-react'
import styles from './Feedback.module.css'

/** Indicateur de chargement annoncé aux lecteurs d'écran. */
export function Chargement({ libelle = 'Chargement…' }: { libelle?: string }) {
  return (
    <div role="status" className={styles.etat}>
      <LoaderCircle size={28} className={styles.spinner} aria-hidden />
      <p>{libelle}</p>
    </div>
  )
}

/** État vide d'une liste, avec action facultative (ex. « Créer une classe »). */
export function EtatVide({
  icone: Icone = Inbox,
  titre,
  message,
  action,
}: {
  icone?: LucideIcon
  titre: string
  message?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className={styles.etat}>
      <span className={styles.iconeVide} aria-hidden>
        <Icone size={28} />
      </span>
      <p className={styles.titre}>{titre}</p>
      {message && <p className={styles.message}>{message}</p>}
      {action}
    </div>
  )
}
