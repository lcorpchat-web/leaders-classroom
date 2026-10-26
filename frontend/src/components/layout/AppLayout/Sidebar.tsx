import { NavLink, useNavigate } from 'react-router'
import { LogOut, Settings, X } from 'lucide-react'
import diplome from '@/assets/images/sidebar-diplome.jpg'
import logo from '@/assets/images/logo-institut.png'
import { deviseEspace, navigationEspace } from '@/config/navigation'
import { routes } from '@/config/routes'
import { site } from '@/config/site'
import { useAuth } from '@/features/auth'
import { cx } from '@/lib/cx'
import styles from './Sidebar.module.css'

/** Barre latérale des espaces connectés (maquettes 02 à 07). */
export function Sidebar({ ouvert, onFermer }: { ouvert: boolean; onFermer: () => void }) {
  const { utilisateur, deconnecter } = useAuth()
  const navigate = useNavigate()
  if (!utilisateur) return null

  const lienClasse = ({ isActive }: { isActive: boolean }) => cx(styles.lien, isActive && styles.actif)
  const [devise1, devise2] = deviseEspace[utilisateur.role]

  async function seDeconnecter() {
    await deconnecter()
    navigate(routes.accueil, { replace: true })
  }

  return (
    <aside className={cx(styles.sidebar, ouvert && styles.ouvert)} aria-label="Menu de l'espace">
      <div className={styles.logo}>
        <img src={logo} alt={site.institut} width={298} height={136} />
        <button type="button" className={styles.fermer} onClick={onFermer} aria-label="Fermer le menu">
          <X size={24} aria-hidden />
        </button>
      </div>

      <div className={styles.marque}>
        <img src="/favicon.png" alt="" width={44} height={44} />
        <div>
          <p className={styles.marqueNom}>{site.nom}</p>
          <p className={styles.marqueSlogan}>Plateforme de cours en ligne</p>
        </div>
      </div>

      <nav aria-label="Navigation de l'espace" className={styles.nav}>
        <ul role="list" className={styles.liste}>
          {navigationEspace[utilisateur.role].map(({ label, to, icone: Icone }) => (
            <li key={to}>
              <NavLink to={to} end={to === routes.classes} className={lienClasse}>
                <Icone size={24} strokeWidth={1.75} aria-hidden />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        <hr className={styles.separateur} />

        <ul role="list" className={styles.liste}>
          <li>
            <NavLink to={routes.parametres} className={lienClasse}>
              <Settings size={24} strokeWidth={1.75} aria-hidden />
              Paramètres
            </NavLink>
          </li>
          <li>
            <button type="button" className={styles.lien} onClick={seDeconnecter}>
              <LogOut size={24} strokeWidth={1.75} aria-hidden />
              Déconnexion
            </button>
          </li>
        </ul>
      </nav>

      <div className={styles.bas} aria-hidden>
        <img src={diplome} alt="" className={styles.illustration} width={277} height={110} />
        <p className={styles.citation}>
          {devise1}
          <br />
          {devise2}
        </p>
      </div>
    </aside>
  )
}
