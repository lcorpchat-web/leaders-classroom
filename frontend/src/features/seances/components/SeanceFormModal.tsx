import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Modal } from '@/components/ui/Modal'
import { SelectField, TextField } from '@/components/ui/TextField'
import { useAuth } from '@/features/auth'
import { useClasse, useClasses } from '@/features/classes'
import { erreursChamps, messageErreur } from '@/lib/api/client'
import { ajouterJours, formaterDuree, versChampHeure, versChampJour, versInstantISO } from '@/lib/dates'
import { useModifierSeance, useProgrammerSeances } from '../seances.hooks'
import { dureesProposees, type Seance } from '../seances.types'
import styles from './Seances.module.css'

interface SeanceFormModalProps {
  /** Séance à modifier ; absente = programmation */
  seance?: Seance
  /** Classe imposée (programmation depuis la page d'une classe) */
  classeId?: string
  onFermer: () => void
}

/** « Programmer une séance » (figure 9) ou modifier une séance programmée. */
export function SeanceFormModal({ seance, classeId: classeImposee, onFermer }: SeanceFormModalProps) {
  const { utilisateur } = useAuth()
  const estAdmin = utilisateur?.role === 'ADMIN'
  const demain = ajouterJours(new Date(), 1)

  const [classeId, setClasseId] = useState(seance?.classe.id ?? classeImposee ?? '')
  const [titre, setTitre] = useState(seance?.titre ?? '')
  const [jour, setJour] = useState(versChampJour(seance ? new Date(seance.debut) : demain))
  const [heure, setHeure] = useState(seance ? versChampHeure(new Date(seance.debut)) : '14:00')
  const [duree, setDuree] = useState(String(seance?.dureeMinutes ?? 120))
  const [enseignantId, setEnseignantId] = useState('')
  const [repeter, setRepeter] = useState(false)
  const [jusquAu, setJusquAu] = useState('')
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreurGenerale, setErreurGenerale] = useState<string | null>(null)

  const programmer = useProgrammerSeances()
  const modifier = useModifierSeance()
  const enCours = programmer.isPending || modifier.isPending

  // Classes proposées : celles de l'enseignant, ou toutes les classes actives pour l'administration
  const { data: classes } = useClasses({ active: true, parPage: 100 })
  // Administration : l'animateur est choisi parmi les enseignants affectés à la classe
  const { data: classe } = useClasse(classeId, estAdmin && !seance && Boolean(classeId))

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErreurGenerale(null)
    const locales: Record<string, string> = {}
    if (!classeId) locales.classeId = 'Choisissez une classe'
    if (!titre.trim()) locales.titre = 'Titre requis'
    if (!jour) locales.debut = 'Date requise'
    if (estAdmin && !seance && !enseignantId) locales.enseignantId = 'Choisissez l’enseignant qui anime la séance'
    if (repeter && (!jusquAu || jusquAu <= jour)) locales.jusquAu = 'Date postérieure à la première séance'
    setErreurs(locales)
    if (Object.keys(locales).length > 0) return

    const commun = { titre: titre.trim(), debut: versInstantISO(jour, heure), dureeMinutes: Number(duree) }
    try {
      if (seance) {
        await modifier.mutateAsync({ id: seance.id, ...commun })
      } else {
        await programmer.mutateAsync({
          classeId,
          ...commun,
          ...(estAdmin && { enseignantId }),
          ...(repeter && { repetition: { jusquAu } }),
        })
      }
      onFermer()
    } catch (erreur) {
      setErreurs(erreursChamps(erreur))
      setErreurGenerale(messageErreur(erreur))
    }
  }

  return (
    <Modal
      ouvert
      onFermer={onFermer}
      taille="lg"
      titre={seance ? 'Modifier la séance' : 'Planifier une séance'}
      description={seance ? seance.classe.nom : 'Les apprenants inscrits la verront dans leur planning.'}
      actions={
        <>
          <Button variant="outline" onClick={onFermer} disabled={enCours}>
            Annuler
          </Button>
          <Button type="submit" form="form-seance" disabled={enCours}>
            {enCours ? 'Enregistrement…' : seance ? 'Enregistrer' : 'Planifier'}
          </Button>
        </>
      }
    >
      <form id="form-seance" className={styles.formulaire} onSubmit={onSubmit} noValidate>
        {!seance && !classeImposee && (
          <SelectField
            label="Classe"
            className={styles.pleineLargeur}
            value={classeId}
            onChange={(e) => {
              setClasseId(e.target.value)
              setEnseignantId('')
            }}
            options={[
              { value: '', label: 'Choisir une classe…' },
              ...(classes?.donnees ?? []).map((c) => ({ value: c.id, label: c.nom })),
            ]}
            erreur={erreurs.classeId}
          />
        )}

        <TextField
          label="Titre de la séance"
          placeholder="Ex. Séance 3 - Grammaire et communication"
          className={styles.pleineLargeur}
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          erreur={erreurs.titre}
        />

        <TextField
          label="Date"
          type="date"
          min={versChampJour(new Date())}
          value={jour}
          onChange={(e) => setJour(e.target.value)}
          erreur={erreurs.debut}
        />
        <TextField label="Heure de début" type="time" value={heure} onChange={(e) => setHeure(e.target.value)} />
        <SelectField
          label="Durée"
          value={duree}
          onChange={(e) => setDuree(e.target.value)}
          options={dureesProposees.map((d) => ({ value: String(d), label: formaterDuree(d) }))}
          erreur={erreurs.dureeMinutes}
        />

        {estAdmin && !seance && (
          <SelectField
            label="Enseignant"
            value={enseignantId}
            onChange={(e) => setEnseignantId(e.target.value)}
            disabled={!classe}
            options={[
              { value: '', label: classe ? 'Choisir l’enseignant…' : 'Choisissez d’abord la classe' },
              ...(classe?.enseignants ?? []).map((e) => ({ value: e.id, label: `${e.prenom} ${e.nom}` })),
            ]}
            erreur={erreurs.enseignantId}
          />
        )}

        {!seance && (
          <div className={styles.repetition}>
            <Checkbox label="Répéter chaque semaine" checked={repeter} onChange={(e) => setRepeter(e.target.checked)} />
            {repeter && (
              <TextField
                label="Jusqu’au (inclus)"
                type="date"
                min={jour}
                value={jusquAu}
                onChange={(e) => setJusquAu(e.target.value)}
                erreur={erreurs.jusquAu}
              />
            )}
          </div>
        )}

        {erreurGenerale && (
          <Alert variante="erreur" className={styles.pleineLargeur}>
            {erreurGenerale}
          </Alert>
        )}
      </form>
    </Modal>
  )
}
