import { Link, Navigate } from 'react-router'
import { ChevronDown, Globe } from 'lucide-react'
import logo from '@/assets/images/logo-institut.png'
import { routes } from '@/config/routes'
import { site } from '@/config/site'
import { useAuth } from '@/features/auth'
import { LoginForm } from './components/LoginForm'
import { LoginVisual } from './components/LoginVisual'
import styles from './LoginPage.module.css'

/** Page de connexion (maquette 08-page-connexion, cahier de conception figure 5). */
export function LoginPage() {
  const { statut } = useAuth()

  // Déjà connecté : inutile d'afficher le formulaire
  if (statut === 'connecte') {
    return <Navigate to={routes.tableauDeBord} replace />
  }

  return (
    <div className={styles.page}>
      <LoginVisual />

      <main className={styles.zone}>
        <div className={styles.langue}>
          <Globe size={22} aria-hidden />
          <select aria-label="Langue" defaultValue="fr" className={styles.langueSelect}>
            <option value="fr">Français</option>
          </select>
          <ChevronDown size={20} aria-hidden className={styles.langueChevron} />
        </div>

        <section className={styles.card} aria-labelledby="connexion-titre">
          <Link to={routes.accueil} className={styles.logo}>
            <img src={logo} alt={`${site.institut} — retour à l'accueil`} width={298} height={136} />
          </Link>
          <h1 id="connexion-titre" className={styles.title}>
            Bienvenue !
          </h1>
          <p className={styles.subtitle}>Connectez-vous à votre espace {site.nom}</p>

          <LoginForm />
        </section>
      </main>
    </div>
  )
}
