import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useModifierClasse, type ClasseDetail } from '@/features/classes'
import { erreursChamps, messageErreur } from '@/lib/api/client'
import { ChampsClasse } from './ChampsClasse'
import { depuisClasse, validerChampsClasse, versClasseSaisie } from './classeFormulaire'

/** Modification des informations d'une classe (Administrateur). */
export function ClasseFormModal({ classe, onFermer }: { classe: ClasseDetail; onFermer: () => void }) {
  const modifier = useModifierClasse(classe.id)
  const [valeurs, setValeurs] = useState(() => depuisClasse(classe))
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreurGenerale, setErreurGenerale] = useState<string | null>(null)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErreurGenerale(null)
    const erreursLocales = validerChampsClasse(valeurs)
    setErreurs(erreursLocales)
    if (Object.keys(erreursLocales).length > 0) return

    try {
      await modifier.mutateAsync(versClasseSaisie(valeurs))
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
      titre="Modifier la classe"
      actions={
        <>
          <Button variant="outline" onClick={onFermer} disabled={modifier.isPending}>
            Annuler
          </Button>
          <Button type="submit" form="form-classe" disabled={modifier.isPending}>
            {modifier.isPending ? 'Enregistrement…' : 'Enregistrer'}
          </Button>
        </>
      }
    >
      <form id="form-classe" onSubmit={onSubmit} noValidate>
        <ChampsClasse valeurs={valeurs} erreurs={erreurs} onChange={setValeurs} />
        {erreurGenerale && <Alert variante="erreur">{erreurGenerale}</Alert>}
      </form>
    </Modal>
  )
}
