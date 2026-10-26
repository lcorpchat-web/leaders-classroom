import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cx } from '@/lib/cx'
import styles from './Modal.module.css'

interface ModalProps {
  ouvert: boolean
  onFermer: () => void
  titre: string
  description?: ReactNode
  children: ReactNode
  /** Boutons d'action affichés en pied de fenêtre */
  actions?: ReactNode
  taille?: 'md' | 'lg'
}

/**
 * Fenêtre modale basée sur <dialog> : gestion native du focus, de la touche Échap
 * et de l'arrière-plan inerte (accessibilité).
 */
export function Modal({ ouvert, onFermer, titre, description, children, actions, taille = 'md' }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (ouvert && !dialog.open) dialog.showModal()
    if (!ouvert && dialog.open) dialog.close()
  }, [ouvert])

  return (
    <dialog
      ref={ref}
      className={cx(styles.dialog, styles[taille])}
      onClose={onFermer}
      onCancel={(e) => {
        e.preventDefault()
        onFermer()
      }}
      onClick={(e) => {
        // Clic sur le fond (hors du contenu) : fermeture
        if (e.target === ref.current) onFermer()
      }}
      aria-labelledby="modal-titre"
    >
      {ouvert && (
        <div className={styles.contenu}>
          <header className={styles.entete}>
            <div>
              <h2 id="modal-titre" className={styles.titre}>
                {titre}
              </h2>
              {description && <p className={styles.description}>{description}</p>}
            </div>
            <button type="button" className={styles.fermer} onClick={onFermer} aria-label="Fermer">
              <X size={22} aria-hidden />
            </button>
          </header>
          <div className={styles.corps}>{children}</div>
          {actions && <footer className={styles.pied}>{actions}</footer>}
        </div>
      )}
    </dialog>
  )
}
