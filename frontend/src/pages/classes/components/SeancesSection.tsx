import { useState } from 'react'
import { CalendarDays, Plus } from 'lucide-react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Chargement, EtatVide } from '@/components/ui/Feedback'
import { useAuth } from '@/features/auth'
import type { ClasseDetail } from '@/features/classes'
import { ListeSeances, SeanceDetailModal, SeanceFormModal, usePlanning, type Seance } from '@/features/seances'
import { messageErreur } from '@/lib/api/client'
import { ajouterJours } from '@/lib/dates'

/** Séances à venir de la classe (90 jours) ; planification par l'administration ou un enseignant affecté (RG4). */
export function SeancesSection({ classe }: { classe: ClasseDetail }) {
  const { utilisateur } = useAuth()
  const peutPlanifier =
    classe.active &&
    (utilisateur?.role === 'ADMIN' || classe.enseignants.some((e) => e.id === utilisateur?.id))

  const [maintenant] = useState(() => new Date())
  const { data: seances, isLoading, isError, error } = usePlanning(maintenant, ajouterJours(maintenant, 90), classe.id)
  const [choisie, setChoisie] = useState<Seance | null>(null)
  const [planification, setPlanification] = useState(false)

  return (
    <Card
      titre="Séances à venir"
      sousTitre="Les 90 prochains jours"
      icone={CalendarDays}
      action={
        peutPlanifier && (
          <Button size="sm" onClick={() => setPlanification(true)}>
            <Plus size={16} aria-hidden />
            Planifier
          </Button>
        )
      }
    >
      {isLoading ? (
        <Chargement />
      ) : isError ? (
        <Alert variante="erreur">{messageErreur(error)}</Alert>
      ) : !seances || seances.length === 0 ? (
        <EtatVide icone={CalendarDays} titre="Aucune séance programmée" />
      ) : (
        <ListeSeances seances={seances} onChoisir={setChoisie} sansClasse />
      )}

      {choisie && <SeanceDetailModal seance={choisie} onFermer={() => setChoisie(null)} />}
      {planification && <SeanceFormModal classeId={classe.id} onFermer={() => setPlanification(false)} />}
    </Card>
  )
}
