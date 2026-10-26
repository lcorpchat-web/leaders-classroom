import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import {
  CalendarDays,
  ChevronRight,
  ClipboardList,
  FileText,
  MessageSquare,
  PenLine,
  School,
  UserCheck,
  Users,
  Video,
} from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { routes } from '@/config/routes'
import { useCreerClasse } from '@/features/classes'
import { SelecteurUtilisateurs, useUtilisateurs } from '@/features/utilisateurs'
import { erreursChamps, messageErreur } from '@/lib/api/client'
import { formaterPeriode } from '@/lib/format'
import { ChampsClasse } from './components/ChampsClasse'
import { champsClasseVides, validerChampsClasse, versClasseSaisie } from './components/classeFormulaire'
import styles from './Classes.module.css'

/** Outils mis à disposition de chaque classe (encadré de la maquette 04) */
const outilsInclus = [
  { icone: Video, libelle: 'Salle de visioconférence (BigBlueButton)' },
  { icone: PenLine, libelle: 'Tableau blanc interactif' },
  { icone: FileText, libelle: 'Partage de documents' },
  { icone: MessageSquare, libelle: 'Chat en direct' },
  { icone: UserCheck, libelle: 'Suivi des présences' },
]

/** Création d'une classe (Administrateur), inspirée de la maquette 04-creation-classe. */
export function NouvelleClassePage() {
  const navigate = useNavigate()
  const creer = useCreerClasse()

  const [valeurs, setValeurs] = useState(champsClasseVides)
  const [enseignantIds, setEnseignantIds] = useState<string[]>([])
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreurGenerale, setErreurGenerale] = useState<string | null>(null)

  // Noms des enseignants choisis pour l'aperçu (données déjà en cache via le sélecteur)
  const { data: enseignants } = useUtilisateurs({ role: 'ENSEIGNANT', actif: true, recherche: '', parPage: 50 })
  const nomsChoisis = (enseignants?.donnees ?? [])
    .filter((e) => enseignantIds.includes(e.id))
    .map((e) => `${e.prenom} ${e.nom}`)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErreurGenerale(null)
    const erreursLocales = validerChampsClasse(valeurs)
    if (enseignantIds.length === 0) erreursLocales.enseignantIds = 'Affectez au moins un enseignant'
    setErreurs(erreursLocales)
    if (Object.keys(erreursLocales).length > 0) {
      setErreurGenerale('Vérifiez les champs signalés.')
      return
    }

    try {
      const classe = await creer.mutateAsync({ ...versClasseSaisie(valeurs), enseignantIds })
      navigate(routes.classe(classe.id), { replace: true })
    } catch (erreur) {
      setErreurs(erreursChamps(erreur))
      setErreurGenerale(messageErreur(erreur))
    }
  }

  return (
    <>
      <PageHeader titre="Créer une nouvelle classe" retour={{ to: routes.classes, libelle: 'Retour aux classes' }} />

      <form className={styles.creation} onSubmit={onSubmit} noValidate>
        <div className={styles.creationSections}>
          <Card titre="Informations générales" sousTitre="Définissez les informations de base de la classe." icone={ClipboardList}>
            <ChampsClasse valeurs={valeurs} erreurs={erreurs} onChange={setValeurs} sections="informations" />
          </Card>

          <Card titre="Période et capacité" sousTitre="Dates de la formation et nombre de places." icone={CalendarDays}>
            <ChampsClasse valeurs={valeurs} erreurs={erreurs} onChange={setValeurs} sections="periode" />
          </Card>

          <Card
            titre="Enseignants"
            sousTitre="Au moins un enseignant anime la classe. Vous pourrez en ajouter ensuite."
            icone={Users}
          >
            <SelecteurUtilisateurs role="ENSEIGNANT" multiple selection={enseignantIds} onChange={setEnseignantIds} />
            {erreurs.enseignantIds && <p className={styles.erreurChamp}>{erreurs.enseignantIds}</p>}
          </Card>
        </div>

        <aside className={styles.apercu}>
          <Card titre="Aperçu de la classe" icone={School}>
            <p className={styles.apercuNom}>{valeurs.nom.trim() || 'Nom de la classe'}</p>
            {valeurs.description.trim() && <p className={styles.apercuDescription}>{valeurs.description}</p>}
            <ul role="list" className={styles.apercuListe}>
              <li>
                <CalendarDays size={18} aria-hidden />
                {valeurs.dateDebut ? formaterPeriode(valeurs.dateDebut, valeurs.dateFin || null) : 'Dates à définir'}
              </li>
              <li>
                <Users size={18} aria-hidden />
                {valeurs.capaciteMax ? `${valeurs.capaciteMax} apprenants maximum` : 'Nombre de places illimité'}
              </li>
              <li>
                <UserCheck size={18} aria-hidden />
                {nomsChoisis.length > 0 ? nomsChoisis.join(', ') : 'Aucun enseignant choisi'}
              </li>
            </ul>

            <div className={styles.outils}>
              <p className={styles.outilsTitre}>Outils inclus</p>
              <ul role="list">
                {outilsInclus.map(({ icone: Icone, libelle }) => (
                  <li key={libelle}>
                    <Icone size={18} aria-hidden />
                    {libelle}
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          {erreurGenerale && <Alert variante="erreur">{erreurGenerale}</Alert>}

          <div className={styles.apercuActions}>
            <ButtonLink to={routes.classes} variant="outline">
              Annuler
            </ButtonLink>
            <Button type="submit" disabled={creer.isPending}>
              {creer.isPending ? 'Création…' : 'Créer la classe'}
              {!creer.isPending && <ChevronRight size={20} aria-hidden />}
            </Button>
          </div>
        </aside>
      </form>
    </>
  )
}
