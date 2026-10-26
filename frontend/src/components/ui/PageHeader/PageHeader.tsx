import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import styles from './PageHeader.module.css'

interface PageHeaderProps {
  titre: ReactNode
  sousTitre?: ReactNode
  /** Lien de retour affiché au-dessus du titre (maquette 04 : « Retour aux classes ») */
  retour?: { to: string; libelle: string }
  actions?: ReactNode
}

/** En-tête de page des espaces connectés : titre, sous-titre, retour et actions. */
export function PageHeader({ titre, sousTitre, retour, actions }: PageHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.textes}>
        {retour && (
          <Link to={retour.to} className={styles.retour}>
            <ArrowLeft size={16} aria-hidden />
            {retour.libelle}
          </Link>
        )}
        <h1 className={styles.titre}>{titre}</h1>
        {sousTitre && <p className={styles.sousTitre}>{sousTitre}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  )
}
