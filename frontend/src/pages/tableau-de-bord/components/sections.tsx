import { useState } from 'react'
import { Link } from 'react-router'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CalendarCheck,
  ChevronRight,
  CircleCheck,
  Clock,
  Download,
  EllipsisVertical,
  FileText,
  Upload,
  UserPlus,
  UserRound,
  Users,
  Video,
} from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { ClasseVignette } from '@/components/ui/ClasseVignette'
import { routes } from '@/config/routes'
import type { Seance } from '@/features/seances'
import { formaterTaille, urlFichier, type Support } from '@/features/supports'
import type { Activite, ClasseTableau, CoursApprenant, Statistiques } from '@/features/tableau-de-bord/tableauDeBord'
import { cx } from '@/lib/cx'
import { formaterCreneau } from '@/lib/dates'
import { formaterJour } from '@/lib/format'
import styles from '../TableauDeBord.module.css'

// ---------------------------------------------------------------------------------------------
// En-têtes de cartes et éléments communs
// ---------------------------------------------------------------------------------------------

export function TitreCarte({ icone: Icone, titre, lien }: { icone: LucideIcon; titre: string; lien?: string }) {
  return (
    <header className={styles.carteEntete}>
      <Icone size={24} className={styles.carteIcone} aria-hidden />
      <h2 className={styles.carteTitre}>{titre}</h2>
      {lien && (
        <Link to={lien} className={styles.voirTout}>
          Voir tout
          <ArrowRight size={16} aria-hidden />
        </Link>
      )}
    </header>
  )
}

export interface Indicateur {
  icone: LucideIcon
  valeur: string | number
  libelle: string
  teinte: 'orange' | 'vert' | 'violet' | 'bleu'
}

/** Cartes d'indicateurs superposées au bas du bandeau (maquettes 02 et 03) */
export function Indicateurs({ elements }: { elements: Indicateur[] }) {
  return (
    <ul role="list" className={styles.indicateurs}>
      {elements.map(({ icone: Icone, valeur, libelle, teinte }) => (
        <li key={libelle} className={styles.indicateur}>
          <span className={cx(styles.indicateurIcone, styles[teinte])} aria-hidden>
            <Icone size={24} />
          </span>
          <p className={styles.indicateurValeur}>{valeur}</p>
          <p className={styles.indicateurLibelle}>{libelle}</p>
        </li>
      ))}
    </ul>
  )
}

// ---------------------------------------------------------------------------------------------
// Prochaines séances / prochaines classes
// ---------------------------------------------------------------------------------------------

const MINUTE = 60_000

interface ProchainesSeancesProps {
  seances: Seance[]
  effectifs: Record<string, number>
  role: 'APPRENANT' | 'ENSEIGNANT' | 'ADMIN'
  onDetails: (seance: Seance) => void
}

/** « Mes prochaines séances » (03) et « Mes prochaines classes » (02) */
export function ProchainesSeances({ seances, effectifs, role, onDetails }: ProchainesSeancesProps) {
  const [maintenant] = useState(() => Date.now())
  if (seances.length === 0) return <p className={styles.vide}>Aucune séance programmée.</p>

  return (
    <ul role="list" className={styles.seances}>
      {seances.map((s, index) => {
        const debut = new Date(s.debut)
        const fin = debut.getTime() + s.dureeMinutes * MINUTE
        const enDirect = s.statut === 'EN_COURS'
        const salleOuverte = enDirect || (s.statut === 'PROGRAMMEE' && maintenant >= debut.getTime() - 15 * MINUTE && maintenant <= fin)
        const effectif = effectifs[s.classe.id] ?? 0
        return (
          <li key={s.id} className={styles.seance}>
            <div className={cx(styles.dateBloc, index === 0 && styles.dateBlocActif)}>
              <span className={styles.dateJourSemaine}>{debut.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '')}</span>
              <span className={styles.dateNumero}>{debut.getDate()}</span>
              <span className={styles.dateMois}>{debut.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}</span>
            </div>
            <ClasseVignette classe={s.classe} className={styles.seanceVignette} />
            <div className={styles.seanceTexte}>
              <p className={styles.seanceClasse}>{s.classe.nom}</p>
              <p className={styles.seanceTitre}>{s.titre}</p>
              <p className={styles.seanceMeta}>
                <span>
                  <Clock size={16} aria-hidden />
                  {formaterCreneau(debut, s.dureeMinutes)}
                </span>
                {role === 'APPRENANT' ? (
                  <span>
                    <UserRound size={16} aria-hidden />
                    {s.enseignant.prenom} {s.enseignant.nom}
                  </span>
                ) : (
                  <span>
                    <Users size={16} aria-hidden />
                    {effectif} étudiant{effectif > 1 ? 's' : ''}
                  </span>
                )}
                {salleOuverte && (
                  <span className={styles.badgeVert}>
                    <CircleCheck size={14} aria-hidden />
                    {enDirect && role === 'APPRENANT' ? 'En direct' : enDirect ? 'En cours' : 'Salle prête'}
                  </span>
                )}
              </p>
            </div>
            <div className={styles.seanceActions}>
              {salleOuverte && role === 'ENSEIGNANT' ? (
                <ButtonLink to={routes.salle(s.id, true)} size="sm" className={styles.boutonSeance}>
                  <Video size={18} aria-hidden />
                  {enDirect ? 'Reprendre' : 'Lancer la session'}
                </ButtonLink>
              ) : enDirect && role === 'APPRENANT' ? (
                <ButtonLink to={routes.salle(s.id)} size="sm" className={styles.boutonSeance}>
                  <Video size={18} aria-hidden />
                  Rejoindre
                </ButtonLink>
              ) : (
                <button type="button" className={styles.boutonDetails} onClick={() => onDetails(s)}>
                  Détails
                </button>
              )}
              {role !== 'APPRENANT' && (
                <button type="button" className={styles.kebab} onClick={() => onDetails(s)} aria-label={`Plus d’options pour ${s.titre}`}>
                  <EllipsisVertical size={18} aria-hidden />
                </button>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

// ---------------------------------------------------------------------------------------------
// Statistiques (maquette 03)
// ---------------------------------------------------------------------------------------------

function Tendance({ valeur, unite = '%' }: { valeur: number | null; unite?: string }) {
  if (valeur === null) return null
  const hausse = valeur >= 0
  return (
    <span className={cx(styles.tendance, !hausse && styles.tendanceBaisse)}>
      {hausse ? <ArrowUp size={14} aria-hidden /> : <ArrowDown size={14} aria-hidden />}
      {hausse ? '+' : ''}
      {valeur}
      {unite}
    </span>
  )
}

export function StatistiquesClasses({ stats, libelleApprenants }: { stats: Statistiques; libelleApprenants: string }) {
  const elements: Array<{ icone: LucideIcon; teinte: string; valeur: string | number; libelle: string; tendance: number | null; unite?: string }> = [
    { icone: Users, teinte: styles.texteOrange!, valeur: stats.apprenants.valeur ?? 0, libelle: libelleApprenants, tendance: stats.apprenants.evolution },
    {
      icone: CalendarCheck,
      teinte: styles.texteBleu!,
      valeur: stats.tauxPresence.valeur === null ? '—' : `${stats.tauxPresence.valeur}%`,
      libelle: 'Taux de présence',
      tendance: stats.tauxPresence.evolution,
      unite: ' pts',
    },
    { icone: CircleCheck, teinte: styles.texteVert!, valeur: stats.seancesRealisees.valeur ?? 0, libelle: 'Séances réalisées', tendance: stats.seancesRealisees.evolution },
    { icone: FileText, teinte: styles.texteBleu!, valeur: stats.documents.valeur ?? 0, libelle: 'Documents partagés', tendance: stats.documents.evolution },
  ]
  return (
    <ul role="list" className={styles.statistiques}>
      {elements.map(({ icone: Icone, teinte, valeur, libelle, tendance, unite }) => (
        <li key={libelle} className={styles.statistique}>
          <Icone size={30} className={teinte} aria-hidden />
          <p className={styles.statistiqueValeur}>{valeur}</p>
          <p className={styles.statistiqueLibelle}>{libelle}</p>
          <Tendance valeur={tendance} unite={unite} />
        </li>
      ))}
    </ul>
  )
}

/** Anneau « Présences par classe » : présents, absents, en retard */
export function PresencesDonut({ presences }: { presences: Statistiques['presences'] }) {
  const total = presences.present + presences.absent + presences.retard
  const rayon = 52
  const circonference = 2 * Math.PI * rayon
  const segments = [
    { valeur: presences.present, couleur: '#12b76a', libelle: 'Présents' },
    { valeur: presences.absent, couleur: '#f04438', libelle: 'Absents' },
    { valeur: presences.retard, couleur: '#fe7401', libelle: 'En retard' },
  ]
  let decalage = 0

  return (
    <div className={styles.donut}>
      <svg viewBox="0 0 140 140" width="140" height="140" role="img" aria-label={`Présence moyenne ${presences.taux ?? 0} %`}>
        <circle cx="70" cy="70" r={rayon} fill="none" stroke="#eef0f3" strokeWidth="16" />
        {total > 0 &&
          segments.map((s) => {
            const longueur = (s.valeur / total) * circonference
            const cercle = (
              <circle
                key={s.libelle}
                cx="70"
                cy="70"
                r={rayon}
                fill="none"
                stroke={s.couleur}
                strokeWidth="16"
                strokeDasharray={`${longueur} ${circonference - longueur}`}
                strokeDashoffset={-decalage}
                transform="rotate(-90 70 70)"
              />
            )
            decalage += longueur
            return cercle
          })}
        <text x="70" y="68" textAnchor="middle" className={styles.donutValeur}>
          {presences.taux === null ? '—' : `${presences.taux}%`}
        </text>
        <text x="70" y="86" textAnchor="middle" className={styles.donutLibelle}>
          Présence
        </text>
        <text x="70" y="100" textAnchor="middle" className={styles.donutLibelle}>
          moyenne
        </text>
      </svg>
      <ul role="list" className={styles.donutLegende}>
        {segments.map((s) => (
          <li key={s.libelle}>
            <span className={styles.pastille} style={{ background: s.couleur }} aria-hidden />
            {s.libelle}
            <strong>{s.valeur}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ---------------------------------------------------------------------------------------------
// Colonne de droite
// ---------------------------------------------------------------------------------------------

/** « Mes classes » (03) : effectif et taux de présence de chaque classe */
export function MesClassesListe({ classes }: { classes: ClasseTableau[] }) {
  if (classes.length === 0) return <p className={styles.vide}>Aucune classe active.</p>
  return (
    <ul role="list" className={styles.classes}>
      {classes.map((c) => (
        <li key={c.id}>
          <Link to={routes.classe(c.id)} className={styles.classe}>
            <ClasseVignette classe={c} className={styles.classeVignette} />
            <span className={styles.classeTexte}>
              <span className={styles.classeNom}>{c.nom}</span>
              <span className={styles.classeDetail}>
                {c.nbApprenants} étudiant{c.nbApprenants > 1 ? 's' : ''}
              </span>
            </span>
            <span className={styles.barre} aria-hidden>
              <span style={{ width: `${c.tauxPresence ?? 0}%` }} />
            </span>
            <span className={styles.classeTaux}>{c.tauxPresence === null ? '—' : `${c.tauxPresence}%`}</span>
            <ChevronRight size={18} className={styles.chevron} aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  )
}

const relatif = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' })

function ilYa(date: string, maintenant: number): string {
  const minutes = Math.round((new Date(date).getTime() - maintenant) / MINUTE)
  if (Math.abs(minutes) < 60) return relatif.format(minutes, 'minute')
  const heures = Math.round(minutes / 60)
  if (Math.abs(heures) < 24) return relatif.format(heures, 'hour')
  return relatif.format(Math.round(heures / 24), 'day')
}

const iconesActivite: Record<Activite['type'], { icone: LucideIcon; couleur: string }> = {
  DOCUMENT: { icone: Upload, couleur: '#7a5af8' },
  SEANCE_TERMINEE: { icone: Video, couleur: '#12b76a' },
  INSCRIPTION: { icone: UserPlus, couleur: '#2e90fa' },
  SEANCE_PROGRAMMEE: { icone: CalendarCheck, couleur: '#fe7401' },
}

/** « Activités récentes » (03) */
export function ActivitesRecentes({ activites }: { activites: Activite[] }) {
  const [maintenant] = useState(() => Date.now())
  if (activites.length === 0) return <p className={styles.vide}>Aucune activité récente.</p>
  return (
    <ul role="list" className={styles.activites}>
      {activites.slice(0, 5).map((a, i) => {
        const { icone: Icone, couleur } = iconesActivite[a.type]
        return (
          <li key={`${a.date}-${i}`} className={styles.activite}>
            <span className={styles.activiteIcone} style={{ background: couleur }} aria-hidden>
              <Icone size={20} />
            </span>
            <span className={styles.activiteTexte}>
              <span className={styles.activiteTitre}>{a.titre}</span>
              <span className={styles.activiteDetail}>{a.detail}</span>
            </span>
            <span className={styles.activiteDate}>{ilYa(a.date, maintenant)}</span>
          </li>
        )
      })}
    </ul>
  )
}

/** « Mes cours » (02) : vignette, enseignant et progression */
export function MesCoursCartes({ cours }: { cours: CoursApprenant[] }) {
  if (cours.length === 0) return <p className={styles.vide}>Vous n’êtes inscrit à aucun cours pour le moment.</p>
  return (
    <ul role="list" className={styles.cours}>
      {cours.slice(0, 4).map((c) => (
        <li key={c.id}>
          <Link to={routes.classe(c.id)} className={styles.coursCarte}>
            <ClasseVignette classe={c} className={styles.coursImage} />
            <span className={styles.coursTexte}>
              <span className={styles.coursNom}>{c.nom}</span>
              <span className={styles.classeDetail}>{c.enseignant ? `${c.enseignant.prenom} ${c.enseignant.nom}` : '—'}</span>
              <span className={styles.coursProgression}>
                <span className={styles.barre} aria-hidden>
                  <span style={{ width: `${c.progression}%` }} />
                </span>
                {c.progression}%
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

interface Tache {
  id: string
  titre: string
  detail: string
  date: Date
}

function lireTachesFaites(cle: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(cle) ?? '[]') as string[]
  } catch {
    return []
  }
}

/** « Tâches et activités » (02) : séances à suivre et documents à consulter, cochables */
export function TachesActivites({ utilisateurId, seances, supports }: { utilisateurId: string; seances: Seance[]; supports: Support[] }) {
  const cle = `lc:taches:${utilisateurId}`
  const [faites, setFaites] = useState(() => lireTachesFaites(cle))
  const [maintenant] = useState(() => Date.now())

  const taches: Tache[] = [
    ...seances.slice(0, 3).map((s) => ({ id: `seance:${s.id}`, titre: `Assister à « ${s.titre} »`, detail: s.classe.nom, date: new Date(s.debut) })),
    ...supports.slice(0, 2).map((s) => ({ id: `support:${s.id}`, titre: `Lire « ${s.titre} »`, detail: s.classe.nom, date: new Date(s.deposeLe) })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime())

  function basculer(id: string) {
    const suivant = faites.includes(id) ? faites.filter((f) => f !== id) : [...faites, id]
    setFaites(suivant)
    try {
      localStorage.setItem(cle, JSON.stringify(suivant))
    } catch {
      // stockage indisponible : l'état coché n'est pas conservé
    }
  }

  if (taches.length === 0) return <p className={styles.vide}>Rien à faire pour le moment.</p>
  return (
    <ul role="list" className={styles.taches}>
      {taches.map((t) => {
        const faite = faites.includes(t.id)
        const proche = t.date.getTime() > maintenant && t.date.getTime() - maintenant < 2 * 24 * 3600 * 1000
        return (
          <li key={t.id}>
            <label className={cx(styles.tache, faite && styles.tacheFaite)}>
              <input type="checkbox" checked={faite} onChange={() => basculer(t.id)} />
              <span className={styles.tacheTexte}>
                <span className={styles.tacheTitre}>{t.titre}</span>
                <span className={styles.classeDetail}>{t.detail}</span>
              </span>
              <span className={cx(styles.tacheDate, proche && styles.tacheUrgente)}>
                {t.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </span>
            </label>
          </li>
        )
      })}
    </ul>
  )
}

function couleurFichier(typeMime: string): string {
  if (typeMime === 'application/pdf') return '#e5241b'
  if (/word|opendocument.text/.test(typeMime)) return '#1a6fe0'
  if (/presentation|powerpoint/.test(typeMime)) return '#fe7401'
  if (/sheet|excel/.test(typeMime)) return '#12b76a'
  return '#7a5af8'
}

/** « Mes documents récents » (02) / « Documents récents » */
export function DocumentsRecents({ supports }: { supports: Support[] }) {
  if (supports.length === 0) return <p className={styles.vide}>Aucun document pour le moment.</p>
  return (
    <ul role="list" className={styles.documents}>
      {supports.slice(0, 4).map((s) => (
        <li key={s.id} className={styles.document}>
          <span className={styles.documentIcone} style={{ background: couleurFichier(s.typeMime) }} aria-hidden>
            <FileText size={22} />
          </span>
          <span className={styles.documentTexte}>
            <span className={styles.classeNom}>{s.nomFichier}</span>
            <span className={styles.classeDetail}>
              {formaterTaille(s.tailleOctets)} · {formaterJour(s.deposeLe)}
            </span>
          </span>
          <a href={urlFichier(s.id)} download className={styles.telecharger} aria-label={`Télécharger ${s.titre}`}>
            <Download size={22} aria-hidden />
          </a>
        </li>
      ))}
    </ul>
  )
}
