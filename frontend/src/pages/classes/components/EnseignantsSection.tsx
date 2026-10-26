import { useState } from 'react'
import { Plus, UserMinus, Users } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog, Modal } from '@/components/ui/Modal'
import { useAffectations, type ClasseDetail, type Personne } from '@/features/classes'
import { SelecteurUtilisateurs } from '@/features/utilisateurs'
import { messageErreur } from '@/lib/api/client'
import styles from '../Classes.module.css'

/** Enseignants affectés à la classe ; ajout et retrait réservés à l'administration (RG1 : au moins un). */
export function EnseignantsSection({ classe, estAdmin }: { classe: ClasseDetail; estAdmin: boolean }) {
  const { affecter, retirer } = useAffectations(classe.id)
  const [ajoutOuvert, setAjoutOuvert] = useState(false)
  const [choix, setChoix] = useState<string[]>([])
  const [aRetirer, setARetirer] = useState<Personne | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  const dernier = classe.enseignants.length <= 1

  async function confirmerAjout() {
    if (!choix[0]) return
    try {
      await affecter.mutateAsync(choix[0])
      setAjoutOuvert(false)
      setChoix([])
    } catch (e) {
      setErreur(messageErreur(e))
      setAjoutOuvert(false)
    }
  }

  async function confirmerRetrait(enseignant: Personne) {
    try {
      await retirer.mutateAsync(enseignant.id)
    } catch (e) {
      setErreur(messageErreur(e))
    } finally {
      setARetirer(null)
    }
  }

  return (
    <Card
      titre="Enseignants"
      icone={Users}
      action={
        estAdmin && (
          <Button size="sm" variant="outline" onClick={() => setAjoutOuvert(true)}>
            <Plus size={16} aria-hidden />
            Affecter
          </Button>
        )
      }
    >
      {erreur && (
        <Alert variante="erreur" className={styles.alerteSection}>
          {erreur}
        </Alert>
      )}
      <ul role="list" className={styles.listePersonnes}>
        {classe.enseignants.map((e) => (
          <li key={e.id}>
            <Avatar id={e.id} photo={e.photo} prenom={e.prenom} nom={e.nom} />
            <div className={styles.personneTexte}>
              <p className={styles.personneNom}>
                {e.prenom} {e.nom}
              </p>
              <p className={styles.personneDetail}>{e.email}</p>
            </div>
            {estAdmin && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setARetirer(e)}
                disabled={dernier}
                title={dernier ? 'Une classe doit garder au moins un enseignant' : undefined}
                aria-label={`Retirer ${e.prenom} ${e.nom}`}
              >
                <UserMinus size={16} aria-hidden />
              </Button>
            )}
          </li>
        ))}
      </ul>

      <Modal
        ouvert={ajoutOuvert}
        onFermer={() => setAjoutOuvert(false)}
        titre="Affecter un enseignant"
        description={classe.nom}
        actions={
          <>
            <Button variant="outline" onClick={() => setAjoutOuvert(false)}>
              Annuler
            </Button>
            <Button onClick={confirmerAjout} disabled={!choix[0] || affecter.isPending}>
              {affecter.isPending ? 'Affectation…' : 'Affecter'}
            </Button>
          </>
        }
      >
        <SelecteurUtilisateurs
          role="ENSEIGNANT"
          selection={choix}
          onChange={setChoix}
          exclure={classe.enseignants.map((e) => e.id)}
        />
      </Modal>

      <ConfirmDialog
        ouvert={aRetirer !== null}
        titre="Retirer l’enseignant"
        message={aRetirer && `${aRetirer.prenom} ${aRetirer.nom} ne pourra plus animer les séances de cette classe.`}
        libelleConfirmer="Retirer"
        enCours={retirer.isPending}
        onConfirmer={() => aRetirer && confirmerRetrait(aRetirer)}
        onAnnuler={() => setARetirer(null)}
      />
    </Card>
  )
}
