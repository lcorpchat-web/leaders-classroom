import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  ouvert: boolean
  titre: string
  message: ReactNode
  libelleConfirmer: string
  enCours?: boolean
  onConfirmer: () => void
  onAnnuler: () => void
}

/** Demande de confirmation avant une action importante (désactiver, retirer…). */
export function ConfirmDialog({
  ouvert,
  titre,
  message,
  libelleConfirmer,
  enCours = false,
  onConfirmer,
  onAnnuler,
}: ConfirmDialogProps) {
  return (
    <Modal
      ouvert={ouvert}
      onFermer={onAnnuler}
      titre={titre}
      actions={
        <>
          <Button variant="outline" onClick={onAnnuler} disabled={enCours}>
            Annuler
          </Button>
          <Button onClick={onConfirmer} disabled={enCours}>
            {enCours ? 'Patientez…' : libelleConfirmer}
          </Button>
        </>
      }
    >
      <p>{message}</p>
    </Modal>
  )
}
