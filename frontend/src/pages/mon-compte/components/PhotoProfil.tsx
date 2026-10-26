import { useRef, useState } from 'react'
import { Camera } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { usePhotoProfil, type Profil } from '@/features/profil/profil'
import { messageErreur } from '@/lib/api/client'
import styles from '../MonCompte.module.css'

/** Photo de profil avec bouton « appareil photo » pour la changer (maquette 06). */
export function PhotoProfil({ profil }: { profil: Profil }) {
  const { changer, supprimer } = usePhotoProfil()
  const champ = useRef<HTMLInputElement>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  async function choisir(fichier: File | undefined) {
    if (!fichier) return
    setErreur(null)
    if (fichier.size > 2 * 1024 * 1024) {
      setErreur('Image trop volumineuse (2 Mo maximum)')
      return
    }
    try {
      await changer.mutateAsync(fichier)
    } catch (e) {
      setErreur(messageErreur(e))
    }
  }

  return (
    <div className={styles.photo}>
      <div className={styles.photoCadre}>
        <Avatar id={profil.id} photo={profil.photo} prenom={profil.prenom} nom={profil.nom} taille="xl" />
        <button
          type="button"
          className={styles.photoBouton}
          onClick={() => champ.current?.click()}
          disabled={changer.isPending}
          aria-label="Changer la photo de profil"
        >
          <Camera size={18} aria-hidden />
        </button>
        <input
          ref={champ}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(e) => {
            void choisir(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>
      {profil.photo && (
        <button type="button" className={styles.lienDiscret} onClick={() => supprimer.mutate()} disabled={supprimer.isPending}>
          Retirer la photo
        </button>
      )}
      {erreur && <p className={styles.erreur}>{erreur}</p>}
    </div>
  )
}
