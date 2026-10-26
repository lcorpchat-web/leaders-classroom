import { useState } from 'react'
import { Link } from 'react-router'
import {
  BookOpen,
  CalendarDays,
  CalendarRange,
  ChartColumn,
  ChartPie,
  CircleCheck,
  Clock3,
  FileText,
  GraduationCap,
  ListChecks,
  Percent,
  School,
  UserRound,
  Users,
  UsersRound,
} from 'lucide-react'
import bandeauApprenant from '@/assets/images/bandeau-apprenant.jpg'
import bandeauEnseignant from '@/assets/images/bandeau-enseignant.jpg'
import { Alert } from '@/components/ui/Alert'
import { Chargement } from '@/components/ui/Feedback'
import { raccourcisAdmin } from '@/config/navigation'
import { routes } from '@/config/routes'
import { useAuth, type Utilisateur } from '@/features/auth'
import { MiniCalendrier, SeanceDetailModal, type Seance } from '@/features/seances'
import { useTableauDeBord, type Periode, type TableauDeBord } from '@/features/tableau-de-bord/tableauDeBord'
import { messageErreur } from '@/lib/api/client'
import { cx } from '@/lib/cx'
import {
  ActivitesRecentes,
  DocumentsRecents,
  Indicateurs,
  MesClassesListe,
  MesCoursCartes,
  PresencesDonut,
  ProchainesSeances,
  StatistiquesClasses,
  TachesActivites,
  TitreCarte,
  type Indicateur,
} from './components/sections'
import styles from './TableauDeBord.module.css'

const pourcentage = (taux: number | null) => (taux === null ? '—' : `${taux}%`)

/** Tableau de bord selon le rôle : maquettes 02 (apprenant) et 03 (enseignant). */
export function TableauDeBordPage() {
  const { utilisateur } = useAuth()
  const { data, isLoading, isError, error } = useTableauDeBord()
  const [seanceChoisie, setSeanceChoisie] = useState<Seance | null>(null)

  if (!utilisateur) return null
  if (isLoading) return <Chargement />
  if (isError || !data) return <Alert variante="erreur">{messageErreur(error)}</Alert>

  return (
    <>
      {data.role === 'APPRENANT' ? (
        <TableauApprenant tdb={data} utilisateur={utilisateur} onDetails={setSeanceChoisie} />
      ) : (
        <TableauEncadrement tdb={data} utilisateur={utilisateur} onDetails={setSeanceChoisie} />
      )}
      {seanceChoisie && <SeanceDetailModal seance={seanceChoisie} onFermer={() => setSeanceChoisie(null)} />}
    </>
  )
}

function Bienvenue({ prenom, texte, image }: { prenom: string; texte: string; image: string }) {
  return (
    <section className={styles.bienvenue}>
      <div className={styles.bienvenueTexte}>
        <h1 className={styles.bienvenueTitre}>
          Bonjour <span>{prenom}</span> !
        </h1>
        <p>{texte}</p>
      </div>
      <img src={image} alt="" className={styles.bienvenueImage} />
    </section>
  )
}

type TableauApprenantDonnees = Extract<TableauDeBord, { role: 'APPRENANT' }>
type TableauEncadrementDonnees = Exclude<TableauDeBord, { role: 'APPRENANT' }>

/** Maquette 02-dashboard-apprenant */
function TableauApprenant({
  tdb,
  utilisateur,
  onDetails,
}: {
  tdb: TableauApprenantDonnees
  utilisateur: Utilisateur
  onDetails: (s: Seance) => void
}) {
  const indicateurs: Indicateur[] = [
    { icone: BookOpen, valeur: tdb.indicateurs.classes, libelle: 'Cours inscrits', teinte: 'orange' },
    { icone: CalendarDays, valeur: tdb.indicateurs.seancesSemaine, libelle: 'Classes cette semaine', teinte: 'vert' },
    { icone: Clock3, valeur: pourcentage(tdb.indicateurs.tauxPresence), libelle: 'Taux de présence', teinte: 'violet' },
    { icone: FileText, valeur: tdb.indicateurs.documents, libelle: 'Documents disponibles', teinte: 'bleu' },
  ]
  const seances = [...tdb.seances.enCours, ...tdb.seances.prochaines].slice(0, 5)

  return (
    <div className={styles.grille}>
      <div className={styles.principal}>
        <div className={styles.entete}>
          <Bienvenue
            prenom={utilisateur.prenom}
            texte="Bienvenue sur votre espace d’apprentissage. Voici un aperçu de vos cours et activités."
            image={bandeauApprenant}
          />
          <Indicateurs elements={indicateurs} />
        </div>

        <section className={styles.carte}>
          <TitreCarte icone={CalendarDays} titre="Mes prochaines classes" lien={routes.calendrier} />
          <ProchainesSeances seances={seances} effectifs={tdb.seances.effectifs} role="APPRENANT" onDetails={onDetails} />
        </section>

        <section className={styles.carte}>
          <TitreCarte icone={BookOpen} titre="Mes cours" lien={routes.mesCours} />
          <MesCoursCartes cours={tdb.cours} />
        </section>
      </div>

      <aside className={styles.lateral}>
        <section className={styles.carte}>
          <TitreCarte icone={CalendarDays} titre="Mon calendrier" lien={routes.calendrier} />
          <MiniCalendrier
            legende={[
              { libelle: 'Cours en direct', couleur: '#12b76a' },
              { libelle: 'Cours prévu', couleur: '#fe7401' },
              { libelle: 'Cours passé', couleur: '#2e90fa' },
            ]}
            onChoisirJour={(_jour, duJour) => duJour[0] && onDetails(duJour[0])}
          />
        </section>

        <section className={styles.carte}>
          <TitreCarte icone={ListChecks} titre="Tâches et activités" lien={routes.calendrier} />
          <TachesActivites utilisateurId={utilisateur.id} seances={tdb.seances.prochaines} supports={tdb.supports} />
        </section>

        <section className={styles.carte}>
          <TitreCarte icone={FileText} titre="Mes documents récents" lien={routes.documents} />
          <DocumentsRecents supports={tdb.supports} />
        </section>
      </aside>
    </div>
  )
}

const periodes: Array<[Periode, string]> = [
  ['semaine', 'Cette semaine'],
  ['mois', 'Ce mois'],
  ['semestre', 'Ce semestre'],
]

/** Maquette 03-dashboard-enseignant (et vue d'ensemble de l'administration) */
function TableauEncadrement({
  tdb,
  utilisateur,
  onDetails,
}: {
  tdb: TableauEncadrementDonnees
  utilisateur: Utilisateur
  onDetails: (s: Seance) => void
}) {
  const [periode, setPeriode] = useState<Periode>('semaine')
  // Les statistiques suivent la période choisie ; le reste du tableau garde les données de la semaine
  const { data: parPeriode } = useTableauDeBord(periode)
  const stats = parPeriode && parPeriode.role !== 'APPRENANT' ? parPeriode.statistiques : tdb.statistiques
  const estEnseignant = tdb.role === 'ENSEIGNANT'

  const indicateurs: Indicateur[] =
    tdb.role === 'ENSEIGNANT'
      ? [
          { icone: UsersRound, valeur: tdb.indicateurs.classes, libelle: 'Classes actives', teinte: 'orange' },
          { icone: Users, valeur: tdb.indicateurs.apprenants ?? 0, libelle: 'Étudiants', teinte: 'vert' },
          { icone: CalendarRange, valeur: tdb.indicateurs.seancesSemaine, libelle: 'Séances cette semaine', teinte: 'violet' },
          { icone: ChartColumn, valeur: pourcentage(tdb.indicateurs.tauxPresence), libelle: 'Taux de présence moyen', teinte: 'bleu' },
        ]
      : [
          { icone: GraduationCap, valeur: tdb.indicateurs.apprenants, libelle: 'Apprenants actifs', teinte: 'orange' },
          { icone: UserRound, valeur: tdb.indicateurs.enseignants, libelle: 'Enseignants actifs', teinte: 'vert' },
          { icone: School, valeur: tdb.indicateurs.classes, libelle: 'Classes actives', teinte: 'violet' },
          { icone: Percent, valeur: pourcentage(tdb.indicateurs.tauxPresence), libelle: 'Taux de présence moyen', teinte: 'bleu' },
        ]
  const seances = [...tdb.seances.enCours, ...tdb.seances.prochaines].slice(0, 5)
  const civilite = estEnseignant ? 'M. ' : ''

  return (
    <div className={styles.grille}>
      <div className={styles.principal}>
        <div className={styles.entete}>
          <Bienvenue
            prenom={`${civilite}${utilisateur.prenom}`}
            texte={
              estEnseignant
                ? 'Voici un aperçu de vos classes, de vos séances et de vos étudiants.'
                : 'Voici un aperçu des classes, des séances et des apprenants de Leaders Classroom.'
            }
            image={bandeauEnseignant}
          />
          <Indicateurs elements={indicateurs} />
        </div>

        <section className={styles.carte}>
          <TitreCarte icone={CalendarDays} titre={estEnseignant ? 'Mes prochaines séances' : 'Prochaines séances'} lien={routes.calendrier} />
          <ProchainesSeances seances={seances} effectifs={tdb.seances.effectifs} role={tdb.role} onDetails={onDetails} />
        </section>

        <div className={styles.ligneStats}>
          <section className={styles.carte}>
            <header className={styles.carteEntete}>
              <ChartColumn size={24} className={styles.carteIcone} aria-hidden />
              <h2 className={styles.carteTitre}>{estEnseignant ? 'Statistiques de mes classes' : 'Statistiques des classes'}</h2>
              <div role="tablist" aria-label="Période" className={styles.periodes}>
                {periodes.map(([valeur, libelle]) => (
                  <button
                    key={valeur}
                    type="button"
                    role="tab"
                    aria-selected={periode === valeur}
                    className={cx(styles.periode, periode === valeur && styles.periodeActive)}
                    onClick={() => setPeriode(valeur)}
                  >
                    {libelle}
                  </button>
                ))}
              </div>
            </header>
            <StatistiquesClasses stats={stats} libelleApprenants={estEnseignant ? 'Étudiants au total' : 'Apprenants inscrits'} />
          </section>

          <section className={styles.carte}>
            <TitreCarte icone={ChartPie} titre="Présences par classe" />
            <PresencesDonut presences={stats.presences} />
          </section>
        </div>
      </div>

      <aside className={styles.lateral}>
        <section className={styles.carte}>
          <TitreCarte icone={CalendarDays} titre="Mon planning" lien={routes.calendrier} />
          <MiniCalendrier
            legende={[
              { libelle: 'Cours en direct', couleur: '#12b76a' },
              { libelle: 'Cours prévu', couleur: '#fe7401' },
              { libelle: 'Autre activité', couleur: '#2e90fa' },
            ]}
            onChoisirJour={(_jour, duJour) => duJour[0] && onDetails(duJour[0])}
          />
        </section>

        <section className={styles.carte}>
          <TitreCarte icone={UsersRound} titre={estEnseignant ? 'Mes classes' : 'Classes'} lien={routes.classes} />
          <MesClassesListe classes={tdb.classes} />
        </section>

        <section className={styles.carte}>
          <TitreCarte icone={Clock3} titre="Activités récentes" />
          <ActivitesRecentes activites={tdb.activites} />
        </section>

        {tdb.role === 'ADMIN' && (
          <section className={styles.carte}>
            <TitreCarte icone={CircleCheck} titre="Accès rapides" />
            <ul role="list" className={styles.raccourcis}>
              {raccourcisAdmin.map(({ to, libelle, icone: Icone }) => (
                <li key={to}>
                  <Link to={to} className={styles.raccourci}>
                    <Icone size={20} aria-hidden />
                    {libelle}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </aside>
    </div>
  )
}
