import { Container } from '@/components/ui/Container'
import { fonctionnalites } from '../home.content'
import styles from './FeaturesSection.module.css'

export function FeaturesSection() {
  return (
    <section id="fonctionnalites" className={styles.section} aria-labelledby="fonctionnalites-titre">
      <Container>
        <h2 id="fonctionnalites-titre" className="sr-only">
          Fonctionnalités de la plateforme
        </h2>

        <ul role="list" className={styles.grid}>
          {fonctionnalites.map(({ icone: Icone, pleine, titre, description }) => (
            <li key={titre} className={styles.card}>
              <span className={styles.icon} aria-hidden>
                <Icone size={34} strokeWidth={2} fill={pleine ? 'currentColor' : 'none'} />
              </span>
              <div>
                <h3 className={styles.title}>{titre}</h3>
                <p className={styles.description}>{description}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
