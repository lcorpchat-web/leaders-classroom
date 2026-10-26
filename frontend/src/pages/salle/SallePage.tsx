import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Clock, DoorOpen, ExternalLink, LogOut, MonitorPlay, Square, Users } from 'lucide-react'
import logo from '@/assets/images/logo-institut.png'
import { Alert } from '@/components/ui/Alert'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Chargement } from '@/components/ui/Feedback'
import { ConfirmDialog } from '@/components/ui/Modal'
import { routes } from '@/config/routes'
import { site } from '@/config/site'
import { useAuth } from '@/features/auth'
import { ParticipantsPanneau, salleApi } from '@/features/salle'
import { useSeance } from '@/features/seances'
import { ApiError, messageErreur } from '@/lib/api/client'
import { formaterCreneau, formaterJourLong } from '@/lib/dates'
import styles from './SallePage.module.css'

/** Erreur « séance pas encore démarrée » : salle d'attente avec nouvelle tentative automatique (figure 7, 4a) */
const enAttente = (erreur: unknown) => erreur instanceof ApiError && erreur.code === 'SEANCE_NON_DEMARREE'

/** Durée écoulée « 00:42:18 » depuis un instant */
function chronometre(depuisMs: number, maintenantMs: number): string {
  const s = Math.max(0, Math.floor((maintenantMs - depuisMs) / 1000))
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`
}

/**
 * Salle de classe virtuelle (maquette 07, figures 6 et 7).
 * BigBlueButton fournit audio, vidéo, chat, tableau blanc et partage d'écran ; notre page
 * l'encadre et suit les présences des participants en direct.
 */
export function SallePage() {
  const { id = '' } = useParams()
  const [parametres] = useSearchParams()
  const animer = parametres.get('animer') === '1'
  const sortie = parametres.get('sortie') === '1'
  const { utilisateur } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [maintenant, setMaintenant] = useState(() => Date.now())
  const [confirmerFin, setConfirmerFin] = useState(false)
  const [finEnCours, setFinEnCours] = useState(false)
  const [erreurAction, setErreurAction] = useState<string | null>(null)

  // Retour de BigBlueButton (logoutURL) : la page s'ouvre dans l'iframe, on revient à la fenêtre principale
  useEffect(() => {
    if (sortie && window.top && window.top !== window.self) window.top.location.href = window.location.href
  }, [sortie])

  const acces = useQuery({
    queryKey: ['salle', id, animer ? 'animer' : 'rejoindre'],
    queryFn: () => (animer ? salleApi.demarrer(id) : salleApi.rejoindre(id)),
    enabled: Boolean(id) && !sortie,
    retry: false,
    staleTime: Infinity,
    gcTime: 0,
    refetchInterval: (query) => (enAttente(query.state.error) ? 15_000 : false),
  })
  const dansLaSalle = Boolean(acces.data)
  const seanceInfos = useSeance(id)
  const seance = acces.data?.seance ?? seanceInfos.data

  const participants = useQuery({
    queryKey: ['salle', id, 'participants'],
    queryFn: () => salleApi.participants(id),
    enabled: dansLaSalle,
    refetchInterval: 10_000,
  })

  // Chronomètre
  useEffect(() => {
    if (!dansLaSalle) return
    const minuteur = setInterval(() => setMaintenant(Date.now()), 1000)
    return () => clearInterval(minuteur)
  }, [dansLaSalle])

  // Fermeture de l'onglet : enregistre l'heure de départ (présences fiables)
  useEffect(() => {
    if (!dansLaSalle) return
    const onPageHide = () => salleApi.quitterEnArrierePlan(id)
    window.addEventListener('pagehide', onPageHide)
    return () => window.removeEventListener('pagehide', onPageHide)
  }, [dansLaSalle, id])

  // Retour depuis BBB : la sortie est enregistrée
  useEffect(() => {
    if (sortie && window.top === window.self) salleApi.quitter(id).catch(() => undefined)
  }, [sortie, id])

  async function quitter() {
    await salleApi.quitter(id).catch(() => undefined)
    navigate(routes.tableauDeBord)
  }

  async function terminer() {
    setFinEnCours(true)
    try {
      await salleApi.terminer(id)
      await queryClient.invalidateQueries({ queryKey: ['seances'] })
      navigate(`${routes.presences}?seance=${id}`)
    } catch (e) {
      setErreurAction(messageErreur(e))
      setConfirmerFin(false)
    } finally {
      setFinEnCours(false)
    }
  }

  const estAnimateur = animer || utilisateur?.role === 'ENSEIGNANT'

  // ---------- Sortie ----------
  if (sortie) {
    return (
      <Cadre>
        <div className={styles.message}>
          <DoorOpen size={40} aria-hidden className={styles.messageIcone} />
          <h1>Vous avez quitté la séance</h1>
          <p>Votre heure de départ a été enregistrée.</p>
          <div className={styles.messageActions}>
            <ButtonLink to={routes.salle(id, animer)} variant="outline">
              Revenir dans la salle
            </ButtonLink>
            <ButtonLink to={routes.tableauDeBord}>Tableau de bord</ButtonLink>
          </div>
        </div>
      </Cadre>
    )
  }

  // ---------- Salle d'attente ou accès refusé ----------
  if (!acces.data) {
    if (acces.isLoading) return <Cadre><Chargement libelle="Connexion à la salle…" /></Cadre>
    const attente = enAttente(acces.error)
    return (
      <Cadre>
        <div className={styles.message}>
          {attente ? <Clock size={40} aria-hidden className={styles.messageIcone} /> : null}
          <h1>{attente ? 'Salle d’attente' : 'Accès impossible'}</h1>
          {seance && (
            <p className={styles.messageSeance}>
              <strong>{seance.classe.nom}</strong> — {seance.titre}
              <br />
              {formaterJourLong(new Date(seance.debut))}, {formaterCreneau(new Date(seance.debut), seance.dureeMinutes)}
            </p>
          )}
          {attente ? (
            <p role="status">
              La séance n’a pas encore commencé. Cette page vous fera entrer automatiquement dès que l’enseignant
              ouvrira la salle.
            </p>
          ) : (
            <Alert variante="erreur">{messageErreur(acces.error)}</Alert>
          )}
          <div className={styles.messageActions}>
            <ButtonLink to={routes.tableauDeBord} variant="outline">
              Retour au tableau de bord
            </ButtonLink>
            {attente && <Button onClick={() => acces.refetch()}>Réessayer maintenant</Button>}
          </div>
        </div>
      </Cadre>
    )
  }

  // ---------- Dans la salle ----------
  const { urlSalle, simulation } = acces.data
  const debutMs = new Date(acces.data.seance.debut).getTime()

  return (
    <div className={styles.salle}>
      <header className={styles.bandeau}>
        <Link to={routes.tableauDeBord} className={styles.logo}>
          <img src={logo} alt={`${site.nom} — tableau de bord`} width={298} height={136} />
        </Link>
        <div className={styles.titres}>
          <h1>{acces.data.seance.classe.nom}</h1>
          <p>
            {acces.data.seance.titre} · {formaterCreneau(new Date(acces.data.seance.debut), acces.data.seance.dureeMinutes)}
          </p>
        </div>
        <div className={styles.indicateurs}>
          <span className={styles.direct} title="Temps écoulé depuis le début prévu">
            <span className={styles.pointDirect} aria-hidden />
            {chronometre(debutMs, maintenant)}
          </span>
          <span className={styles.nbParticipants} title="Participants en ligne">
            <Users size={18} aria-hidden />
            {participants.data?.participants.filter((p) => p.etat === 'EN_LIGNE').length ?? '…'}
          </span>
        </div>
        <div className={styles.actions}>
          {estAnimateur && (
            <Button size="sm" variant="outlineLight" className={styles.boutonTerminer} onClick={() => setConfirmerFin(true)}>
              <Square size={16} aria-hidden />
              Terminer la séance
            </Button>
          )}
          <Button size="sm" variant="danger" onClick={quitter}>
            <LogOut size={16} aria-hidden />
            Quitter la session
          </Button>
        </div>
      </header>

      {erreurAction && (
        <Alert variante="erreur" className={styles.alerte}>
          {erreurAction}
        </Alert>
      )}

      <div className={styles.corps}>
        <main className={styles.scene}>
          {urlSalle ? (
            <>
              <iframe
                src={urlSalle}
                title="Salle de classe virtuelle BigBlueButton"
                className={styles.iframe}
                allow="camera; microphone; display-capture; fullscreen; autoplay; clipboard-write"
              />
              <a href={urlSalle} target="_blank" rel="noopener noreferrer" className={styles.lienExterne}>
                <ExternalLink size={14} aria-hidden />
                Ouvrir la salle dans un nouvel onglet
              </a>
            </>
          ) : (
            <div className={styles.simulation}>
              <MonitorPlay size={56} aria-hidden />
              <h2>{simulation ? 'Salle virtuelle — mode simulation' : 'Salle indisponible'}</h2>
              <p>
                Aucun serveur BigBlueButton n’est encore configuré. La salle réelle (audio, vidéo, chat, tableau blanc,
                partage d’écran et documents) s’affichera ici. Les entrées, sorties et présences sont enregistrées
                normalement.
              </p>
            </div>
          )}
        </main>

        <aside className={styles.lateral}>
          {participants.data ? (
            <ParticipantsPanneau participants={participants.data.participants} moiId={utilisateur?.id} />
          ) : (
            <Chargement />
          )}
        </aside>
      </div>

      <ConfirmDialog
        ouvert={confirmerFin}
        titre="Terminer la séance"
        message="La salle sera fermée pour tous les participants et les présences seront calculées. Cette action est définitive."
        libelleConfirmer="Terminer la séance"
        enCours={finEnCours}
        onConfirmer={terminer}
        onAnnuler={() => setConfirmerFin(false)}
      />
    </div>
  )
}

/** Fond de page des écrans d'attente et de sortie */
function Cadre({ children }: { children: ReactNode }) {
  return (
    <div className={styles.cadre}>
      <Link to={routes.tableauDeBord} className={styles.cadreLogo}>
        <img src={logo} alt={site.nom} width={298} height={136} />
      </Link>
      {children}
    </div>
  )
}
