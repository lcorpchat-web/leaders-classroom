import { ChevronRight, GraduationCap, Play } from 'lucide-react'
import heroImage from '@/assets/images/hero-classe-virtuelle.jpg'
import { ButtonLink } from '@/components/ui/Button'
import { Container } from '@/components/ui/Container'
import { routes } from '@/config/routes'
import { site } from '@/config/site'
import { atoutsHero } from '../home.content'
import styles from './HeroSection.module.css'

export function HeroSection() {
  return (
    <section className={styles.hero} aria-labelledby="hero-titre">
      <div className={styles.media}>
        <img
          src={heroImage}
          alt="Apprenante suivant un cours en direct avec visioconférence, tableau blanc et documents partagés"
          width={801}
          height={577}
          fetchPriority="high"
        />
      </div>

      <Container className={styles.inner}>
        <div className={styles.content}>
          <p className={styles.badge}>
            <span className={styles.badgeDot} aria-hidden />
            {site.nom}
          </p>

          <h1 id="hero-titre" className={styles.title}>
            Apprenez en direct <span className={styles.titleAccent}>avec des experts</span>
          </h1>

          <p className={styles.lead}>
            Des cours en ligne interactifs, en direct, avec des enseignants qualifiés et des outils pédagogiques
            modernes.
          </p>

          <ul role="list" className={styles.highlights}>
            {atoutsHero.map(({ icone: Icone, pleine, titre, complement }) => (
              <li key={titre} className={styles.highlight}>
                <span className={styles.highlightIcon} aria-hidden>
                  <Icone size={28} strokeWidth={2} fill={pleine ? 'currentColor' : 'none'} />
                </span>
                <span className={styles.highlightText}>
                  {titre}
                  <br />
                  {complement}
                </span>
              </li>
            ))}
          </ul>

          <div className={styles.ctas}>
            <ButtonLink to={routes.connexion} size="lg" className={styles.cta}>
              <GraduationCap size={28} aria-hidden />
              Accéder à la plateforme
              <ChevronRight size={22} aria-hidden />
            </ButtonLink>
            <ButtonLink href={site.videoPresentationUrl} external variant="outlineLight" size="lg" className={styles.cta}>
              <span className={styles.playIcon} aria-hidden>
                <Play size={14} fill="currentColor" />
              </span>
              Voir la vidéo de présentation
            </ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  )
}
