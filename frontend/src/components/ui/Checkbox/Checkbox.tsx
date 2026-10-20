import type { InputHTMLAttributes } from 'react'
import { Check } from 'lucide-react'
import { cx } from '@/lib/cx'
import styles from './Checkbox.module.css'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

/** Case à cocher stylée ; reste une vraie <input type="checkbox"> (clavier, lecteurs d'écran). */
export function Checkbox({ label, className, ...props }: CheckboxProps) {
  return (
    <label className={cx(styles.checkbox, className)}>
      <input type="checkbox" className={styles.input} {...props} />
      <span className={styles.box} aria-hidden>
        <Check size={16} strokeWidth={3} />
      </span>
      {label}
    </label>
  )
}
