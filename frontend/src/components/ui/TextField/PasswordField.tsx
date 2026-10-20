import { useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { TextField, type TextFieldProps } from './TextField'
import styles from './TextField.module.css'

type PasswordFieldProps = Omit<TextFieldProps, 'type' | 'icone' | 'suffixe'>

/** Champ mot de passe avec bouton pour afficher ou masquer la saisie. */
export function PasswordField(props: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <TextField
      {...props}
      type={visible ? 'text' : 'password'}
      icone={Lock}
      suffixe={
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          aria-pressed={visible}
        >
          {visible ? <Eye size={22} aria-hidden /> : <EyeOff size={22} aria-hidden />}
        </button>
      }
    />
  )
}
