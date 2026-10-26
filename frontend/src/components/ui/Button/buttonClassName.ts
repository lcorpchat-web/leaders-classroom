import { cx } from '@/lib/cx'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'outline' | 'outlineLight' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonStyleProps {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  className?: string
}

/** Classes CSS communes à Button (balise <button>) et ButtonLink (lien). */
export function buttonClassName({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
}: ButtonStyleProps): string {
  return cx(styles.button, styles[variant], styles[size], fullWidth && styles.fullWidth, className)
}
