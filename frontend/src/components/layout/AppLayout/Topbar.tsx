import { useCallback, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Bell, ChevronDown, FileText, LogOut, Mail, Menu, School, Search, Settings, UserRound } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { routes } from '@/config/routes'
import { libellesRole, useAuth } from '@/features/auth'
import { notifications, useTableauDeBord } from '@/features/tableau-de-bord/tableauDeBord'
import { apiRequest, query } from '@/lib/api/client'
import { cx } from '@/lib/cx'
import { useClicExterieur } from '@/lib/useClicExterieur'
import { useDebounce } from '@/lib/useDebounce'
import styles from './Topbar.module.css'

const formatDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/** Barre du haut des maquettes 02 à 06 : recherche, notifications, messages et profil. */
export function Topbar({ onOuvrirMenu }: { onOuvrirMenu: () => void }) {
  const { utilisateur } = useAuth()
  if (!utilisateur) return null

  return (
    <header className={styles.topbar}>
      <button type="button" className={styles.burger} onClick={onOuvrirMenu} aria-label="Ouvrir le menu">
        <Menu size={26} aria-hidden />
      </button>
      <RechercheGlobale apprenant={utilisateur.role === 'APPRENANT'} />
      <div className={styles.droite}>
        <Notifications utilisateurId={utilisateur.id} />
        <Link to={routes.messages} className={styles.icone} aria-label="Messages">
          <Mail size={24} strokeWidth={1.75} aria-hidden />
        </Link>
        <MenuProfil />
      </div>
    </header>
  )
}

interface ResultatsRecherche {
  classes: Array<{ id: string; nom: string }>
  apprenants: Array<{ id: string; nom: string; prenom: string; email: string; photo: string | null }>
  documents: Array<{ id: string; titre: string; nomFichier: string; classe: { id: string; nom: string } }>
}

/** « Rechercher une classe, un étudiant, un document… » */
function RechercheGlobale({ apprenant }: { apprenant: boolean }) {
  const [texte, setTexte] = useState('')
  const [ouvert, setOuvert] = useState(false)
  const recherche = useDebounce(texte.trim())
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  useClicExterieur(ref, ouvert, useCallback(() => setOuvert(false), []))

  const { data, isFetching } = useQuery({
    queryKey: ['recherche', recherche],
    queryFn: () => apiRequest<ResultatsRecherche>(`/recherche${query({ q: recherche })}`),
    enabled: recherche.length >= 2,
  })
  const vide = data && data.classes.length + data.apprenants.length + data.documents.length === 0

  const aller = (chemin: string) => {
    setOuvert(false)
    setTexte('')
    navigate(chemin)
  }

  return (
    <div className={styles.recherche} ref={ref}>
      <Search size={20} aria-hidden className={styles.rechercheIcone} />
      <input
        type="search"
        value={texte}
        onChange={(e) => {
          setTexte(e.target.value)
          setOuvert(true)
        }}
        onFocus={() => setOuvert(true)}
        placeholder={apprenant ? 'Rechercher un cours, un document…' : 'Rechercher une classe, un étudiant, un document…'}
        aria-label="Rechercher"
      />
      {ouvert && recherche.length >= 2 && (
        <div className={styles.panneau} role="listbox" aria-label="Résultats de la recherche">
          {isFetching && !data && <p className={styles.panneauVide}>Recherche…</p>}
          {vide && <p className={styles.panneauVide}>Aucun résultat pour « {recherche} »</p>}
          {data && data.classes.length > 0 && (
            <ResultatsGroupe titre="Classes">
              {data.classes.map((c) => (
                <button key={c.id} type="button" role="option" aria-selected={false} className={styles.resultat} onClick={() => aller(routes.classe(c.id))}>
                  <School size={18} aria-hidden />
                  {c.nom}
                </button>
              ))}
            </ResultatsGroupe>
          )}
          {data && data.apprenants.length > 0 && (
            <ResultatsGroupe titre="Étudiants">
              {data.apprenants.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  role="option"
                  aria-selected={false}
                  className={styles.resultat}
                  onClick={() => aller(`${routes.etudiants}?recherche=${encodeURIComponent(a.nom)}`)}
                >
                  <Avatar id={a.id} photo={a.photo} prenom={a.prenom} nom={a.nom} taille="sm" />
                  <span>
                    {a.prenom} {a.nom}
                    <span className={styles.resultatDetail}>{a.email}</span>
                  </span>
                </button>
              ))}
            </ResultatsGroupe>
          )}
          {data && data.documents.length > 0 && (
            <ResultatsGroupe titre="Documents">
              {data.documents.map((d) => (
                <button key={d.id} type="button" role="option" aria-selected={false} className={styles.resultat} onClick={() => aller(routes.classe(d.classe.id))}>
                  <FileText size={18} aria-hidden />
                  <span>
                    {d.titre}
                    <span className={styles.resultatDetail}>{d.classe.nom}</span>
                  </span>
                </button>
              ))}
            </ResultatsGroupe>
          )}
        </div>
      )}
    </div>
  )
}

function ResultatsGroupe({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <div className={styles.groupe}>
      <p className={styles.groupeTitre}>{titre}</p>
      {children}
    </div>
  )
}

const cleVues = (id: string) => `lc:notifications-vues:${id}`

function lireVues(id: string): number {
  try {
    return Number(localStorage.getItem(cleVues(id)) ?? 0)
  } catch {
    return 0
  }
}

/** Cloche : activités récentes, pastille rouge pour celles non encore consultées */
function Notifications({ utilisateurId }: { utilisateurId: string }) {
  const [ouvert, setOuvert] = useState(false)
  const [vues, setVues] = useState(() => lireVues(utilisateurId))
  const ref = useRef<HTMLDivElement>(null)
  useClicExterieur(ref, ouvert, useCallback(() => setOuvert(false), []))

  const { data } = useTableauDeBord()
  const liste = notifications(data).slice(0, 8)
  const nouvelles = liste.filter((n) => new Date(n.date).getTime() > vues).length

  function basculer() {
    if (!ouvert) {
      const maintenant = Date.now()
      setVues(maintenant)
      try {
        localStorage.setItem(cleVues(utilisateurId), String(maintenant))
      } catch {
        // stockage indisponible : la pastille réapparaîtra au prochain chargement
      }
    }
    setOuvert((o) => !o)
  }

  return (
    <div className={styles.menuConteneur} ref={ref}>
      <button type="button" className={styles.icone} onClick={basculer} aria-expanded={ouvert} aria-label={`Notifications${nouvelles ? ` (${nouvelles} nouvelles)` : ''}`}>
        <Bell size={24} strokeWidth={1.75} aria-hidden />
        {nouvelles > 0 && <span className={styles.pastille}>{nouvelles}</span>}
      </button>
      {ouvert && (
        <div className={cx(styles.panneau, styles.panneauDroite)}>
          <p className={styles.panneauTitre}>Notifications</p>
          {liste.length === 0 ? (
            <p className={styles.panneauVide}>Aucune activité récente.</p>
          ) : (
            <ul role="list" className={styles.notifications}>
              {liste.map((n, i) => (
                <li key={`${n.date}-${i}`}>
                  <p className={styles.notificationTitre}>{n.titre}</p>
                  <p className={styles.resultatDetail}>{n.detail}</p>
                  <p className={styles.notificationDate}>{formatDate.format(new Date(n.date))}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

/** Avatar, nom et rôle, avec menu : Mon profil, Paramètres, Déconnexion */
function MenuProfil() {
  const { utilisateur, deconnecter } = useAuth()
  const [ouvert, setOuvert] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  useClicExterieur(ref, ouvert, useCallback(() => setOuvert(false), []))
  if (!utilisateur) return null

  const civilite = utilisateur.role === 'ENSEIGNANT' ? 'M. ' : ''

  return (
    <div className={styles.menuConteneur} ref={ref}>
      <button type="button" className={styles.profil} onClick={() => setOuvert((o) => !o)} aria-expanded={ouvert} aria-haspopup="menu">
        <Avatar id={utilisateur.id} photo={utilisateur.photo} prenom={utilisateur.prenom} nom={utilisateur.nom} taille="lg" />
        <span className={styles.identite}>
          <span className={styles.nom}>
            {civilite}
            {utilisateur.prenom} {utilisateur.nom}
          </span>
          <span className={styles.role}>{libellesRole[utilisateur.role]}</span>
        </span>
        <ChevronDown size={20} aria-hidden />
      </button>
      {ouvert && (
        <div className={cx(styles.panneau, styles.panneauDroite, styles.menuProfil)} role="menu">
          <Link to={routes.profil} role="menuitem" className={styles.resultat} onClick={() => setOuvert(false)}>
            <UserRound size={18} aria-hidden />
            Mon profil
          </Link>
          <Link to={routes.parametres} role="menuitem" className={styles.resultat} onClick={() => setOuvert(false)}>
            <Settings size={18} aria-hidden />
            Paramètres
          </Link>
          <button
            type="button"
            role="menuitem"
            className={styles.resultat}
            onClick={async () => {
              await deconnecter()
              navigate(routes.accueil, { replace: true })
            }}
          >
            <LogOut size={18} aria-hidden />
            Déconnexion
          </button>
        </div>
      )}
    </div>
  )
}
