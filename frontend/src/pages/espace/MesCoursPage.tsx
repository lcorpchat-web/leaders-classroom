import { Link } from 'react-router'
import { BookOpen, CalendarDays, FileText, Users } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { ClasseVignette } from '@/components/ui/ClasseVignette'
import { Chargement, EtatVide } from '@/components/ui/Feedback'
import { PageHeader } from '@/components/ui/PageHeader'
import { routes } from '@/config/routes'
import { useAuth } from '@/features/auth'
import { useMesCours } from '@/features/espace/espace'
import { messageErreur } from '@/lib/api/client'
import { formaterJourCourt } from '@/lib/dates'
import styles from './Espace.module.css'

/** « Mes cours » : contenu pédagogique de chaque classe et progression des séances. */
export function MesCoursPage() {
  const { utilisateur } = useAuth()
  const { data: cours, isLoading, isError, error } = useMesCours()

  return (
    <>
      <PageHeader
        titre="Mes cours"
        sousTitre={utilisateur?.role === 'APPRENANT' ? 'Suivez votre progression dans chacun de vos cours.' : 'Les cours que vous animez et leur avancement.'}
      />
      {isLoading ? (
        <Chargement />
      ) : isError || !cours ? (
        <Alert variante="erreur">{messageErreur(error)}</Alert>
      ) : cours.length === 0 ? (
        <EtatVide icone={BookOpen} titre="Aucun cours en cours" />
      ) : (
        <ul role="list" className={styles.coursGrille}>
          {cours.map((c) => (
            <li key={c.id}>
              <Link to={routes.classe(c.id)} className={styles.coursCarte}>
                <ClasseVignette classe={c} className={styles.coursImage} />
                <div className={styles.coursCorps}>
                  {(c.categorie || c.niveau) && (
                    <div className={styles.badges}>
                      {c.categorie && <Badge ton="marque">{c.categorie}</Badge>}
                      {c.niveau && <Badge>{c.niveau}</Badge>}
                    </div>
                  )}
                  <h2 className={styles.coursNom}>{c.nom}</h2>
                  <p className={styles.muet}>{c.enseignants.map((e) => `${e.prenom} ${e.nom}`).join(', ')}</p>
                  <div className={styles.progression}>
                    <span className={styles.barre} aria-hidden>
                      <span style={{ width: `${c.progression}%` }} />
                    </span>
                    <strong>{c.progression}%</strong>
                  </div>
                  <ul role="list" className={styles.coursInfos}>
                    <li>
                      <CalendarDays size={16} aria-hidden />
                      {c.nbSeances} séance{c.nbSeances > 1 ? 's' : ''}
                    </li>
                    <li>
                      <FileText size={16} aria-hidden />
                      {c.nbSupports} document{c.nbSupports > 1 ? 's' : ''}
                    </li>
                    {utilisateur?.role !== 'APPRENANT' && (
                      <li>
                        <Users size={16} aria-hidden />
                        {c.nbApprenants} étudiant{c.nbApprenants > 1 ? 's' : ''}
                      </li>
                    )}
                  </ul>
                  {c.prochaineSeance && (
                    <p className={styles.prochaine}>
                      Prochaine séance : <strong>{formaterJourCourt(new Date(c.prochaineSeance.debut))}</strong> — {c.prochaineSeance.titre}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
