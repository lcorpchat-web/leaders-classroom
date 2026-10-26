import { useId, type TextareaHTMLAttributes } from 'react'
import { cx } from '@/lib/cx'
import styles from './TextField.module.css'

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  erreur?: string
}

/** Zone de texte multiligne au style des champs de saisie. */
export function TextAreaField({ label, erreur, id, className, rows = 4, ...props }: TextAreaFieldProps) {
  const idAuto = useId()
  const textareaId = id ?? idAuto
  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={textareaId} className={styles.label}>
        {label}
      </label>
      <div className={cx(styles.control, styles.controlMultiligne, erreur && styles.invalid)}>
        <textarea
          id={textareaId}
          rows={rows}
          className={cx(styles.input, styles.textarea)}
          aria-invalid={erreur ? true : undefined}
          {...props}
        />
      </div>
      {erreur && <p className={styles.error}>{erreur}</p>}
    </div>
  )
}
