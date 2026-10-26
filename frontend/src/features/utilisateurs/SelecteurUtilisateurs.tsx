import { useState } from 'react'
import { Check, Search } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Chargement } from '@/components/ui/Feedback'
import type { Role } from '@/features/auth'
import { cx } from '@/lib/cx'
import { useDebounce } from '@/lib/useDebounce'
import { useUtilisateurs } from './utilisateurs.hooks'
import styles from './SelecteurUtilisateurs.module.css'

interface SelecteurUtilisateursProps {
  role: Extract<Role, 'ENSEIGNANT' | 'APPRENANT'>
  selection: string[]
  onChange: (ids: string[]) => void
  /** Sélection unique (inscrire un apprenant) ou multiple (enseignants d'une classe) */
  multiple?: boolean
  /** Comptes à ne pas proposer (déjà affectés ou inscrits) */
  exclure?: string[]
}

/** Liste de comptes actifs avec recherche, pour affecter ou inscrire. */
export function SelecteurUtilisateurs({ role, selection, onChange, multiple = false, exclure = [] }: SelecteurUtilisateursProps) {
  const [recherche, setRecherche] = useState('')
  const rechercheDiff = useDebounce(recherche)
  const { data, isLoading } = useUtilisateurs({ role, actif: true, recherche: rechercheDiff, parPage: 50 })

  const proposes = (data?.donnees ?? []).filter((u) => !exclure.includes(u.id))
  const libelle = role === 'ENSEIGNANT' ? 'enseignant' : 'apprenant'

  function basculer(id: string) {
    if (!multiple) return onChange([id])
    onChange(selection.includes(id) ? selection.filter((s) => s !== id) : [...selection, id])
  }

  return (
    <div className={styles.selecteur}>
      <label className={styles.recherche}>
        <Search size={18} aria-hidden />
        <input
          type="search"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder={`Rechercher un ${libelle} (nom, e-mail${role === 'APPRENANT' ? ', matricule' : ''})`}
          aria-label={`Rechercher un ${libelle}`}
        />
      </label>

      {isLoading ? (
        <Chargement />
      ) : proposes.length === 0 ? (
        <p className={styles.vide}>Aucun {libelle} actif disponible.</p>
      ) : (
        <ul role="listbox" aria-multiselectable={multiple} aria-label={`Choisir un ${libelle}`} className={styles.liste}>
          {proposes.map((u) => {
            const choisi = selection.includes(u.id)
            return (
              <li key={u.id} role="option" aria-selected={choisi}>
                <button type="button" className={cx(styles.option, choisi && styles.choisi)} onClick={() => basculer(u.id)}>
                  <Avatar id={u.id} photo={u.photo} prenom={u.prenom} nom={u.nom} taille="sm" />
                  <span className={styles.identite}>
                    <span className={styles.nom}>
                      {u.prenom} {u.nom}
                    </span>
                    <span className={styles.detail}>
                      {u.email}
                      {u.matricule && ` · ${u.matricule}`}
                      {u.specialite && ` · ${u.specialite}`}
                    </span>
                  </span>
                  <span className={styles.coche} aria-hidden>
                    {choisi && <Check size={16} strokeWidth={3} />}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
