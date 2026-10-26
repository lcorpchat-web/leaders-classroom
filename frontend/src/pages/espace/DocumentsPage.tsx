import { useState } from 'react'
import { Link } from 'react-router'
import { Download, Eye, FileText, Search } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Card } from '@/components/ui/Card'
import { Chargement, EtatVide } from '@/components/ui/Feedback'
import { PageHeader } from '@/components/ui/PageHeader'
import { Table } from '@/components/ui/Table'
import { routes } from '@/config/routes'
import { useClasses } from '@/features/classes'
import { useMesDocuments } from '@/features/espace/espace'
import { formaterTaille, typesApercu, urlFichier } from '@/features/supports'
import { messageErreur } from '@/lib/api/client'
import { formaterJour } from '@/lib/format'
import { useDebounce } from '@/lib/useDebounce'
import styles from './Espace.module.css'

/** « Mes documents » : supports de cours de toutes mes classes. */
export function DocumentsPage() {
  const [recherche, setRecherche] = useState('')
  const [classeId, setClasseId] = useState('')
  const rechercheDiff = useDebounce(recherche)
  const { data: classes } = useClasses({ parPage: 100 })
  const { data: documents, isLoading, isError, error } = useMesDocuments({ classeId: classeId || undefined, recherche: rechercheDiff })

  return (
    <>
      <PageHeader titre="Mes documents" sousTitre="Tous les supports de cours de vos classes. Pour en déposer un, ouvrez la classe concernée." />
      <Card sansMarge>
        <div className={styles.filtres}>
          <label className={styles.recherche}>
            <Search size={18} aria-hidden />
            <input type="search" placeholder="Titre ou nom du fichier" aria-label="Rechercher un document" value={recherche} onChange={(e) => setRecherche(e.target.value)} />
          </label>
          <select className={styles.select} aria-label="Filtrer par classe" value={classeId} onChange={(e) => setClasseId(e.target.value)}>
            <option value="">Toutes les classes</option>
            {(classes?.donnees ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <Chargement />
        ) : isError || !documents ? (
          <Alert variante="erreur">{messageErreur(error)}</Alert>
        ) : documents.length === 0 ? (
          <EtatVide icone={FileText} titre="Aucun document" />
        ) : (
          <Table>
            <thead>
              <tr>
                <th scope="col">Document</th>
                <th scope="col">Classe</th>
                <th scope="col">Déposé par</th>
                <th scope="col">Date</th>
                <th scope="col">Taille</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id}>
                  <td>
                    <div className={styles.personne}>
                      <span className={styles.iconeFichier} aria-hidden>
                        <FileText size={20} />
                      </span>
                      <div>
                        <p className={styles.nom}>{d.titre}</p>
                        <p className={styles.muet}>
                          {d.nomFichier}
                          {d.seance && ` · ${d.seance.titre}`}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Link to={routes.classe(d.classe.id)} className={styles.lien}>
                      {d.classe.nom}
                    </Link>
                  </td>
                  <td>{d.deposePar ? `${d.deposePar.prenom} ${d.deposePar.nom}` : '—'}</td>
                  <td>{formaterJour(d.deposeLe)}</td>
                  <td>{formaterTaille(d.tailleOctets)}</td>
                  <td>
                    <div className={styles.actions}>
                      {typesApercu.includes(d.typeMime) && (
                        <a href={urlFichier(d.id, true)} target="_blank" rel="noopener noreferrer" className={styles.boutonIcone} aria-label={`Ouvrir ${d.titre}`}>
                          <Eye size={18} aria-hidden />
                        </a>
                      )}
                      <a href={urlFichier(d.id)} download className={styles.boutonIcone} aria-label={`Télécharger ${d.titre}`}>
                        <Download size={18} aria-hidden />
                      </a>
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
