import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { buttonClassName, type ButtonStyleProps } from './buttonClassName'

type ButtonLinkProps = ButtonStyleProps & {
  children: ReactNode
  'aria-label'?: string
} & (
    | { to: string; href?: never; external?: never }
    | { href: string; external?: boolean; to?: never }
  )

/** Lien présenté comme un bouton : page interne (to) ou adresse externe (href). */
export function ButtonLink({ variant, size, fullWidth, className, children, ...props }: ButtonLinkProps) {
  const classes = buttonClassName({ variant, size, fullWidth, className })

  if (props.to !== undefined) {
    return (
      <Link to={props.to} className={classes} aria-label={props['aria-label']}>
        {children}
      </Link>
    )
  }

  return (
    <a
      href={props.href}
      className={classes}
      aria-label={props['aria-label']}
      {...(props.external && { target: '_blank', rel: 'noopener noreferrer' })}
    >
      {children}
    </a>
  )
}
