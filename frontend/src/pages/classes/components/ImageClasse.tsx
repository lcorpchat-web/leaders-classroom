import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Upload, X } from 'lucide-react'
import { ClasseVignette } from '@/components/ui/ClasseVignette'
import type { Classe } from '@/features/classes'
import { apiRequest, messageErreur } from '@/lib/api/client'
import styles from '../Classes.module.css'

/** Image de la classe (maquette 04 : « Changer l'image », JPG/PNG, 2 Mo max) — Administrateur. */
export function ImageClasse({ classe, modifiable }: { classe: Pick<Classe, 'id' | 'nom' | 'image'>; modifiable: boolean }) {
  const queryClient = useQueryClient()
  const champ = useRef<HTMLInputElement>(null)
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  async function actualiser() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['classes'] }),
      queryClient.invalidateQueries({ queryKey: ['tableau-de-bord'] }),
      queryClient.invalidateQueries({ queryKey: ['espace'] }),
    ])
  }

  async function deposer(fichier: File | undefined) {
    if (!fichier) return
    setErreur(null)
    if (fichier.size > 2 * 1024 * 1024) return setErreur('Image trop volumineuse (2 Mo maximum)')
    const formulaire = new FormData()
    formulaire.append('image', fichier)
    setEnvoi(true)
    try {
      await apiRequest(`/classes/${classe.id}/image`, { method: 'PUT', body: formulaire })
      await actualiser()
    } catch (e) {
      setErreur(messageErreur(e))
    } finally {
      setEnvoi(false)
    }
  }

  async function retirer() {
    setEnvoi(true)
    try {
      await apiRequest(`/classes/${classe.id}/image`, { method: 'DELETE' })
      await actualiser()
    } catch (e) {
      setErreur(messageErreur(e))
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div className={styles.imageClasse}>
      <ClasseVignette classe={classe} className={styles.imageClasseVisuel} />
      {modifiable && (
        <div className={styles.imageClasseActions}>
          <button type="button" className={styles.boutonImage} onClick={() => champ.current?.click()} disabled={envoi}>
            <Upload size={16} aria-hidden />
            {envoi ? 'Envoi…' : classe.image ? 'Changer l’image' : 'Ajouter une image'}
          </button>
          {classe.image && (
            <button type="button" className={styles.boutonIcone} onClick={retirer} disabled={envoi} aria-label="Retirer l’image">
              <X size={16} aria-hidden />
            </button>
          )}
          <input
            ref={champ}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(e) => {
              void deposer(e.target.files?.[0])
              e.target.value = ''
            }}
          />
        </div>
      )}
      {modifiable && <p className={styles.imageClasseAide}>Formats acceptés : JPG, PNG (max 2 Mo)</p>}
      {erreur && <p className={styles.erreurChamp}>{erreur}</p>}
    </div>
  )
}
