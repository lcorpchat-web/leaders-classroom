import { useState } from 'react'
import { Link } from 'react-router'
import { CalendarDays, Clock, School, UserRound, Video } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Button, ButtonLink } from '@/components/ui/Button'
import { ConfirmDialog, Modal } from '@/components/ui/Modal'
import { routes } from '@/config/routes'
import { useAuth } from '@/features/auth'
import { messageErreur } from '@/lib/api/client'
import { formaterCreneau, formaterDuree, formaterJourLong } from '@/lib/dates'
import { useAnnulerSeance } from '../seances.hooks'
import { libellesStatutSeance, tonStatutSeance, type Seance } from '../seances.types'
import { SeanceFormModal } from './SeanceFormModal'
import styles from './Seances.module.css'

/** Fiche d'une séance ; modification et annulation tant qu'elle est programmée et à venir. */
export function SeanceDetailModal({ seance, onFermer }: { seance: Seance; onFermer: () => void }) {
  const { utilisateur } = useAuth()
  const annuler = useAnnulerSeance()
  const [edition, setEdition] = useState(false)
  const [confirmation, setConfirmation] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)
  // Instant d'ouverture de la fiche (le rendu doit rester pur)
  const [ouvertureMs] = useState(() => Date.now())

  const debut = new Date(seance.debut)
  const finMs = debut.getTime() + seance.dureeMinutes * 60_000
  // L'API applique RG4 (enseignants affectés) ; ici on n'affiche les actions qu'à l'animateur et à l'administration
  const gestionnaire = utilisateur?.role === 'ADMIN' || seance.enseignant.id === utilisateur?.id
  const modifiable = gestionnaire && seance.statut === 'PROGRAMMEE' && debut.getTime() > ouvertureMs

  // Classe virtuelle : un enseignant (affecté, sinon la séance ne lui serait pas visible) ouvre la salle
  // 15 minutes avant le début ; un apprenant rejoint une séance en cours ou attend en salle d'attente.
  const creneauOuvert = ouvertureMs >= debut.getTime() - 15 * 60_000 && ouvertureMs <= finMs
  const peutDemarrer =
    utilisateur?.role === 'ENSEIGNANT' &&
    (seance.statut === 'EN_COURS' || (seance.statut === 'PROGRAMMEE' && creneauOuvert))
  const peutRejoindre =
    utilisateur?.role === 'APPRENANT' &&
    (seance.statut === 'EN_COURS' || (seance.statut === 'PROGRAMMEE' && creneauOuvert))
  const feuilleDisponible = utilisateur?.role !== 'APPRENANT' && seance.statut === 'TERMINEE'

  async function confirmerAnnulation() {
    try {
      await annuler.mutateAsync(seance.id)
      onFermer()
    } catch (e) {
      setErreur(messageErreur(e))
      setConfirmation(false)
    }
  }

  if (edition) return <SeanceFormModal seance={seance} onFermer={onFermer} />

  return (
    <>
      <Modal
        ouvert={!confirmation}
        onFermer={onFermer}
        titre={seance.titre}
        actions={
          (modifiable || peutDemarrer || peutRejoindre || feuilleDisponible) && (
            <>
              {modifiable && (
                <>
                  <Button variant="outline" onClick={() => setConfirmation(true)}>
                    Annuler la séance
                  </Button>
                  <Button variant="outline" onClick={() => setEdition(true)}>
                    Modifier
                  </Button>
                </>
              )}
              {feuilleDisponible && (
                <ButtonLink to={`${routes.presences}?seance=${seance.id}`} variant="outline">
                  Feuille de présence
                </ButtonLink>
              )}
              {peutDemarrer && (
                <ButtonLink to={routes.salle(seance.id, true)}>
                  <Video size={20} aria-hidden />
                  {seance.statut === 'EN_COURS' ? 'Reprendre la séance' : 'Démarrer la séance'}
                </ButtonLink>
              )}
              {peutRejoindre && (
                <ButtonLink to={routes.salle(seance.id)}>
                  <Video size={20} aria-hidden />
                  {seance.statut === 'EN_COURS' ? 'Rejoindre' : 'Salle d’attente'}
                </ButtonLink>
              )}
            </>
          )
        }
      >
        <div className={styles.fiche}>
          <Badge ton={tonStatutSeance[seance.statut]}>{libellesStatutSeance[seance.statut]}</Badge>
          <ul role="list" className={styles.ficheListe}>
            <li>
              <CalendarDays size={18} aria-hidden />
              {formaterJourLong(debut)}
            </li>
            <li>
              <Clock size={18} aria-hidden />
              {formaterCreneau(debut, seance.dureeMinutes)} ({formaterDuree(seance.dureeMinutes)})
            </li>
            <li>
              <School size={18} aria-hidden />
              <Link to={routes.classe(seance.classe.id)} className={styles.lien} onClick={onFermer}>
                {seance.classe.nom}
              </Link>
            </li>
            <li>
              <UserRound size={18} aria-hidden />
              {seance.enseignant.prenom} {seance.enseignant.nom}
            </li>
          </ul>
          {seance.statut === 'PROGRAMMEE' && !creneauOuvert && (
            <p className={styles.ficheNote}>La salle de classe virtuelle ouvre 15 minutes avant le début de la séance.</p>
          )}
          {erreur && <Alert variante="erreur">{erreur}</Alert>}
        </div>
      </Modal>

      <ConfirmDialog
        ouvert={confirmation}
        titre="Annuler la séance"
        message={`« ${seance.titre} » du ${formaterJourLong(debut)} sera annulée et retirée des plannings. Cette action est définitive.`}
        libelleConfirmer="Annuler la séance"
        enCours={annuler.isPending}
        onConfirmer={confirmerAnnulation}
        onAnnuler={() => setConfirmation(false)}
      />
    </>
  )
}
