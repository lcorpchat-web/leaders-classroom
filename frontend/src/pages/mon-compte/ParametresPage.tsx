import { useState, type FormEvent } from 'react'
import { KeyRound, UserRound } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chargement } from '@/components/ui/Feedback'
import { PageHeader } from '@/components/ui/PageHeader'
import { TextAreaField, TextField } from '@/components/ui/TextField'
import { useModifierProfil, useProfil, type Profil } from '@/features/profil/profil'
import { erreursChamps, messageErreur } from '@/lib/api/client'
import { MotDePasseFormulaire } from './components/MotDePasseFormulaire'
import { PhotoProfil } from './components/PhotoProfil'
import styles from './MonCompte.module.css'

/** Paramètres du compte : photo, coordonnées, présentation et mot de passe. */
export function ParametresPage() {
  const { data: profil, isLoading, isError, error } = useProfil()

  return (
    <div className={styles.etroit}>
      <PageHeader titre="Paramètres" sousTitre="Gérez votre profil, votre photo et la sécurité de votre compte." />
      {isLoading ? (
        <Chargement />
      ) : isError || !profil ? (
        <Alert variante="erreur">{messageErreur(error)}</Alert>
      ) : (
        <div className={styles.colonne}>
          <Card titre="Profil" sousTitre="Ces informations sont visibles par les membres de vos classes." icone={UserRound}>
            <div className={styles.parametresProfil}>
              <PhotoProfil profil={profil} />
              <FormulaireProfil key={profil.id} profil={profil} />
            </div>
          </Card>
          <Card titre="Mot de passe" sousTitre="8 caractères minimum, avec au moins une lettre et un chiffre." icone={KeyRound}>
            <MotDePasseFormulaire />
          </Card>
        </div>
      )}
    </div>
  )
}

function FormulaireProfil({ profil }: { profil: Profil }) {
  const modifier = useModifierProfil()
  const [valeurs, setValeurs] = useState({
    telephone: profil.telephone ?? '',
    ville: profil.ville ?? '',
    specialite: profil.specialite ?? '',
    biographie: profil.biographie ?? '',
  })
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [message, setMessage] = useState<{ variante: 'erreur' | 'info'; texte: string } | null>(null)

  const champ = (nom: keyof typeof valeurs) => ({
    value: valeurs[nom],
    onChange: (e: { target: { value: string } }) => setValeurs((v) => ({ ...v, [nom]: e.target.value })),
    erreur: erreurs[nom],
  })

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    try {
      // La spécialité ne concerne que les enseignants
      await modifier.mutateAsync({
        telephone: valeurs.telephone,
        ville: valeurs.ville,
        biographie: valeurs.biographie,
        ...(profil.role === 'ENSEIGNANT' && { specialite: valeurs.specialite }),
      })
      setMessage({ variante: 'info', texte: 'Profil enregistré.' })
    } catch (e) {
      setErreurs(erreursChamps(e))
      setMessage({ variante: 'erreur', texte: messageErreur(e) })
    }
  }

  return (
    <form className={styles.formulaire} onSubmit={onSubmit}>
      <div className={styles.deuxColonnes}>
        <TextField label="Nom" value={`${profil.prenom} ${profil.nom}`} disabled />
        <TextField label="Adresse e-mail" value={profil.email} disabled />
        <TextField label="Téléphone" type="tel" placeholder="+237 6 00 00 00 00" {...champ('telephone')} />
        <TextField label="Ville" placeholder="Yaoundé, Cameroun" {...champ('ville')} />
        {profil.role === 'ENSEIGNANT' && <TextField label="Spécialité" placeholder="Langue allemande" {...champ('specialite')} />}
      </div>
      <TextAreaField label="Biographie" rows={4} placeholder="Présentez-vous en quelques lignes." {...champ('biographie')} />
      <p className={styles.note}>Le nom et l’adresse e-mail sont gérés par l’administration de l’Institut.</p>
      {message && <Alert variante={message.variante}>{message.texte}</Alert>}
      <Button type="submit" disabled={modifier.isPending} className={styles.bouton}>
        {modifier.isPending ? 'Enregistrement…' : 'Enregistrer le profil'}
      </Button>
    </form>
  )
}
