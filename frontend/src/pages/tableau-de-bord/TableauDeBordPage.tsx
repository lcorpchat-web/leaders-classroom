import { useNavigate } from 'react-router'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { routes } from '@/config/routes'
import { libellesRole, useAuth } from '@/features/auth'
import styles from './TableauDeBordPage.module.css'

/**
 * Page provisoire après connexion : sera remplacée par les tableaux de bord
 * par rôle (maquettes 02-dashboard-apprenant et 03-dashboard-enseignant).
 */
export function TableauDeBordPage() {
  const { utilisateur, deconnecter } = useAuth()
  const navigate = useNavigate()

  if (!utilisateur) return null

  async function seDeconnecter() {
    await deconnecter()
    navigate(routes.accueil, { replace: true })
  }

  return (
    <Container className={styles.page}>
      <h1 className={styles.title}>
        Bonjour <span>{utilisateur.prenom}</span> !
      </h1>
      <p className={styles.text}>
        Vous êtes connecté en tant que <strong>{libellesRole[utilisateur.role]}</strong> ({utilisateur.email}).
      </p>
      <p className={styles.text}>Votre tableau de bord sera disponible prochainement.</p>
      <Button variant="outline" onClick={seDeconnecter}>
        <LogOut size={20} aria-hidden />
        Se déconnecter
      </Button>
    </Container>
  )
}
