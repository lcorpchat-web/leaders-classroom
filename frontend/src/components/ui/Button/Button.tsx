import type { ButtonHTMLAttributes } from 'react'
import { buttonClassName, type ButtonStyleProps } from './buttonClassName'

type ButtonProps = ButtonStyleProps & ButtonHTMLAttributes<HTMLButtonElement>

/** Bouton d'action (soumission de formulaire, ouverture de modale…). */
export function Button({ variant, size, fullWidth, className, type = 'button', ...props }: ButtonProps) {
  return (
    <button type={type} className={buttonClassName({ variant, size, fullWidth, className })} {...props} />
  )
}
