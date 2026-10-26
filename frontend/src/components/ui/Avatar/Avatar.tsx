import { cx } from '@/lib/cx'
import { urlPhoto } from '@/lib/medias'
import styles from './Avatar.module.css'

const TEINTES = ['#fe7401', '#1a6fe0', '#12b76a', '#7a5af8', '#ee46bc', '#0ba5ec']

interface AvatarProps {
  prenom: string
  nom: string
  taille?: 'sm' | 'md' | 'lg' | 'xl'
  /** Avec l'identifiant et le nom de fichier de la photo, la photo remplace les initiales */
  id?: string
  photo?: string | null
}

/** Photo de profil, ou pastille aux initiales dont la couleur est stable pour une même personne. */
export function Avatar({ prenom, nom, taille = 'md', id, photo }: AvatarProps) {
  const url = id ? urlPhoto(id, photo) : null
  if (url) return <img src={url} alt="" className={cx(styles.avatar, styles.photo, styles[taille])} />

  const initiales = `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase()
  const code = [...`${prenom}${nom}`].reduce((somme, c) => somme + c.charCodeAt(0), 0)
  return (
    <span className={cx(styles.avatar, styles[taille])} style={{ background: TEINTES[code % TEINTES.length] }} aria-hidden>
      {initiales}
    </span>
  )
}
