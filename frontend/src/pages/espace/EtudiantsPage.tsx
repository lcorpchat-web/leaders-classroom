import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Search, UserRound } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { Chargement, EtatVide } from '@/components/ui/Feedback'
import { PageHeader } from '@/components/ui/PageHeader'
import { Table } from '@/components/ui/Table'
import { routes } from '@/config/routes'
import { useClasses } from '@/features/classes'
import { useMesEtudiants } from '@/features/espace/espace'
import { messageErreur } from '@/lib/api/client'
import { useDebounce } from '@/lib/useDebounce'
import styles from './Espace.module.css'

/** « Mes étudiants » : apprenants inscrits dans mes classes, avec leur taux de présence. */
export function EtudiantsPage() {
  const [parametres] = useSearchParams()
  const [recherche, setRecherche] = useState(parametres.get('recherche') ?? '')
  const [classeId, setClasseId] = useState('')
  const rechercheDiff = useDebounce(recherche)
  const { data: classes } = useClasses({ active: true, parPage: 100 })
  const { data: etudiants, isLoading, isError, error } = useMesEtudiants({ classeId: classeId || undefined, recherche: rechercheDiff })

  return (
    <>
      <PageHeader titre="Mes étudiants" sousTitre="Les apprenants inscrits dans vos classes." />
      <Card sansMarge>
        <div className={styles.filtres}>
          <label className={styles.recherche}>
            <Search size={18} aria-hidden />
            <input type="search" placeholder="Nom, e-mail ou matricule" aria-label="Rechercher un étudiant" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
          </label>
          <select className={styles.select} aria-label="Filtrer par classe" value={classeId} onChange={(e) => setClasseId(e.target.value)}>
            <option value="">Toutes mes classes</option>
            {(classes?.donnees ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <Chargement />
        ) : isError || !etudiants ? (
          <Alert variante="erreur">{messageErreur(error)}</Alert>
        ) : etudiants.length === 0 ? (
          <EtatVide icone={UserRound} titre="Aucun étudiant trouvé" />
        ) : (
          <Table>
            <thead>
              <tr>
                <th scope="col">Étudiant</th>
                <th scope="col">Matricule</th>
                <th scope="col">Classes</th>
                <th scope="col">Téléphone</th>
                <th scope="col">Taux de présence</th>
              </tr>
            </thead>
            <tbody>
              {etudiants.map((e) => (
                <tr key={e.id}>
                  <td>
                    <div className={styles.personne}>
                      <Avatar id={e.id} photo={e.photo} prenom={e.prenom} nom={e.nom} taille="sm" />
                      <div>
                        <p className={styles.nom}>
                          {e.prenom} {e.nom}
                        </p>
                        <p className={styles.muet}>{e.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>{e.matricule ?? '—'}</td>
                  <td>
                    <div className={styles.liensClasses}>
                      {e.classes.map((c) => (
                        <Link key={c.id} to={routes.classe(c.id)}>
                          {c.nom}
                        </Link>
                      ))}
                    </div>
                  </td>
                  <td>{e.telephone ?? '—'}</td>
                  <td>
                    <div className={styles.progression}>
                      <span className={styles.barre} aria-hidden>
                        <span style={{ width: `${e.tauxPresence ?? 0}%` }} />
                      </span>
                      <strong>{e.tauxPresence === null ? '—' : `${e.tauxPresence}%`}</strong>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  )
}
