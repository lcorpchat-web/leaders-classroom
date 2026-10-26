import type { ReactNode, TableHTMLAttributes } from 'react'
import { cx } from '@/lib/cx'
import styles from './Table.module.css'

/** Tableau de données ; défilement horizontal sur petit écran. */
export function Table({ className, children, ...props }: TableHTMLAttributes<HTMLTableElement> & { children: ReactNode }) {
  return (
    <div className={styles.conteneur}>
      <table className={cx(styles.table, className)} {...props}>
        {children}
      </table>
    </div>
  )
}

/** Pagination « 1–20 sur 45 » avec boutons précédent / suivant. */
export function Pagination({
  page,
  parPage,
  total,
  onPage,
}: {
  page: number
  parPage: number
  total: number
  onPage: (page: number) => void
}) {
  if (total <= parPage) return null
  const debut = (page - 1) * parPage + 1
  const fin = Math.min(page * parPage, total)
  return (
    <nav className={styles.pagination} aria-label="Pagination">
      <p>
        {debut}–{fin} sur {total}
      </p>
      <div className={styles.paginationBoutons}>
        <button type="button" onClick={() => onPage(page - 1)} disabled={page <= 1}>
          Précédent
        </button>
        <button type="button" onClick={() => onPage(page + 1)} disabled={fin >= total}>
          Suivant
        </button>
      </div>
    </nav>
  )
}
