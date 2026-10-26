import { CalendarCheck, CircleCheck, CircleX, Clock3, Percent } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { Chargement, EtatVide } from '@/components/ui/Feedback'
import { PageHeader } from '@/components/ui/PageHeader'
import { Table } from '@/components/ui/Table'
import { libellesStatutPresence, tonStatutPresence, useMesPresences } from '@/features/presences'
import { messageErreur } from '@/lib/api/client'
import { formaterCreneau, formaterDuree, formaterHeure, formaterJourCourt } from '@/lib/dates'
import styles from './PresencesPage.module.css'

/** Historique des présences de l'apprenant (« Consulter les présences : les siennes »). */
export function MesPresencesPage() {
  const { data, isLoading, isError, error } = useMesPresences()

  return (
    <>
      <PageHeader titre="Mes présences" sousTitre="Votre assiduité aux séances terminées de vos classes." />

      {isLoading ? (
        <Chargement />
      ) : isError || !data ? (
        <Alert variante="erreur">{messageErreur(error)}</Alert>
      ) : (
        <>
          <ul role="list" className={styles.resume}>
            {[
              { icone: Percent, valeur: data.resume.taux === null ? '—' : `${data.resume.taux} %`, libelle: 'Taux de présence' },
              { icone: CircleCheck, valeur: data.resume.present, libelle: 'Présent' },
              { icone: Clock3, valeur: data.resume.retard, libelle: 'En retard' },
              { icone: CircleX, valeur: data.resume.absent, libelle: 'Absent' },
            ].map(({ icone: Icone, valeur, libelle }) => (
              <li key={libelle}>
                <span className={styles.resumeIcone} aria-hidden>
                  <Icone size={22} />
                </span>
                <div>
                  <p className={styles.resumeValeur}>{valeur}</p>
                  <p className={styles.detail}>{libelle}</p>
                </div>
              </li>
            ))}
          </ul>

          <Card titre="Historique" icone={CalendarCheck} sansMarge>
            {data.historique.length === 0 ? (
              <EtatVide icone={CalendarCheck} titre="Aucune séance terminée pour le moment" />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th scope="col">Séance</th>
                    <th scope="col">Date</th>
                    <th scope="col">Statut</th>
                    <th scope="col">Arrivée</th>
                    <th scope="col">Durée</th>
                  </tr>
                </thead>
                <tbody>
                  {data.historique.map((h) => {
                    const debut = new Date(h.seance.debut)
                    return (
                      <tr key={h.seance.id}>
                        <td>
                          <p className={styles.nom}>{h.seance.titre}</p>
                          <p className={styles.detail}>{h.seance.classe.nom}</p>
                        </td>
                        <td>
                          {formaterJourCourt(debut)}
                          <p className={styles.detail}>{formaterCreneau(debut, h.seance.dureeMinutes)}</p>
                        </td>
                        <td>
                          <Badge ton={tonStatutPresence[h.statut]}>{libellesStatutPresence[h.statut]}</Badge>
                        </td>
                        <td>{h.arrivee ? formaterHeure(new Date(h.arrivee)) : '—'}</td>
                        <td>{h.dureeMinutes > 0 ? formaterDuree(h.dureeMinutes) : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            )}
          </Card>
        </>
      )}
    </>
  )
}
