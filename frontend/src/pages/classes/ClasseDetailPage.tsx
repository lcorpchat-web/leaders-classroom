import { useState } from 'react'
import { useParams } from 'react-router'
import { Archive, ArchiveRestore, CalendarDays, GraduationCap, Pencil, Users } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Chargement } from '@/components/ui/Feedback'
import { ConfirmDialog } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { routes } from '@/config/routes'
import { useAuth } from '@/features/auth'
import { useClasse, useModifierClasse } from '@/features/classes'
import { ApiError, messageErreur } from '@/lib/api/client'
import { formaterPeriode } from '@/lib/format'
import { ClasseFormModal } from './components/ClasseFormModal'
import { EnseignantsSection } from './components/EnseignantsSection'
import { ImageClasse } from './components/ImageClasse'
import { InscriptionsSection } from './components/InscriptionsSection'
import { SeancesSection } from './components/SeancesSection'
import { SupportsSection } from './components/SupportsSection'
import styles from './Classes.module.css'

/** Détail d'une classe : informations, enseignants affectés et apprenants inscrits. */
export function ClasseDetailPage() {
  const { id = '' } = useParams()
  const { utilisateur } = useAuth()
  const estAdmin = utilisateur?.role === 'ADMIN'

  const { data: classe, isLoading, isError, error } = useClasse(id)
  const modifier = useModifierClasse(id)
  const [edition, setEdition] = useState(false)
  const [archivage, setArchivage] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  if (isLoading) return <Chargement />

  if (isError || !classe) {
    const introuvable = error instanceof ApiError && error.status === 404
    return (
      <>
        <PageHeader titre="Classe" retour={{ to: routes.classes, libelle: 'Retour aux classes' }} />
        <Alert variante="erreur">
          {introuvable ? 'Cette classe n’existe pas ou ne vous est pas accessible.' : messageErreur(error)}
        </Alert>
      </>
    )
  }

  async function basculerArchivage() {
    try {
      await modifier.mutateAsync({ active: !classe!.active })
    } catch (e) {
      setErreur(messageErreur(e))
    } finally {
      setArchivage(false)
    }
  }

  return (
    <>
      <PageHeader
        retour={{ to: routes.classes, libelle: estAdmin ? 'Retour aux classes' : 'Retour à mes classes' }}
        titre={
          <>
            {classe.nom}
            <Badge ton={classe.active ? 'succes' : 'neutre'}>{classe.active ? 'En cours' : 'Archivée'}</Badge>
          </>
        }
        sousTitre={classe.description}
        actions={
          estAdmin && (
            <>
              <Button variant="outline" onClick={() => setEdition(true)}>
                <Pencil size={18} aria-hidden />
                Modifier
              </Button>
              <Button variant="outline" onClick={() => setArchivage(true)}>
                {classe.active ? <Archive size={18} aria-hidden /> : <ArchiveRestore size={18} aria-hidden />}
                {classe.active ? 'Archiver' : 'Réactiver'}
              </Button>
            </>
          )
        }
      />

      {erreur && (
        <Alert variante="erreur" className={styles.alerteSection}>
          {erreur}
        </Alert>
      )}

      <ul role="list" className={styles.indicateurs}>
        <li>
          <span className={styles.indicateurIcone} aria-hidden>
            <CalendarDays size={22} />
          </span>
          <div>
            <p className={styles.indicateurLibelle}>Période</p>
            <p className={styles.indicateurValeur}>{formaterPeriode(classe.dateDebut, classe.dateFin)}</p>
          </div>
        </li>
        <li>
          <span className={styles.indicateurIcone} aria-hidden>
            <GraduationCap size={22} />
          </span>
          <div>
            <p className={styles.indicateurLibelle}>Apprenants inscrits</p>
            <p className={styles.indicateurValeur}>
              {classe.nbApprenants}
              {classe.capaciteMax ? ` / ${classe.capaciteMax}` : ''}
            </p>
          </div>
        </li>
        <li>
          <span className={styles.indicateurIcone} aria-hidden>
            <Users size={22} />
          </span>
          <div>
            <p className={styles.indicateurLibelle}>Enseignants</p>
            <p className={styles.indicateurValeur}>{classe.enseignants.length}</p>
          </div>
        </li>
      </ul>

      <div className={styles.detailGrille}>
        <div className={styles.colonne}>
          <ImageClasse classe={classe} modifiable={estAdmin} />
          <EnseignantsSection classe={classe} estAdmin={estAdmin} />
          <SupportsSection classe={classe} />
        </div>
        <div className={styles.colonne}>
          <SeancesSection classe={classe} />
          {utilisateur?.role !== 'APPRENANT' && <InscriptionsSection classe={classe} estAdmin={estAdmin} />}
        </div>
      </div>

      {edition && <ClasseFormModal classe={classe} onFermer={() => setEdition(false)} />}

      <ConfirmDialog
        ouvert={archivage}
        titre={classe.active ? 'Archiver la classe' : 'Réactiver la classe'}
        message={
          classe.active
            ? 'La classe n’apparaîtra plus dans les classes en cours et aucune nouvelle inscription ne sera possible. Son historique est conservé.'
            : 'La classe redevient active : de nouvelles inscriptions sont possibles.'
        }
        libelleConfirmer={classe.active ? 'Archiver' : 'Réactiver'}
        enCours={modifier.isPending}
        onConfirmer={basculerArchivage}
        onAnnuler={() => setArchivage(false)}
      />
    </>
  )
}
