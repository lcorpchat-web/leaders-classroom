import { useState } from 'react'
import { KeyRound, Pencil, Plus, Power, Search, Users } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Badge, type BadgeTon } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chargement, EtatVide } from '@/components/ui/Feedback'
import { Alert } from '@/components/ui/Alert'
import { ConfirmDialog } from '@/components/ui/Modal'
import { PageHeader } from '@/components/ui/PageHeader'
import { Pagination, Table } from '@/components/ui/Table'
import { libellesRole, useAuth, type Role } from '@/features/auth'
import {
  useModifierUtilisateur,
  useReinitialiserMotDePasse,
  useUtilisateurs,
  type ResultatMotDePasse,
  type UtilisateurAdmin,
} from '@/features/utilisateurs'
import { messageErreur } from '@/lib/api/client'
import { cx } from '@/lib/cx'
import { useDebounce } from '@/lib/useDebounce'
import { MotDePasseProvisoireModal } from './components/MotDePasseProvisoireModal'
import { UtilisateurFormModal } from './components/UtilisateurFormModal'
import styles from './UtilisateursPage.module.css'

const PAR_PAGE = 20

const onglets: Array<{ role?: Role; libelle: string }> = [
  { libelle: 'Tous' },
  { role: 'APPRENANT', libelle: 'Apprenants' },
  { role: 'ENSEIGNANT', libelle: 'Enseignants' },
  { role: 'ADMIN', libelle: 'Administrateurs' },
]

const tonRole: Record<Role, BadgeTon> = { ADMIN: 'info', ENSEIGNANT: 'marque', APPRENANT: 'neutre' }

type Action =
  | { type: 'formulaire'; utilisateur: UtilisateurAdmin | null; cle: number }
  | { type: 'statut'; utilisateur: UtilisateurAdmin }
  | { type: 'reinitialiser'; utilisateur: UtilisateurAdmin }
  | null

/** Gestion des comptes (Administrateur) — cas « Gérer les comptes (créer, activer, désactiver) ». */
export function UtilisateursPage() {
  const { utilisateur: moi } = useAuth()
  const [role, setRole] = useState<Role | undefined>()
  const [statut, setStatut] = useState<'tous' | 'actifs' | 'inactifs'>('tous')
  const [recherche, setRecherche] = useState('')
  const [page, setPage] = useState(1)
  const rechercheDiff = useDebounce(recherche)

  const [action, setAction] = useState<Action>(null)
  const [motDePasse, setMotDePasse] = useState<ResultatMotDePasse | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  const { data, isLoading, isError, error } = useUtilisateurs({
    role,
    actif: statut === 'tous' ? undefined : statut === 'actifs',
    recherche: rechercheDiff,
    page,
    parPage: PAR_PAGE,
  })
  const modifier = useModifierUtilisateur()
  const reinitialiser = useReinitialiserMotDePasse()

  const filtrer = (changement: () => void) => {
    changement()
    setPage(1)
  }

  async function confirmerStatut(u: UtilisateurAdmin) {
    try {
      await modifier.mutateAsync({ id: u.id, actif: !u.actif })
      setAction(null)
    } catch (e) {
      setAction(null)
      setErreur(messageErreur(e))
    }
  }

  async function confirmerReinitialisation(u: UtilisateurAdmin) {
    try {
      setMotDePasse(await reinitialiser.mutateAsync(u.id))
    } catch (e) {
      setErreur(messageErreur(e))
    } finally {
      setAction(null)
    }
  }

  return (
    <>
      <PageHeader
        titre="Utilisateurs"
        sousTitre="Créez les comptes des apprenants, enseignants et administrateurs, et gérez leur accès."
        actions={
          <Button onClick={() => setAction({ type: 'formulaire', utilisateur: null, cle: Date.now() })}>
            <Plus size={20} aria-hidden />
            Nouvel utilisateur
          </Button>
        }
      />

      {erreur && (
        <Alert variante="erreur" className={styles.alerte}>
          {erreur}
        </Alert>
      )}

      <Card sansMarge>
        <div className={styles.filtres}>
          <div role="tablist" aria-label="Filtrer par rôle" className={styles.onglets}>
            {onglets.map((o) => (
              <button
                key={o.libelle}
                type="button"
                role="tab"
                aria-selected={role === o.role}
                className={cx(styles.onglet, role === o.role && styles.ongletActif)}
                onClick={() => filtrer(() => setRole(o.role))}
              >
                {o.libelle}
              </button>
            ))}
          </div>

          <div className={styles.outils}>
            <label className={styles.recherche}>
              <Search size={18} aria-hidden />
              <input
                type="search"
                placeholder="Nom, e-mail ou matricule"
                aria-label="Rechercher un utilisateur"
                value={recherche}
                onChange={(e) => filtrer(() => setRecherche(e.target.value))}
              />
            </label>
            <select
              className={styles.selectStatut}
              aria-label="Filtrer par statut"
              value={statut}
              onChange={(e) => filtrer(() => setStatut(e.target.value as typeof statut))}
            >
              <option value="tous">Tous les statuts</option>
              <option value="actifs">Actifs</option>
              <option value="inactifs">Désactivés</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <Chargement />
        ) : isError ? (
          <Alert variante="erreur" className={styles.alerte}>
            {messageErreur(error)}
          </Alert>
        ) : !data || data.donnees.length === 0 ? (
          <EtatVide
            icone={Users}
            titre="Aucun utilisateur trouvé"
            message={recherche ? 'Modifiez votre recherche ou vos filtres.' : 'Commencez par créer un compte.'}
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <th scope="col">Utilisateur</th>
                  <th scope="col">Rôle</th>
                  <th scope="col">Matricule / spécialité</th>
                  <th scope="col">Statut</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.donnees.map((u) => (
                  <tr key={u.id} className={cx(!u.actif && styles.inactif)}>
                    <td>
                      <div className={styles.personne}>
                        <Avatar id={u.id} photo={u.photo} prenom={u.prenom} nom={u.nom} />
                        <div>
                          <p className={styles.nom}>
                            {u.prenom} {u.nom}
                          </p>
                          <p className={styles.email}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge ton={tonRole[u.role]}>{libellesRole[u.role]}</Badge>
                    </td>
                    <td>{u.matricule ?? u.specialite ?? '—'}</td>
                    <td>
                      <div className={styles.statuts}>
                        <Badge ton={u.actif ? 'succes' : 'danger'}>{u.actif ? 'Actif' : 'Désactivé'}</Badge>
                        {u.doitChangerMotDePasse && <Badge ton="attention">Mot de passe provisoire</Badge>}
                      </div>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setAction({ type: 'formulaire', utilisateur: u, cle: Date.now() })}
                        >
                          <Pencil size={16} aria-hidden />
                          Modifier
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setAction({ type: 'reinitialiser', utilisateur: u })}>
                          <KeyRound size={16} aria-hidden />
                          Mot de passe
                        </Button>
                        {u.id !== moi?.id && (
                          <Button size="sm" variant="ghost" onClick={() => setAction({ type: 'statut', utilisateur: u })}>
                            <Power size={16} aria-hidden />
                            {u.actif ? 'Désactiver' : 'Activer'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className={styles.piedTableau}>
              <Pagination page={data.page} parPage={data.parPage} total={data.total} onPage={setPage} />
            </div>
          </>
        )}
      </Card>

      {action?.type === 'formulaire' && (
        <UtilisateurFormModal
          key={action.cle}
          ouvert
          utilisateur={action.utilisateur}
          roleParDefaut={role}
          onFermer={() => setAction(null)}
          onCree={(resultat) => {
            setAction(null)
            setMotDePasse(resultat)
          }}
        />
      )}

      <ConfirmDialog
        ouvert={action?.type === 'statut'}
        titre={action?.type === 'statut' && action.utilisateur.actif ? 'Désactiver le compte' : 'Réactiver le compte'}
        message={
          action?.type === 'statut' &&
          (action.utilisateur.actif
            ? `${action.utilisateur.prenom} ${action.utilisateur.nom} ne pourra plus se connecter. Son historique est conservé.`
            : `${action.utilisateur.prenom} ${action.utilisateur.nom} pourra de nouveau se connecter.`)
        }
        libelleConfirmer={action?.type === 'statut' && action.utilisateur.actif ? 'Désactiver' : 'Réactiver'}
        enCours={modifier.isPending}
        onConfirmer={() => action?.type === 'statut' && confirmerStatut(action.utilisateur)}
        onAnnuler={() => setAction(null)}
      />

      <ConfirmDialog
        ouvert={action?.type === 'reinitialiser'}
        titre="Réinitialiser le mot de passe"
        message={
          action?.type === 'reinitialiser' &&
          `Un nouveau mot de passe provisoire sera attribué à ${action.utilisateur.prenom} ${action.utilisateur.nom}. L’ancien ne fonctionnera plus.`
        }
        libelleConfirmer="Réinitialiser"
        enCours={reinitialiser.isPending}
        onConfirmer={() => action?.type === 'reinitialiser' && confirmerReinitialisation(action.utilisateur)}
        onAnnuler={() => setAction(null)}
      />

      <MotDePasseProvisoireModal resultat={motDePasse} onFermer={() => setMotDePasse(null)} />
    </>
  )
}
