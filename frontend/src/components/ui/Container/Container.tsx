import type { HTMLAttributes } from 'react'
import { cx } from '@/lib/cx'
import styles from './Container.module.css'

/** Centre le contenu et applique la largeur maximale et les marges latérales de la charte. */
export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx(styles.container, className)} {...props} />
}
