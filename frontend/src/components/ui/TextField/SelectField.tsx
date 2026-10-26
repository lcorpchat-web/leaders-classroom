import { useId, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import { cx } from '@/lib/cx'
import styles from './TextField.module.css'

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: Array<{ value: string; label: string }>
  erreur?: string
}

/** Liste déroulante native (accessible et adaptée au mobile), au style des champs de saisie. */
export function SelectField({ label, options, erreur, id, className, ...props }: SelectFieldProps) {
  const idAuto = useId()
  const selectId = id ?? idAuto
  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={selectId} className={styles.label}>
        {label}
      </label>
      <div className={cx(styles.control, erreur && styles.invalid)}>
        <select
          id={selectId}
          className={cx(styles.input, styles.select)}
          aria-invalid={erreur ? true : undefined}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown size={20} className={styles.icon} aria-hidden />
      </div>
      {erreur && <p className={styles.error}>{erreur}</p>}
    </div>
  )
}
