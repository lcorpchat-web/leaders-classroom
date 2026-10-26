import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { PasswordField } from '@/components/ui/TextField'
import { authApi, useAuth } from '@/features/auth'
import { erreursChamps, messageErreur } from '@/lib/api/client'
import styles from '../MonCompte.module.css'

/** Règle affichée et vérifiée côté client ; l'API applique la même (motDePasseRobuste). */
function verifierRobustesse(motDePasse: string): string | undefined {
  if (motDePasse.length < 8) return 'Au moins 8 caractères'
  if (!/[A-Za-z]/.test(motDePasse) || !/\d/.test(motDePasse)) return 'Au moins une lettre et un chiffre'
}

/** Changement de mot de passe (page imposée après un mot de passe provisoire, ou Paramètres). */
export function MotDePasseFormulaire({ impose = false, onSucces }: { impose?: boolean; onSucces?: () => void }) {
  const { rafraichir } = useAuth()
  const [actuel, setActuel] = useState('')
  const [nouveau, setNouveau] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<{ variante: 'erreur' | 'info'; texte: string } | null>(null)
  const [envoi, setEnvoi] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    const locales: Record<string, string> = {}
    const robustesse = verifierRobustesse(nouveau)
    if (robustesse) locales.nouveauMotDePasse = robustesse
    if (nouveau !== confirmation) locales.confirmation = 'Les deux saisies ne correspondent pas'
    setErreurs(locales)
    if (Object.keys(locales).length > 0) return

    setEnvoi(true)
    try {
      await authApi.changerMotDePasse({ motDePasseActuel: actuel, nouveauMotDePasse: nouveau })
      await rafraichir()
      setActuel('')
      setNouveau('')
      setConfirmation('')
      setMessage({ variante: 'info', texte: 'Votre mot de passe a été modifié.' })
      onSucces?.()
    } catch (erreur) {
      setErreurs(erreursChamps(erreur))
      setMessage({ variante: 'erreur', texte: messageErreur(erreur) })
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <form className={styles.formulaire} onSubmit={onSubmit}>
      <PasswordField
        label={impose ? 'Mot de passe provisoire' : 'Mot de passe actuel'}
        autoComplete="current-password"
        required
        value={actuel}
        onChange={(e) => setActuel(e.target.value)}
        erreur={erreurs.motDePasseActuel}
      />
      <PasswordField
        label="Nouveau mot de passe"
        autoComplete="new-password"
        required
        value={nouveau}
        onChange={(e) => setNouveau(e.target.value)}
        erreur={erreurs.nouveauMotDePasse}
      />
      <PasswordField
        label="Confirmer le nouveau mot de passe"
        autoComplete="new-password"
        required
        value={confirmation}
        onChange={(e) => setConfirmation(e.target.value)}
        erreur={erreurs.confirmation}
      />
      {message && <Alert variante={message.variante}>{message.texte}</Alert>}
      <Button type="submit" disabled={envoi} className={styles.bouton}>
        {envoi ? 'Enregistrement…' : 'Enregistrer le mot de passe'}
      </Button>
    </form>
  )
}
