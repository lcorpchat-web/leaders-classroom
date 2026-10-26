import { School } from 'lucide-react'
import { cx } from '@/lib/cx'
import { urlImageClasse } from '@/lib/medias'
import styles from './ClasseVignette.module.css'

interface ClasseVignetteProps {
  classe: { id: string; nom: string; image?: string | null }
  className?: string
}

/** Image de la classe (maquettes 02 à 05) ; à défaut, un visuel aux couleurs de l'Institut. */
export function ClasseVignette({ classe, className }: ClasseVignetteProps) {
  const url = urlImageClasse(classe.id, classe.image)
  if (url) return <img src={url} alt="" className={cx(styles.vignette, className)} />
  return (
    <span className={cx(styles.vignette, styles.defaut, className)} aria-hidden>
      <School size={26} />
    </span>
  )
}
