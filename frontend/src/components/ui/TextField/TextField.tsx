import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cx } from '@/lib/cx'
import styles from './TextField.module.css'

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  /** Icône affichée à gauche du champ */
  icone?: LucideIcon
  /** Élément affiché à droite du champ (ex. bouton afficher le mot de passe) */
  suffixe?: ReactNode
  erreur?: string
}

/** Champ de saisie avec libellé, icône et message d'erreur accessibles. */
export function TextField({ label, icone: Icone, suffixe, erreur, id, className, ...props }: TextFieldProps) {
  const idAuto = useId()
  const inputId = id ?? idAuto
  const erreurId = `${inputId}-erreur`

  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <div className={cx(styles.control, erreur && styles.invalid)}>
        {Icone && <Icone className={styles.icon} size={22} strokeWidth={1.75} aria-hidden />}
        <input
          id={inputId}
          className={styles.input}
          aria-invalid={erreur ? true : undefined}
          aria-describedby={erreur ? erreurId : undefined}
          {...props}
        />
        {suffixe}
      </div>
      {erreur && (
        <p id={erreurId} className={styles.error}>
          {erreur}
        </p>
      )}
    </div>
  )
}
