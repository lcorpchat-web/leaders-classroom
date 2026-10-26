import { useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chargement, EtatVide } from '@/components/ui/Feedback'
import { PageHeader } from '@/components/ui/PageHeader'
import { useAuth } from '@/features/auth'
import { useClasses } from '@/features/classes'
import {
  couleurClasse,
  ListeSeances,
  SeanceDetailModal,
  SeanceFormModal,
  usePlanning,
  type Seance,
} from '@/features/seances'
import { messageErreur } from '@/lib/api/client'
import { cx } from '@/lib/cx'
import { ajouterJours, ajouterMois, debutMois, formaterJourLong, formaterMois, grilleMois, memeJour } from '@/lib/dates'
import { MoisGrille } from './components/MoisGrille'
import styles from './CalendrierPage.module.css'

type Vue = 'mois' | 'liste'

/** Calendrier des séances (maquette 05) : planning de l'utilisateur selon son rôle. */
export function CalendrierPage() {
  const { utilisateur } = useAuth()
  const peutPlanifier = utilisateur?.role === 'ADMIN' || utilisateur?.role === 'ENSEIGNANT'

  const [mois, setMois] = useState(() => debutMois(new Date()))
  const [vue, setVue] = useState<Vue>('mois')
  const [classeId, setClasseId] = useState('')
  const [seanceChoisie, setSeanceChoisie] = useState<Seance | null>(null)
  const [planification, setPlanification] = useState(false)

  // Période affichée : semaines complètes du mois
  const [debut, fin] = useMemo(() => {
    const jours = grilleMois(mois)
    return [jours[0]!, ajouterJours(jours[jours.length - 1]!, 1)]
  }, [mois])

  const { data: seances, isLoading, isError, error } = usePlanning(debut, fin, classeId || undefined)

  // Prochaines séances (30 jours), indépendantes du mois affiché
  const [maintenant] = useState(() => new Date())
  const { data: prochaines } = usePlanning(maintenant, ajouterJours(maintenant, 30), classeId || undefined)
  const aVenir = (prochaines ?? []).filter((s) => s.statut !== 'ANNULEE' && s.statut !== 'TERMINEE').slice(0, 5)

  const { data: classes } = useClasses({ active: true, parPage: 100 })
  const seancesDuMois = (seances ?? []).filter((s) => new Date(s.debut).getMonth() === mois.getMonth())

  return (
    <>
      <PageHeader
        titre="Calendrier des séances"
        sousTitre={peutPlanifier ? 'Consultez et gérez les séances de vos classes.' : 'Consultez le planning de vos séances.'}
        actions={
          peutPlanifier && (
            <Button onClick={() => setPlanification(true)}>
              <Plus size={20} aria-hidden />
              Planifier une séance
            </Button>
          )
        }
      />

      <div className={styles.disposition}>
        <div className={styles.principal}>
          <div className={styles.barreOutils}>
            <div className={styles.navigation}>
              <button type="button" className={styles.boutonNav} onClick={() => setMois((m) => ajouterMois(m, -1))} aria-label="Mois précédent">
                <ChevronLeft size={20} aria-hidden />
              </button>
              <button type="button" className={styles.boutonNav} onClick={() => setMois((m) => ajouterMois(m, 1))} aria-label="Mois suivant">
                <ChevronRight size={20} aria-hidden />
              </button>
              <button type="button" className={styles.boutonTexte} onClick={() => setMois(debutMois(new Date()))}>
                Aujourd’hui
              </button>
              <h2 className={styles.titreMois} aria-live="polite">
                {formaterMois(mois)}
              </h2>
            </div>

            <div className={styles.outilsDroite}>
              <select
                className={styles.select}
                aria-label="Filtrer par classe"
                value={classeId}
                onChange={(e) => setClasseId(e.target.value)}
              >
                <option value="">Toutes les classes</option>
                {(classes?.donnees ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
              <div role="tablist" aria-label="Affichage" className={styles.vues}>
                {(['mois', 'liste'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    role="tab"
                    aria-selected={vue === v}
                    className={cx(styles.vue, vue === v && styles.vueActive)}
                    onClick={() => setVue(v)}
                  >
                    {v === 'mois' ? 'Mois' : 'Liste'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isError ? (
            <Alert variante="erreur">{messageErreur(error)}</Alert>
          ) : isLoading ? (
            <Chargement />
          ) : vue === 'mois' ? (
            <MoisGrille mois={mois} seances={seances ?? []} onChoisir={setSeanceChoisie} />
          ) : seancesDuMois.length === 0 ? (
            <Card>
              <EtatVide icone={CalendarDays} titre="Aucune séance ce mois-ci" />
            </Card>
          ) : (
            <Card>
              {grouperParJour(seancesDuMois).map(([jour, duJour]) => (
                <section key={jour.toISOString()} className={styles.groupeJour}>
                  <h3 className={cx(styles.titreJour, memeJour(jour, new Date()) && styles.titreJourAujourdhui)}>
                    {formaterJourLong(jour)}
                  </h3>
                  <ListeSeances seances={duJour} onChoisir={setSeanceChoisie} />
                </section>
              ))}
            </Card>
          )}
        </div>

        <aside className={styles.lateral}>
          <Card titre="Prochaines séances" icone={CalendarDays}>
            {aVenir.length === 0 ? (
              <p className={styles.vide}>Aucune séance dans les 30 prochains jours.</p>
            ) : (
              <ListeSeances seances={aVenir} onChoisir={setSeanceChoisie} />
            )}
          </Card>

          {(classes?.donnees.length ?? 0) > 0 && (
            <Card titre="Légende">
              <ul role="list" className={styles.legende}>
                {classes!.donnees.map((c) => (
                  <li key={c.id}>
                    <span className={styles.pastille} style={{ background: couleurClasse(c.id).accent }} aria-hidden />
                    {c.nom}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </aside>
      </div>

      {seanceChoisie && <SeanceDetailModal seance={seanceChoisie} onFermer={() => setSeanceChoisie(null)} />}
      {planification && <SeanceFormModal classeId={classeId || undefined} onFermer={() => setPlanification(false)} />}
    </>
  )
}

function grouperParJour(seances: Seance[]): Array<[Date, Seance[]]> {
  const groupes = new Map<string, [Date, Seance[]]>()
  for (const seance of seances) {
    const debut = new Date(seance.debut)
    const cle = debut.toDateString()
    if (!groupes.has(cle)) groupes.set(cle, [new Date(debut.getFullYear(), debut.getMonth(), debut.getDate()), []])
    groupes.get(cle)![1].push(seance)
  }
  return [...groupes.values()]
}
