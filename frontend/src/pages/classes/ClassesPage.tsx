import { useState } from 'react'
import { Plus, School, Search } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { ButtonLink } from '@/components/ui/Button'
import { Chargement, EtatVide } from '@/components/ui/Feedback'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pagination } from '@/components/ui/Table'
import { routes } from '@/config/routes'
import { useAuth } from '@/features/auth'
import { useClasses } from '@/features/classes'
import { messageErreur } from '@/lib/api/client'
import { useDebounce } from '@/lib/useDebounce'
import { ClasseCarte } from './components/ClasseCarte'
import styles from './Classes.module.css'

const PAR_PAGE = 12

/** Liste des classes : toutes pour l'administration, les siennes pour un enseignant ou un apprenant. */
export function ClassesPage() {
  const { utilisateur } = useAuth()
  const estAdmin = utilisateur?.role === 'ADMIN'

  const [statut, setStatut] = useState<'actives' | 'archivees' | 'toutes'>('actives')
  const [recherche, setRecherche] = useState('')
  const [page, setPage] = useState(1)
  const rechercheDiff = useDebounce(recherche)

  const { data, isLoading, isError, error } = useClasses({
    active: statut === 'toutes' ? undefined : statut === 'actives',
    recherche: rechercheDiff,
    page,
    parPage: PAR_PAGE,
  })

  return (
    <>
      <PageHeader
        titre={estAdmin ? 'Classes' : 'Mes classes'}
        sousTitre={
          estAdmin
            ? 'Créez les classes, affectez les enseignants et inscrivez les apprenants.'
            : utilisateur?.role === 'ENSEIGNANT'
              ? 'Les classes qui vous sont affectées.'
              : 'Les classes auxquelles vous êtes inscrit.'
        }
        actions={
          estAdmin && (
            <ButtonLink to={routes.nouvelleClasse}>
              <Plus size={20} aria-hidden />
              Nouvelle classe
            </ButtonLink>
          )
        }
      />

      <div className={styles.filtres}>
        <label className={styles.recherche}>
          <Search size={18} aria-hidden />
          <input
            type="search"
            placeholder="Rechercher une classe"
            aria-label="Rechercher une classe"
            value={recherche}
            onChange={(e) => {
              setRecherche(e.target.value)
              setPage(1)
            }}
          />
        </label>
        <select
          className={styles.select}
          aria-label="Filtrer par statut"
          value={statut}
          onChange={(e) => {
            setStatut(e.target.value as typeof statut)
            setPage(1)
          }}
        >
          <option value="actives">Classes en cours</option>
          <option value="archivees">Classes archivées</option>
          <option value="toutes">Toutes les classes</option>
        </select>
      </div>

      {isLoading ? (
        <Chargement />
      ) : isError ? (
        <Alert variante="erreur">{messageErreur(error)}</Alert>
      ) : !data || data.donnees.length === 0 ? (
        <EtatVide
          icone={School}
          titre="Aucune classe"
          message={
            recherche
              ? 'Aucune classe ne correspond à votre recherche.'
              : estAdmin
                ? 'Créez une première classe pour y affecter des enseignants et inscrire des apprenants.'
                : 'Aucune classe ne vous est encore attribuée.'
          }
          action={
            estAdmin &&
            !recherche && (
              <ButtonLink to={routes.nouvelleClasse}>
                <Plus size={20} aria-hidden />
                Créer une classe
              </ButtonLink>
            )
          }
        />
      ) : (
        <>
          <ul role="list" className={styles.grille}>
            {data.donnees.map((classe) => (
              <li key={classe.id}>
                <ClasseCarte classe={classe} />
              </li>
            ))}
          </ul>
          <Pagination page={data.page} parPage={data.parPage} total={data.total} onPage={setPage} />
        </>
      )}
    </>
  )
}
