import { Container } from '@/components/ui/Container'
import { statistiques } from '../home.content'
import styles from './StatsSection.module.css'

export function StatsSection() {
  return (
    <section className={styles.section} aria-labelledby="chiffres-titre">
      <Container>
        <h2 id="chiffres-titre" className="sr-only">
          Leaders Classroom en chiffres
        </h2>

        <ul role="list" className={styles.list}>
          {statistiques.map(({ icone: Icone, pleine, valeur, libelle }) => (
            <li key={libelle} className={styles.item}>
              <Icone
                className={styles.icon}
                size={60}
                strokeWidth={pleine ? 1.5 : 2}
                fill={pleine ? 'currentColor' : 'none'}
                aria-hidden
              />
              <p>
                <strong className={styles.value}>{valeur}</strong>
                <span className={styles.label}>{libelle}</span>
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
