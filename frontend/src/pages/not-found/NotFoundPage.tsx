import { ButtonLink } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { routes } from '@/config/routes'
import styles from './NotFoundPage.module.css'

export function NotFoundPage() {
  return (
    <Container className={styles.page}>
      <p className={styles.code}>404</p>
      <h1 className={styles.title}>Page introuvable</h1>
      <p className={styles.text}>La page demandée n'existe pas ou n'est pas encore disponible.</p>
      <ButtonLink to={routes.accueil}>Retour à l'accueil</ButtonLink>
    </Container>
  )
}
