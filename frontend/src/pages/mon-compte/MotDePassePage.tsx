import { useNavigate } from 'react-router'
import { KeyRound } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { routes } from '@/config/routes'
import { useAuth } from '@/features/auth'
import { MotDePasseFormulaire } from './components/MotDePasseFormulaire'
import styles from './MonCompte.module.css'

/** Page imposée tant qu'un mot de passe provisoire est utilisé (sinon : Paramètres). */
export function MotDePassePage() {
  const { utilisateur } = useAuth()
  const navigate = useNavigate()
  const impose = utilisateur?.doitChangerMotDePasse ?? false

  return (
    <div className={styles.etroit}>
      <PageHeader
        titre={impose ? 'Choisissez votre mot de passe' : 'Mot de passe'}
        sousTitre={
          impose
            ? 'Votre compte utilise un mot de passe provisoire. Choisissez un mot de passe personnel pour continuer.'
            : 'Modifiez le mot de passe de votre compte.'
        }
      />
      <Card titre="Nouveau mot de passe" sousTitre="8 caractères minimum, avec au moins une lettre et un chiffre." icone={KeyRound}>
        <MotDePasseFormulaire impose={impose} onSucces={() => impose && navigate(routes.tableauDeBord, { replace: true })} />
      </Card>
    </div>
  )
}
