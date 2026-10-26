import type { HTMLAttributes, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cx } from '@/lib/cx'
import styles from './Card.module.css'

interface CardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  titre?: string
  sousTitre?: string
  /** Icône dans une pastille orange, comme les sections de la maquette 04 */
  icone?: LucideIcon
  /** Élément aligné à droite de l'en-tête (bouton, lien…) */
  action?: ReactNode
  sansMarge?: boolean
}

/** Carte blanche des espaces connectés (sections de formulaire, listes…). */
export function Card({ titre, sousTitre, icone: Icone, action, sansMarge, className, children, ...props }: CardProps) {
  return (
    <section className={cx(styles.card, className)} {...props}>
      {titre && (
        <header className={styles.entete}>
          {Icone && (
            <span className={styles.icone} aria-hidden>
              <Icone size={22} />
            </span>
          )}
          <div className={styles.textes}>
            <h2 className={styles.titre}>{titre}</h2>
            {sousTitre && <p className={styles.sousTitre}>{sousTitre}</p>}
          </div>
          {action && <div className={styles.action}>{action}</div>}
        </header>
      )}
      <div className={cx(!sansMarge && styles.corps)}>{children}</div>
    </section>
  )
}
