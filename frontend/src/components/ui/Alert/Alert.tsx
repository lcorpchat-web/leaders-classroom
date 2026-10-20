import type { ReactNode } from 'react'
import { CircleAlert, Info } from 'lucide-react'
import { cx } from '@/lib/cx'
import styles from './Alert.module.css'

interface AlertProps {
  variante?: 'erreur' | 'info'
  children: ReactNode
  className?: string
}

/** Message annoncé aux lecteurs d'écran (erreur de formulaire, information). */
export function Alert({ variante = 'erreur', children, className }: AlertProps) {
  const Icone = variante === 'erreur' ? CircleAlert : Info
  return (
    <div role={variante === 'erreur' ? 'alert' : 'status'} className={cx(styles.alert, styles[variante], className)}>
      <Icone size={20} className={styles.icon} aria-hidden />
      <p>{children}</p>
    </div>
  )
}
