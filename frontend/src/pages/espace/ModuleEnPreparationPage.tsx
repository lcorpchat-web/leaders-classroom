import type { LucideIcon } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EtatVide } from '@/components/ui/Feedback'
import { PageHeader } from '@/components/ui/PageHeader'
import { routes } from '@/config/routes'

/** Rubrique présente dans le menu des maquettes, dont le module n'est pas encore livré. */
export function ModuleEnPreparationPage({ titre, icone, description }: { titre: string; icone: LucideIcon; description: string }) {
  return (
    <>
      <PageHeader titre={titre} />
      <Card>
        <EtatVide
          icone={icone}
          titre="Module en préparation"
          message={description}
          action={<ButtonLink to={routes.tableauDeBord} variant="outline">Retour au tableau de bord</ButtonLink>}
        />
      </Card>
    </>
  )
}
