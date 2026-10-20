import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { ChevronRight, Mail } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { PasswordField, TextField } from '@/components/ui/TextField'
import { routes } from '@/config/routes'
import { site } from '@/config/site'
import { useAuth, type Role } from '@/features/auth'
import { ApiError } from '@/lib/api/client'
import { cx } from '@/lib/cx'
import { profilsConnexion } from '../connexion.content'
import { GoogleIcon } from './GoogleIcon'
import styles from './LoginForm.module.css'

type Message = { variante: 'erreur' | 'info'; texte: string } | null

/** Traduit une erreur de l'API en message lisible (figure 5 : « Identifiants incorrects »). */
function messageErreur(erreur: unknown): string {
  if (erreur instanceof ApiError) {
    if (erreur.status === 401) return 'Identifiants incorrects.'
    if (erreur.status === 400) return 'Vérifiez l’adresse e-mail et le mot de passe saisis.'
    if (erreur.status === 429 || erreur.status === 0) return erreur.message
  }
  return 'Connexion impossible pour le moment. Réessayez plus tard.'
}

export function LoginForm() {
  const { connecter } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [profil, setProfil] = useState<Role>('APPRENANT')
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [seSouvenir, setSeSouvenir] = useState(false)
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [message, setMessage] = useState<Message>(null)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setEnvoiEnCours(true)
    try {
      await connecter({ email: email.trim(), motDePasse, seSouvenir })
      const depuis = (location.state as { depuis?: string } | null)?.depuis
      navigate(depuis ?? routes.tableauDeBord, { replace: true })
    } catch (erreur) {
      setMessage({ variante: 'erreur', texte: messageErreur(erreur) })
      setMotDePasse('')
    } finally {
      setEnvoiEnCours(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={onSubmit}>
      <div role="radiogroup" aria-label="Profil" className={styles.profils}>
        {profilsConnexion.map(({ role, libelle, icone: Icone }) => (
          <button
            key={role}
            type="button"
            role="radio"
            aria-checked={profil === role}
            className={cx(styles.profil, profil === role && styles.profilActif)}
            onClick={() => setProfil(role)}
          >
            <Icone size={24} strokeWidth={1.75} aria-hidden className={styles.profilIcon} />
            {libelle}
          </button>
        ))}
      </div>

      <TextField
        label="Email ou nom d'utilisateur"
        icone={Mail}
        type="email"
        name="email"
        autoComplete="username"
        inputMode="email"
        placeholder="exemple@leaderscorporation.org"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <PasswordField
        label="Mot de passe"
        name="motDePasse"
        autoComplete="current-password"
        placeholder="Votre mot de passe"
        required
        value={motDePasse}
        onChange={(e) => setMotDePasse(e.target.value)}
      />

      <div className={styles.options}>
        <Checkbox label="Se souvenir de moi" checked={seSouvenir} onChange={(e) => setSeSouvenir(e.target.checked)} />
        <button
          type="button"
          className={styles.lien}
          onClick={() =>
            setMessage({
              variante: 'info',
              texte: 'Pour réinitialiser votre mot de passe, contactez l’administration de l’Institut.',
            })
          }
        >
          Mot de passe oublié ?
        </button>
      </div>

      {message && <Alert variante={message.variante}>{message.texte}</Alert>}

      <Button type="submit" size="lg" fullWidth className={styles.submit} disabled={envoiEnCours}>
        {envoiEnCours ? 'Connexion…' : 'Se connecter'}
        {!envoiEnCours && <ChevronRight size={24} aria-hidden />}
      </Button>

      <p className={styles.separateur}>
        <span>ou</span>
      </p>

      <button
        type="button"
        className={styles.google}
        onClick={() =>
          setMessage({ variante: 'info', texte: 'La connexion avec Google n’est pas encore disponible.' })
        }
      >
        <GoogleIcon />
        Continuer avec Google
      </button>

      <p className={styles.inscription}>
        Vous n'avez pas de compte ?{' '}
        <a href={site.inscriptionUrl} target="_blank" rel="noopener noreferrer" className={styles.lien}>
          Inscription
        </a>
      </p>
    </form>
  )
}
