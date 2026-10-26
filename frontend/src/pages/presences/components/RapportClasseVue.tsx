import { Download } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Chargement, EtatVide } from '@/components/ui/Feedback'
import { Table } from '@/components/ui/Table'
import { useRapportClasse } from '@/features/presences'
import { messageErreur } from '@/lib/api/client'
import { nomFichierSur, telechargerCsv } from '@/lib/csv'
import styles from '../PresencesPage.module.css'

/** Rapport de présence d'une classe : synthèse par apprenant sur les séances terminées. */
export function RapportClasseVue({ classeId, classeNom }: { classeId: string; classeNom: string }) {
  const { data: rapport, isLoading, isError, error } = useRapportClasse(classeId)

  if (isLoading) return <Chargement />
  if (isError || !rapport) return <Alert variante="erreur">{messageErreur(error)}</Alert>
  if (rapport.seancesTerminees === 0) return <EtatVide titre="Aucune séance terminée dans cette classe" />

  function exporter() {
    telechargerCsv(
      `rapport-presences-${nomFichierSur(classeNom)}.csv`,
      ['Nom', 'Prénom', 'Matricule', 'Présent', 'En retard', 'Absent', 'Taux de présence (%)'],
      rapport!.lignes.map((l) => [
        l.apprenant.nom,
        l.apprenant.prenom,
        l.apprenant.matricule ?? '',
        l.present,
        l.retard,
        l.absent,
        l.taux ?? '',
      ]),
    )
  }

  return (
    <>
      <ul role="list" className={styles.chiffres}>
        <li>
          <strong>{rapport.seancesTerminees}</strong> séance{rapport.seancesTerminees > 1 ? 's' : ''} terminée
          {rapport.seancesTerminees > 1 ? 's' : ''}
        </li>
        <li>
          <strong>{rapport.tauxMoyen ?? '—'} %</strong> de présence moyenne
        </li>
      </ul>

      <Table>
        <thead>
          <tr>
            <th scope="col">Apprenant</th>
            <th scope="col">Présent</th>
            <th scope="col">En retard</th>
            <th scope="col">Absent</th>
            <th scope="col">Taux de présence</th>
          </tr>
        </thead>
        <tbody>
          {rapport.lignes.map((l) => (
            <tr key={l.apprenant.id}>
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
              <td>{l.present}</td>
              <td>{l.retard}</td>
              <td>{l.absent}</td>
              <td>
                <div className={styles.taux}>
                  <div
                    className={styles.barre}
                    role="progressbar"
                    aria-valuenow={l.taux ?? 0}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Taux de présence"
                  >
                    <span style={{ width: `${l.taux ?? 0}%` }} />
                  </div>
                  {l.taux ?? '—'} %
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <div className={styles.actions}>
        <Button variant="outline" onClick={exporter}>
          <Download size={18} aria-hidden />
          Exporter (CSV)
        </Button>
      </div>
    </>
  )
}
