import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router'
import { Menu, Search, User, X } from 'lucide-react'
import logo from '@/assets/images/logo-institut.png'
import { ButtonLink } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { navigationPublique, type NavItem } from '@/config/navigation'
import { routes } from '@/config/routes'
import { site } from '@/config/site'
import { useAuth } from '@/features/auth'
import { cx } from '@/lib/cx'
import styles from './Header.module.css'

/** En-tête de l'espace visiteur : logo, menu principal et accès au compte. */
export function Header() {
  const { utilisateur } = useAuth()
  const [menuOuvert, setMenuOuvert] = useState(false)
  const fermerMenu = () => setMenuOuvert(false)

  // Touche Échap : ferme le menu mobile
  useEffect(() => {
    if (!menuOuvert) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOuvert(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuOuvert])

  return (
    <header className={styles.header}>
      <Container className={styles.inner}>
        <Link to={routes.accueil} className={styles.brand} onClick={fermerMenu}>
          <img src={logo} alt={`${site.institut} — accueil`} className={styles.logo} width={298} height={136} />
        </Link>

        <div id="menu-principal" className={cx(styles.panel, menuOuvert && styles.panelOpen)}>
          <nav aria-label="Navigation principale" className={styles.nav}>
            <ul role="list" className={styles.navList}>
              {navigationPublique.map((item) => (
                <li key={item.label}>
                  <NavigationLink item={item} onNavigate={fermerMenu} />
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.actions}>
            <button type="button" className={styles.searchButton} aria-label="Rechercher">
              <Search size={26} strokeWidth={2} aria-hidden />
            </button>
            {utilisateur ? (
              <ButtonLink to={routes.tableauDeBord} className={styles.actionButton}>
                <User size={22} fill="currentColor" aria-hidden />
                Mon espace
              </ButtonLink>
            ) : (
              <>
                <ButtonLink to={routes.connexion} variant="outline" className={styles.actionButton}>
                  Se connecter
                </ButtonLink>
                <ButtonLink href={site.inscriptionUrl} external className={styles.actionButton}>
                  <User size={22} fill="currentColor" aria-hidden />
                  S'inscrire
                </ButtonLink>
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          className={styles.burger}
          aria-expanded={menuOuvert}
          aria-controls="menu-principal"
          aria-label={menuOuvert ? 'Fermer le menu' : 'Ouvrir le menu'}
          onClick={() => setMenuOuvert((ouvert) => !ouvert)}
        >
          {menuOuvert ? <X size={28} aria-hidden /> : <Menu size={28} aria-hidden />}
        </button>
      </Container>
    </header>
  )
}

function NavigationLink({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  if (item.to !== undefined) {
    return (
      <NavLink
        to={item.to}
        end
        onClick={onNavigate}
        className={({ isActive }) => cx(styles.navLink, isActive && styles.active)}
      >
        {item.label}
      </NavLink>
    )
  }

  return (
    <a
      href={item.href}
      onClick={onNavigate}
      className={styles.navLink}
      {...(item.external && { target: '_blank', rel: 'noopener noreferrer' })}
    >
      {item.label}
    </a>
  )
}
