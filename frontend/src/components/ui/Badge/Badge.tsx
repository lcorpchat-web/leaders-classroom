import type { ReactNode } from 'react'
import { cx } from '@/lib/cx'
import styles from './Badge.module.css'

export type BadgeTon = 'neutre' | 'succes' | 'attention' | 'danger' | 'info' | 'marque'

/** Étiquette de statut (rôle, état d'un compte ou d'une inscription…). */
export function Badge({ ton = 'neutre', children }: { ton?: BadgeTon; children: ReactNode }) {
  return <span className={cx(styles.badge, styles[ton])}>{children}</span>
}
