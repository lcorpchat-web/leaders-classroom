import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { ResultatMotDePasse } from '@/features/utilisateurs'
import styles from '../UtilisateursPage.module.css'

/** Affiche une seule fois le mot de passe provisoire à transmettre à l'utilisateur. */
export function MotDePasseProvisoireModal({
  resultat,
  onFermer,
}: {
  resultat: ResultatMotDePasse | null
  onFermer: () => void
}) {
  const [copie, setCopie] = useState(false)

  async function copier() {
    if (!resultat) return
    await navigator.clipboard.writeText(resultat.motDePasseProvisoire)
    setCopie(true)
  }

  function fermer() {
    setCopie(false)
    onFermer()
  }

  return (
    <Modal
      ouvert={resultat !== null}
      onFermer={fermer}
      titre="Mot de passe provisoire"
      actions={<Button onClick={fermer}>J’ai transmis le mot de passe</Button>}
    >
      {resultat && (
        <div className={styles.provisoire}>
          <p>
            Transmettez ces identifiants à{' '}
            <strong>
              {resultat.utilisateur.prenom} {resultat.utilisateur.nom}
            </strong>{' '}
            :
          </p>
          <dl className={styles.identifiants}>
            <dt>Adresse e-mail</dt>
            <dd>{resultat.utilisateur.email}</dd>
            <dt>Mot de passe provisoire</dt>
            <dd className={styles.motDePasse}>
              <code>{resultat.motDePasseProvisoire}</code>
              <Button size="sm" variant="outline" onClick={copier}>
                {copie ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
                {copie ? 'Copié' : 'Copier'}
              </Button>
            </dd>
          </dl>
          <Alert variante="info">
            Ce mot de passe ne sera plus affiché. L’utilisateur devra en choisir un nouveau à sa première connexion.
          </Alert>
        </div>
      )}
    </Modal>
  )
}
