import { useState, type FormEvent } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Download, Eye, FileImage, FileMusic, FileSpreadsheet, FileText, FileVideo, Presentation, Trash2, Upload } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chargement, EtatVide } from '@/components/ui/Feedback'
import { ConfirmDialog, Modal } from '@/components/ui/Modal'
import { SelectField, TextField } from '@/components/ui/TextField'
import { useAuth } from '@/features/auth'
import type { ClasseDetail } from '@/features/classes'
import { usePlanning } from '@/features/seances'
import {
  formaterTaille,
  formatsAcceptes,
  typesApercu,
  urlFichier,
  useDeposerSupport,
  useSupports,
  useSupprimerSupport,
  type Support,
} from '@/features/supports'
import { erreursChamps, messageErreur } from '@/lib/api/client'
import { ajouterJours, formaterJourCourt } from '@/lib/dates'
import { formaterJour } from '@/lib/format'
import styles from '../Classes.module.css'

function iconeType(typeMime: string): LucideIcon {
  if (typeMime.startsWith('image/')) return FileImage
  if (typeMime.startsWith('video/')) return FileVideo
  if (typeMime.startsWith('audio/')) return FileMusic
  if (/presentation|powerpoint/.test(typeMime)) return Presentation
  if (/spreadsheet|excel/.test(typeMime)) return FileSpreadsheet
  return FileText
}

/** Supports de cours de la classe (RG8) : dépôt et retrait par l'administration ou un enseignant affecté. */
export function SupportsSection({ classe }: { classe: ClasseDetail }) {
  const { utilisateur } = useAuth()
  const peutGerer = utilisateur?.role === 'ADMIN' || classe.enseignants.some((e) => e.id === utilisateur?.id)

  const { data: supports, isLoading, isError, error } = useSupports(classe.id)
  const supprimer = useSupprimerSupport()
  const [depot, setDepot] = useState(false)
  const [aSupprimer, setASupprimer] = useState<Support | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)

  async function confirmerSuppression(support: Support) {
    try {
      await supprimer.mutateAsync(support.id)
    } catch (e) {
      setErreur(messageErreur(e))
    } finally {
      setASupprimer(null)
    }
  }

  return (
    <Card
      titre="Supports de cours"
      icone={FileText}
      action={
        peutGerer && (
          <Button size="sm" onClick={() => setDepot(true)}>
            <Upload size={16} aria-hidden />
            Déposer
          </Button>
        )
      }
    >
      {erreur && (
        <Alert variante="erreur" className={styles.alerteSection}>
          {erreur}
        </Alert>
      )}
      {isLoading ? (
        <Chargement />
      ) : isError ? (
        <Alert variante="erreur">{messageErreur(error)}</Alert>
      ) : !supports || supports.length === 0 ? (
        <EtatVide icone={FileText} titre="Aucun support déposé" />
      ) : (
        <ul role="list" className={styles.supports}>
          {supports.map((s) => {
            const Icone = iconeType(s.typeMime)
            return (
              <li key={s.id} className={styles.support}>
                <span className={styles.supportIcone} aria-hidden>
                  <Icone size={22} />
                </span>
                <div className={styles.supportTexte}>
                  <p className={styles.personneNom}>{s.titre}</p>
                  <p className={styles.personneDetail}>
                    {s.nomFichier} · {formaterTaille(s.tailleOctets)} · {formaterJour(s.deposeLe)}
                    {s.seance && ` · ${s.seance.titre}`}
                  </p>
                </div>
                <div className={styles.actionsLigne}>
                  {typesApercu.includes(s.typeMime) && (
                    <a className={styles.boutonIcone} href={urlFichier(s.id, true)} target="_blank" rel="noopener noreferrer" aria-label={`Ouvrir ${s.titre}`}>
                      <Eye size={18} aria-hidden />
                    </a>
                  )}
                  <a className={styles.boutonIcone} href={urlFichier(s.id)} download aria-label={`Télécharger ${s.titre}`}>
                    <Download size={18} aria-hidden />
                  </a>
                  {peutGerer && (
                    <button type="button" className={styles.boutonIcone} onClick={() => setASupprimer(s)} aria-label={`Supprimer ${s.titre}`}>
                      <Trash2 size={18} aria-hidden />
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {depot && <DepotSupportModal classe={classe} onFermer={() => setDepot(false)} />}

      <ConfirmDialog
        ouvert={aSupprimer !== null}
        titre="Supprimer le support"
        message={aSupprimer && `« ${aSupprimer.titre} » ne sera plus accessible aux apprenants. Cette action est définitive.`}
        libelleConfirmer="Supprimer"
        enCours={supprimer.isPending}
        onConfirmer={() => aSupprimer && confirmerSuppression(aSupprimer)}
        onAnnuler={() => setASupprimer(null)}
      />
    </Card>
  )
}

function DepotSupportModal({ classe, onFermer }: { classe: ClasseDetail; onFermer: () => void }) {
  const deposer = useDeposerSupport(classe.id)
  const [fichier, setFichier] = useState<File | null>(null)
  const [titre, setTitre] = useState('')
  const [seanceId, setSeanceId] = useState('')
  const [erreurs, setErreurs] = useState<Record<string, string>>({})
  const [erreurGenerale, setErreurGenerale] = useState<string | null>(null)

  // Séances proches de la classe, pour rattacher le support (facultatif, RG8)
  const [periode] = useState(() => ({ debut: ajouterJours(new Date(), -60), fin: ajouterJours(new Date(), 60) }))
  const { data: seances } = usePlanning(periode.debut, periode.fin, classe.id)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErreurGenerale(null)
    const locales: Record<string, string> = {}
    if (!fichier) locales.fichier = 'Choisissez un fichier'
    if (!titre.trim()) locales.titre = 'Titre requis'
    setErreurs(locales)
    if (!fichier || Object.keys(locales).length > 0) return

    try {
      await deposer.mutateAsync({ fichier, titre: titre.trim(), seanceId: seanceId || undefined })
      onFermer()
    } catch (e) {
      setErreurs(erreursChamps(e))
      setErreurGenerale(messageErreur(e))
    }
  }

  return (
    <Modal
      ouvert
      onFermer={onFermer}
      titre="Déposer un support"
      description={`${classe.nom} — PDF, documents Office, images, audio ou vidéo MP4.`}
      actions={
        <>
          <Button variant="outline" onClick={onFermer} disabled={deposer.isPending}>
            Annuler
          </Button>
          <Button type="submit" form="form-support" disabled={deposer.isPending}>
            {deposer.isPending ? 'Envoi…' : 'Déposer'}
          </Button>
        </>
      }
    >
      <form id="form-support" className={styles.formulaireSupport} onSubmit={onSubmit} noValidate>
        <label className={styles.zoneFichier}>
          <Upload size={28} aria-hidden />
          <span>{fichier ? `${fichier.name} (${formaterTaille(fichier.size)})` : 'Cliquez pour choisir un fichier'}</span>
          <input
            type="file"
            accept={formatsAcceptes}
            className="sr-only"
            onChange={(e) => {
              const choisi = e.target.files?.[0] ?? null
              setFichier(choisi)
              if (choisi && !titre) setTitre(choisi.name.replace(/\.[^.]+$/, ''))
            }}
          />
        </label>
        {erreurs.fichier && <p className={styles.erreurChamp}>{erreurs.fichier}</p>}

        <TextField label="Titre" value={titre} onChange={(e) => setTitre(e.target.value)} erreur={erreurs.titre} />
        <SelectField
          label="Séance (facultatif)"
          value={seanceId}
          onChange={(e) => setSeanceId(e.target.value)}
          options={[
            { value: '', label: 'Aucune séance précise' },
            ...(seances ?? [])
              .filter((s) => s.statut !== 'ANNULEE')
              .map((s) => ({ value: s.id, label: `${formaterJourCourt(new Date(s.debut))} — ${s.titre}` })),
          ]}
          erreur={erreurs.seanceId}
        />
        {erreurGenerale && <Alert variante="erreur">{erreurGenerale}</Alert>}
      </form>
    </Modal>
  )
}
