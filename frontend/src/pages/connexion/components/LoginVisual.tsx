import photo from '@/assets/images/connexion-apprenant.jpg'
import logo from '@/assets/images/logo-institut.png'
import { site } from '@/config/site'
import { atoutsConnexion, citationConnexion } from '../connexion.content'
import styles from './LoginVisual.module.css'

/** Panneau de présentation à gauche de la page de connexion (décoratif sur petit écran : masqué). */
export function LoginVisual() {
  return (
    <aside className={styles.visual} aria-label={`Présentation de ${site.nom}`}>
      <img src={photo} alt="" className={styles.photo} width={412} height={750} />
      <div className={styles.wave} aria-hidden />

      <div className={styles.content}>
        <div className={styles.logoBubble}>
          <img src={logo} alt={site.institut} width={298} height={136} />
        </div>

        <p className={styles.brand}>{site.nom}</p>
        <p className={styles.tagline}>Votre plateforme de cours en ligne</p>

        <ul role="list" className={styles.atouts}>
          {atoutsConnexion.map(({ icone: Icone, titre, description }) => (
            <li key={titre} className={styles.atout}>
              <span className={styles.atoutIcon} aria-hidden>
                <Icone size={34} strokeWidth={2} />
              </span>
              <div>
                <p className={styles.atoutTitle}>{titre}</p>
                <p className={styles.atoutText}>{description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <blockquote className={styles.quote}>
        <span className={styles.quoteIcon} aria-hidden>
          “
        </span>
        <p>
          {citationConnexion[0]}
          <br />
          {citationConnexion[1]}
        </p>
      </blockquote>

      <div className={styles.dots} aria-hidden>
        <span />
        <span />
        <span />
      </div>
    </aside>
  )
}
