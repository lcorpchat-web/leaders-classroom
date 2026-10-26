import { useState } from 'react'
import { GraduationCap, UserPlus } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Avatar } from '@/components/ui/Avatar'
import { Badge, type BadgeTon } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { EtatVide } from '@/components/ui/Feedback'
import { ConfirmDialog, Modal } from '@/components/ui/Modal'
import { Table } from '@/components/ui/Table'
import {
  libellesStatutInscription,
  useInscriptions,
  type ClasseDetail,
  type Inscription,
  type StatutInscription,
} from '@/features/classes'
import { SelecteurUtilisateurs } from '@/features/utilisateurs'
import { messageErreur } from '@/lib/api/client'
import { formaterJour } from '@/lib/format'
import styles from '../Classes.module.css'

const tonStatut: Record<StatutInscription, BadgeTon> = { VALIDEE: 'succes', EN_ATTENTE: 'attention', RETIREE: 'neutre' }

type Changement = { inscription: Inscription; statut: 'VALIDEE' | 'RETIREE' } | null

/** Apprenants de la classe ; inscription et transitions (figure 11) réservées à l'administration. */
export function InscriptionsSection({ classe, estAdmin }: { classe: ClasseDetail; estAdmin: boolean }) {
  const { inscrire, changerStatut } = useInscriptions(classe.id)
  const [ajoutOuvert, setAjoutOuvert] = useState(false)
  const [choix, setChoix] = useState<string[]>([])
  const [changement, setChangement] = useState<Changement>(null)
  const [voirRetires, setVoirRetires] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const complete = classe.capaciteMax !== null && classe.nbApprenants >= classe.capaciteMax
  const visibles = classe.inscriptions.filter((i) => voirRetires || i.statut !== 'RETIREE')
  const nbRetires = classe.inscriptions.length - classe.inscriptions.filter((i) => i.statut !== 'RETIREE').length

  async function confirmerInscription() {
    if (!choix[0]) return
    try {
      await inscrire.mutateAsync(choix[0])
      setChoix([])
    } catch (e) {
      setErreur(messageErreur(e))
    } finally {
      setAjoutOuvert(false)
    }
  }

  async function confirmerChangement({ inscription, statut }: NonNullable<Changement>) {
    try {
      await changerStatut.mutateAsync({ apprenantId: inscription.apprenant.id, statut })
    } catch (e) {
      setErreur(messageErreur(e))
    } finally {
      setChangement(null)
    }
  }

  const libelleChangement = (c: NonNullable<Changement>) =>
    c.statut === 'RETIREE'
      ? c.inscription.statut === 'EN_ATTENTE'
        ? 'Refuser'
        : 'Retirer'
      : c.inscription.statut === 'EN_ATTENTE'
        ? 'Valider'
        : 'Réinscrire'

  return (
    <Card
      titre="Apprenants"
      sousTitre={`${classe.nbApprenants} inscrit${classe.nbApprenants > 1 ? 's' : ''}${
        classe.capaciteMax ? ` sur ${classe.capaciteMax} places` : ''
      }`}
      icone={GraduationCap}
      sansMarge
      action={
        estAdmin && (
          <Button
            size="sm"
            onClick={() => setAjoutOuvert(true)}
            disabled={!classe.active || complete}
            title={!classe.active ? 'Classe archivée' : complete ? 'La classe est complète' : undefined}
          >
            <UserPlus size={16} aria-hidden />
            Inscrire un apprenant
          </Button>
        )
      }
    >
      {erreur && (
        <Alert variante="erreur" className={styles.alerteTableau}>
          {erreur}
        </Alert>
      )}
      {estAdmin && nbRetires > 0 && (
        <div className={styles.optionTableau}>
          <Checkbox
            label={`Afficher les apprenants retirés (${nbRetires})`}
            checked={voirRetires}
            onChange={(e) => setVoirRetires(e.target.checked)}
          />
        </div>
      )}

      {visibles.length === 0 ? (
        <EtatVide icone={GraduationCap} titre="Aucun apprenant inscrit" />
      ) : (
        <Table>
          <thead>
            <tr>
              <th scope="col">Apprenant</th>
              <th scope="col">Matricule</th>
              <th scope="col">Inscrit le</th>
              <th scope="col">Statut</th>
              {estAdmin && (
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {visibles.map((inscription) => {
              const { apprenant, statut } = inscription
              return (
                <tr key={apprenant.id}>
                  <td>
                    <div className={styles.personneLigne}>
                      <Avatar id={apprenant.id} photo={apprenant.photo} prenom={apprenant.prenom} nom={apprenant.nom} taille="sm" />
                      <div>
                        <p className={styles.personneNom}>
                          {apprenant.prenom} {apprenant.nom}
                        </p>
                        <p className={styles.personneDetail}>{apprenant.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>{apprenant.matricule ?? '—'}</td>
                  <td>{formaterJour(inscription.dateInscription)}</td>
                  <td>
                    <div className={styles.badges}>
                      <Badge ton={tonStatut[statut]}>{libellesStatutInscription[statut]}</Badge>
                      {!apprenant.actif && <Badge ton="danger">Compte désactivé</Badge>}
                    </div>
                  </td>
                  {estAdmin && (
                    <td>
                      <div className={styles.actionsLigne}>
                        {statut !== 'VALIDEE' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={complete}
                            onClick={() => setChangement({ inscription, statut: 'VALIDEE' })}
                          >
                            {statut === 'EN_ATTENTE' ? 'Valider' : 'Réinscrire'}
                          </Button>
                        )}
                        {statut !== 'RETIREE' && (
                          <Button size="sm" variant="ghost" onClick={() => setChangement({ inscription, statut: 'RETIREE' })}>
                            {statut === 'EN_ATTENTE' ? 'Refuser' : 'Retirer'}
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </Table>
      )}

      <Modal
        ouvert={ajoutOuvert}
        onFermer={() => setAjoutOuvert(false)}
        titre="Inscrire un apprenant"
        description="L’inscription faite par l’administration est validée immédiatement."
        actions={
          <>
            <Button variant="outline" onClick={() => setAjoutOuvert(false)}>
              Annuler
            </Button>
            <Button onClick={confirmerInscription} disabled={!choix[0] || inscrire.isPending}>
              {inscrire.isPending ? 'Inscription…' : 'Inscrire'}
            </Button>
          </>
        }
      >
        <SelecteurUtilisateurs
          role="APPRENANT"
          selection={choix}
          onChange={setChoix}
          exclure={classe.inscriptions.filter((i) => i.statut === 'VALIDEE').map((i) => i.apprenant.id)}
        />
      </Modal>

      <ConfirmDialog
        ouvert={changement !== null}
        titre={changement ? `${libelleChangement(changement)} l’inscription` : ''}
        message={
          changement &&
          (changement.statut === 'RETIREE'
            ? `${changement.inscription.apprenant.prenom} ${changement.inscription.apprenant.nom} n’aura plus accès aux séances ni aux supports de la classe.`
            : `${changement.inscription.apprenant.prenom} ${changement.inscription.apprenant.nom} aura accès aux séances et aux supports de la classe.`)
        }
        libelleConfirmer={changement ? libelleChangement(changement) : ''}
        enCours={changerStatut.isPending}
        onConfirmer={() => changement && confirmerChangement(changement)}
        onAnnuler={() => setChangement(null)}
      />
    </Card>
  )
}
