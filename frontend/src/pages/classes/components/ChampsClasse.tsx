import { TextAreaField, TextField } from '@/components/ui/TextField'
import type { ChampsClasseValeurs } from './classeFormulaire'
import styles from '../Classes.module.css'

interface ChampsClasseProps {
  valeurs: ChampsClasseValeurs
  erreurs: Record<string, string>
  onChange: (valeurs: ChampsClasseValeurs) => void
  /** Sections séparées (page de création) ou formulaire complet (modale de modification) */
  sections?: 'informations' | 'periode' | 'tout'
}

/** Champs d'une classe, partagés entre la création et la modification. */
export function ChampsClasse({ valeurs, erreurs, onChange, sections = 'tout' }: ChampsClasseProps) {
  const champ = (nom: keyof ChampsClasseValeurs) => ({
    value: valeurs[nom],
    onChange: (e: { target: { value: string } }) => onChange({ ...valeurs, [nom]: e.target.value }),
    erreur: erreurs[nom],
  })

  return (
    <div className={styles.grilleChamps}>
      {sections !== 'periode' && (
        <>
          <TextField
            label="Nom de la classe"
            placeholder="Ex. Allemand - Niveau A2 - Groupe 1"
            required
            className={styles.pleineLargeur}
            {...champ('nom')}
          />
          <TextAreaField
            label="Description (facultatif)"
            placeholder="Objectifs, public visé, prérequis…"
            className={styles.pleineLargeur}
            {...champ('description')}
          />
        </>
      )}
      {sections !== 'informations' && (
        <>
          <TextField label="Date de début" type="date" required {...champ('dateDebut')} />
          <TextField label="Date de fin (facultatif)" type="date" min={valeurs.dateDebut} {...champ('dateFin')} />
          <TextField
            label="Nombre maximum d'apprenants (facultatif)"
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="Illimité"
            {...champ('capaciteMax')}
          />
        </>
      )}
    </div>
  )
}
