import { Link } from 'react-router'
import { CalendarDays, School, Users } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { routes } from '@/config/routes'
import type { Classe } from '@/features/classes'
import { formaterPeriode, pluriel } from '@/lib/format'
import styles from '../Classes.module.css'

/** Carte d'une classe dans la liste (lien vers le détail). */
export function ClasseCarte({ classe }: { classe: Classe }) {
  const taux = classe.capaciteMax ? Math.min(100, Math.round((classe.nbApprenants / classe.capaciteMax) * 100)) : null

  return (
    <Link to={routes.classe(classe.id)} className={styles.carte}>
      <div className={styles.carteBandeau} aria-hidden>
        <School size={28} />
      </div>
      <div className={styles.carteCorps}>
        <div className={styles.carteTitre}>
          <h2>{classe.nom}</h2>
          {!classe.active && <Badge>Archivée</Badge>}
        </div>

        <p className={styles.carteInfo}>
          <CalendarDays size={16} aria-hidden />
          {formaterPeriode(classe.dateDebut, classe.dateFin)}
        </p>
        <p className={styles.carteInfo}>
          <Users size={16} aria-hidden />
          {classe.enseignants.map((e) => `${e.prenom} ${e.nom}`).join(', ') || 'Aucun enseignant'}
        </p>

        <div className={styles.capacite}>
          <p>
            {pluriel(classe.nbApprenants, 'apprenant')}
            {classe.capaciteMax && <span> / {classe.capaciteMax} places</span>}
          </p>
          {taux !== null && (
            <div
              className={styles.barre}
              role="progressbar"
              aria-valuenow={taux}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Taux de remplissage"
            >
              <span style={{ width: `${taux}%` }} />
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
