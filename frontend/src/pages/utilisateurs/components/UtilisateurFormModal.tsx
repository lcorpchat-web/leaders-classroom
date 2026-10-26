import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { SelectField, TextField } from '@/components/ui/TextField'
import { libellesRole, type Role } from '@/features/auth'
import {
  useCreerUtilisateur,
  useModifierUtilisateur,
  type ResultatMotDePasse,
  type UtilisateurAdmin,
  type UtilisateurSaisie,
} from '@/features/utilisateurs'
import { erreursChamps, messageErreur } from '@/lib/api/client'
import styles from '../UtilisateursPage.module.css'

interface UtilisateurFormModalProps {
  ouvert: boolean
  /** Compte à modifier ; absent = création */
  utilisateur?: UtilisateurAdmin | null
  roleParDefaut?: Role
  onFermer: () => void
  /** Création réussie : le mot de passe provisoire doit être affiché à l'administrateur */
  onCree: (resultat: ResultatMotDePasse) => void
}

const optionsRole = (['APPRENANT', 'ENSEIGNANT', 'ADMIN'] as const).map((role) => ({
  value: role,
  label: libellesRole[role],
}))

function saisieInitiale(utilisateur?: UtilisateurAdmin | null, role: Role = 'APPRENANT'): UtilisateurSaisie {
  return {
    nom: utilisateur?.nom ?? '',
    prenom: utilisateur?.prenom ?? '',
    email: utilisateur?.email ?? '',
    telephone: utilisateur?.telephone ?? '',
    role: utilisateur?.role ?? role,
    matricule: utilisateur?.matricule ?? '',
    specialite: utilisateur?.specialite ?? '',
  }
}

/** Création ou modification d'un compte (le formulaire est remonté à chaque ouverture via `key`). */
export function UtilisateurFormModal({ ouvert, utilisateur, roleParDefaut, onFermer, onCree }: UtilisateurFormModalProps) {
  const modification = Boolean(utilisateur)
  const [saisie, setSaisie] = useState<UtilisateurSaisie>(() => saisieInitiale(utilisateur, roleParDefaut))
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreurGenerale, setErreurGenerale] = useState<string | null>(null)

  const creer = useCreerUtilisateur()
  const modifier = useModifierUtilisateur()
  const enCours = creer.isPending || modifier.isPending

  const champ = (nom: keyof UtilisateurSaisie) => ({
    value: saisie[nom],
    onChange: (e: { target: { value: string } }) => setSaisie((s) => ({ ...s, [nom]: e.target.value })),
    erreur: erreurs[nom],
  })

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErreurs({})
    setErreurGenerale(null)
    try {
      if (utilisateur) {
        // Le rôle n'est pas modifiable (il conditionne affectations et inscriptions)
        const { nom, prenom, email, telephone, matricule, specialite } = saisie
        await modifier.mutateAsync({ id: utilisateur.id, nom, prenom, email, telephone, matricule, specialite })
        onFermer()
      } else {
        onCree(await creer.mutateAsync(saisie))
      }
    } catch (erreur) {
      setErreurs(erreursChamps(erreur))
      setErreurGenerale(messageErreur(erreur))
    }
  }

  return (
    <Modal
      ouvert={ouvert}
      onFermer={onFermer}
      taille="lg"
      titre={modification ? 'Modifier le compte' : 'Nouvel utilisateur'}
      description={
        modification
          ? undefined
          : 'Un mot de passe provisoire sera généré : l’utilisateur devra le changer à sa première connexion.'
      }
      actions={
        <>
          <Button variant="outline" onClick={onFermer} disabled={enCours}>
            Annuler
          </Button>
          <Button type="submit" form="form-utilisateur" disabled={enCours}>
            {enCours ? 'Enregistrement…' : modification ? 'Enregistrer' : 'Créer le compte'}
          </Button>
        </>
      }
    >
      <form id="form-utilisateur" className={styles.formulaire} onSubmit={onSubmit}>
        <SelectField
          label="Rôle"
          options={optionsRole}
          value={saisie.role}
          onChange={(e) => setSaisie((s) => ({ ...s, role: e.target.value as Role }))}
          disabled={modification}
          className={styles.pleineLargeur}
        />
        <TextField label="Prénom" required autoComplete="off" {...champ('prenom')} />
        <TextField label="Nom" required autoComplete="off" {...champ('nom')} />
        <TextField label="Adresse e-mail" type="email" required autoComplete="off" {...champ('email')} />
        <TextField label="Téléphone (facultatif)" type="tel" autoComplete="off" {...champ('telephone')} />
        {saisie.role === 'APPRENANT' && (
          <TextField
            label="Matricule (facultatif)"
            placeholder="Généré automatiquement si vide"
            {...champ('matricule')}
          />
        )}
        {saisie.role === 'ENSEIGNANT' && (
          <TextField label="Spécialité (facultatif)" placeholder="Ex. Gestion de projet" {...champ('specialite')} />
        )}
        {erreurGenerale && (
          <Alert className={styles.pleineLargeur} variante="erreur">
            {erreurGenerale}
          </Alert>
        )}
      </form>
    </Modal>
  )
}
