import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { ClipboardCheck } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { EtatVide } from '@/components/ui/Feedback'
import { PageHeader } from '@/components/ui/PageHeader'
import { useClasses } from '@/features/classes'
import { usePlanning, useSeance } from '@/features/seances'
import { cx } from '@/lib/cx'
import { ajouterJours, formaterCreneau, formaterJourCourt } from '@/lib/dates'
import { FeuillePresenceVue } from './components/FeuillePresenceVue'
import { RapportClasseVue } from './components/RapportClasseVue'
import styles from './PresencesPage.module.css'

type Onglet = 'feuille' | 'rapport'

/** Suivi des présences (maquette 06) — Enseignant : ses classes ; Administrateur : toutes. */
export function PresencesPage() {
  const [parametres, setParametres] = useSearchParams()
  const seanceId = parametres.get('seance') ?? ''
  const { data: seanceChoisie } = useSeance(seanceId)
  const classeId = parametres.get('classe') ?? seanceChoisie?.classe.id ?? ''
  const [onglet, setOnglet] = useState<Onglet>('feuille')

  const { data: classes } = useClasses({ parPage: 100 })

  // Séances des 120 derniers jours de la classe (dont celle en cours)
  const [periode] = useState(() => {
    const maintenant = new Date()
    return { debut: ajouterJours(maintenant, -119), fin: ajouterJours(maintenant, 1) }
  })
  const { data: seances } = usePlanning(periode.debut, periode.fin, classeId || undefined)
  const seancesPassees = useMemo(
    () =>
      (seances ?? [])
        .filter((s) => s.statut === 'TERMINEE' || s.statut === 'EN_COURS')
        .sort((a, b) => b.debut.localeCompare(a.debut)),
    [seances],
  )

  const choisir = (classe: string, seance: string) =>
    setParametres(Object.fromEntries(Object.entries({ classe, seance }).filter(([, v]) => v)), { replace: true })

  const nomClasse = classes?.donnees.find((c) => c.id === classeId)?.nom ?? seanceChoisie?.classe.nom ?? ''

  return (
    <>
      <PageHeader titre="Suivi des présences" sousTitre="Consultez, corrigez et exportez les présences de vos classes." />

      <Card sansMarge>
        <div className={styles.selection}>
          <label className={styles.choix}>
            <span>Classe</span>
            <select value={classeId} onChange={(e) => choisir(e.target.value, '')}>
              <option value="">Choisir une classe…</option>
              {(classes?.donnees ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                  {!c.active ? ' (archivée)' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.choix}>
            <span>Séance</span>
            <select value={seanceId} onChange={(e) => choisir(classeId, e.target.value)} disabled={!classeId}>
              <option value="">{seancesPassees.length ? 'Choisir une séance…' : 'Aucune séance passée'}</option>
              {seancesPassees.map((s) => (
                <option key={s.id} value={s.id}>
                  {formaterJourCourt(new Date(s.debut))} · {formaterCreneau(new Date(s.debut), s.dureeMinutes)} — {s.titre}
                </option>
              ))}
            </select>
          </label>
        </div>

        {classeId && (
          <div role="tablist" aria-label="Affichage" className={styles.onglets}>
            {(
              [
                ['feuille', 'Feuille de présence'],
                ['rapport', 'Rapport de la classe'],
              ] as const
            ).map(([valeur, libelle]) => (
              <button
                key={valeur}
                type="button"
                role="tab"
                aria-selected={onglet === valeur}
                className={cx(styles.onglet, onglet === valeur && styles.ongletActif)}
                onClick={() => setOnglet(valeur)}
              >
                {libelle}
              </button>
            ))}
          </div>
        )}

        <div className={styles.contenu}>
          {!classeId ? (
            <EtatVide icone={ClipboardCheck} titre="Choisissez une classe" message="Puis une séance pour afficher sa feuille de présence." />
          ) : onglet === 'rapport' ? (
            <RapportClasseVue classeId={classeId} classeNom={nomClasse} />
          ) : seanceId ? (
            <FeuillePresenceVue key={seanceId} seanceId={seanceId} />
          ) : (
            <EtatVide icone={ClipboardCheck} titre="Choisissez une séance" message="Les séances terminées ou en cours apparaissent dans la liste." />
          )}
        </div>
      </Card>
    </>
  )
}
