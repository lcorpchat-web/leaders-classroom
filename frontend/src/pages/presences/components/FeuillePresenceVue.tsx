import { useState } from 'react'
import { CalendarDays, CheckCheck, Clock, Download, Save } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Chargement, EtatVide } from '@/components/ui/Feedback'
import { Table } from '@/components/ui/Table'
import {
  libellesStatutPresence,
  tonStatutPresence,
  useCorrigerPresences,
  useFeuillePresence,
  type StatutPresence,
} from '@/features/presences'
import { libellesStatutSeance, tonStatutSeance } from '@/features/seances'
import { messageErreur } from '@/lib/api/client'
import { nomFichierSur, telechargerCsv } from '@/lib/csv'
import { formaterCreneau, formaterDuree, formaterHeure, formaterJourLong, versChampJour } from '@/lib/dates'
import styles from '../PresencesPage.module.css'

const statuts: StatutPresence[] = ['PRESENT', 'RETARD', 'ABSENT']

/** Feuille de présence d'une séance (maquette 06) : consultation, corrections et export. */
export function FeuillePresenceVue({ seanceId }: { seanceId: string }) {
  const { data: feuille, isLoading, isError, error } = useFeuillePresence(seanceId)
  const corriger = useCorrigerPresences(seanceId)
  const [modifications, setModifications] = useState<Record<string, StatutPresence>>({})
  const [message, setMessage] = useState<{ variante: 'erreur' | 'info'; texte: string } | null>(null)

  if (isLoading) return <Chargement />
  if (isError || !feuille) return <Alert variante="erreur">{messageErreur(error)}</Alert>

  const { seance, lignes } = feuille
  const debut = new Date(seance.debut)
  const modifiable = seance.statut === 'TERMINEE'
  const statutDe = (apprenantId: string, actuel: StatutPresence | null) => modifications[apprenantId] ?? actuel
  const nbModifications = Object.keys(modifications).length

  async function enregistrer() {
    setMessage(null)
    try {
      await corriger.mutateAsync(Object.entries(modifications).map(([apprenantId, statut]) => ({ apprenantId, statut })))
      setModifications({})
      setMessage({ variante: 'info', texte: 'Les présences ont été enregistrées.' })
    } catch (e) {
      setMessage({ variante: 'erreur', texte: messageErreur(e) })
    }
  }

  function exporter() {
    telechargerCsv(
      `presences-${nomFichierSur(seance.classe.nom)}-${versChampJour(debut)}.csv`,
      ['Nom', 'Prénom', 'Matricule', 'E-mail', 'Statut', 'Arrivée', 'Départ', 'Durée (min)', 'Connexions'],
      lignes.map((l) => [
        l.apprenant.nom,
        l.apprenant.prenom,
        l.apprenant.matricule ?? '',
        l.apprenant.email,
        l.statut ? libellesStatutPresence[l.statut] : '',
        l.arrivee ? formaterHeure(new Date(l.arrivee)) : '',
        l.depart ? formaterHeure(new Date(l.depart)) : '',
        l.dureeMinutes,
        l.connexions,
      ]),
    )
  }

  return (
    <>
      <div className={styles.seanceInfo}>
        <div>
          <p className={styles.seanceClasse}>{seance.classe.nom}</p>
          <p className={styles.seanceTitre}>{seance.titre}</p>
          <p className={styles.seanceDetails}>
            <span>
              <CalendarDays size={16} aria-hidden />
              {formaterJourLong(debut)}
            </span>
            <span>
              <Clock size={16} aria-hidden />
              {formaterCreneau(debut, seance.dureeMinutes)}
            </span>
          </p>
        </div>
        <Badge ton={tonStatutSeance[seance.statut]}>{libellesStatutSeance[seance.statut]}</Badge>
      </div>

      {!modifiable && (
        <Alert variante="info" className={styles.alerte}>
          {seance.statut === 'EN_COURS'
            ? 'La séance est en cours : les statuts seront calculés à sa clôture.'
            : 'Les présences sont calculées et modifiables une fois la séance terminée.'}
        </Alert>
      )}
      {message && (
        <Alert variante={message.variante} className={styles.alerte}>
          {message.texte}
        </Alert>
      )}

      {lignes.length === 0 ? (
        <EtatVide titre="Aucun apprenant inscrit dans cette classe" />
      ) : (
        <Table>
          <thead>
            <tr>
              <th scope="col">Apprenant</th>
              <th scope="col">Statut</th>
              <th scope="col">Arrivée</th>
              <th scope="col">Durée</th>
              <th scope="col">Connexions</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((l) => {
              const statut = statutDe(l.apprenant.id, l.statut)
              return (
                <tr key={l.apprenant.id} className={modifications[l.apprenant.id] ? styles.ligneModifiee : undefined}>
                  <td>
                    <div className={styles.personne}>
                      <Avatar prenom={l.apprenant.prenom} nom={l.apprenant.nom} taille="sm" />
                      <div>
                        <p className={styles.nom}>
                          {l.apprenant.prenom} {l.apprenant.nom}
                        </p>
                        <p className={styles.detail}>{l.apprenant.matricule ?? l.apprenant.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    {modifiable ? (
                      <select
                        className={styles.selectStatut}
                        aria-label={`Statut de ${l.apprenant.prenom} ${l.apprenant.nom}`}
                        value={statut ?? ''}
                        onChange={(e) =>
                          setModifications((m) => ({ ...m, [l.apprenant.id]: e.target.value as StatutPresence }))
                        }
                      >
                        {statuts.map((s) => (
                          <option key={s} value={s}>
                            {libellesStatutPresence[s]}
                          </option>
                        ))}
                      </select>
                    ) : statut ? (
                      <Badge ton={tonStatutPresence[statut]}>{libellesStatutPresence[statut]}</Badge>
                    ) : (
                      <span className={styles.detail}>{l.connexions > 0 ? 'Connecté' : '—'}</span>
                    )}
                  </td>
                  <td>{l.arrivee ? formaterHeure(new Date(l.arrivee)) : '—'}</td>
                  <td>{l.dureeMinutes > 0 ? formaterDuree(l.dureeMinutes) : '—'}</td>
                  <td>{l.connexions}</td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      )}

      <div className={styles.actions}>
        <Button variant="outline" onClick={exporter} disabled={lignes.length === 0}>
          <Download size={18} aria-hidden />
          Exporter (CSV)
        </Button>
        {modifiable && (
          <>
            <Button
              variant="outline"
              onClick={() => setModifications(Object.fromEntries(lignes.map((l) => [l.apprenant.id, 'PRESENT' as const])))}
            >
              <CheckCheck size={18} aria-hidden />
              Marquer tous présents
            </Button>
            <Button onClick={enregistrer} disabled={nbModifications === 0 || corriger.isPending}>
              <Save size={18} aria-hidden />
              {corriger.isPending ? 'Enregistrement…' : `Enregistrer les présences${nbModifications ? ` (${nbModifications})` : ''}`}
            </Button>
          </>
        )}
      </div>
    </>
  )
}
