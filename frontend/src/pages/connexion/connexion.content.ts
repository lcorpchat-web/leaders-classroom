import type { LucideIcon } from 'lucide-react'
import { FileText, GraduationCap, MonitorSmartphone, Shield, User, Users } from 'lucide-react'
import type { Role } from '@/features/auth'

/** Contenu éditorial de la page de connexion (maquette 08-page-connexion). */

export interface AtoutConnexion {
  icone: LucideIcon
  titre: string
  description: string
}

export const atoutsConnexion: AtoutConnexion[] = [
  { icone: GraduationCap, titre: 'Apprendre sans limites', description: 'Accédez à vos cours où que vous soyez.' },
  {
    icone: Users,
    titre: 'Des classes interactives',
    description: 'Suivez des cours en direct avec vos enseignants.',
  },
  {
    icone: FileText,
    titre: 'Un suivi complet',
    description: 'Consultez vos progressions, présences et évaluations.',
  },
  {
    icone: MonitorSmartphone,
    titre: 'Accessible sur tous vos appareils',
    description: 'Ordinateur, tablette et smartphone.',
  },
]

export const citationConnexion = ['Former aujourd’hui', 'les leaders de demain'] as const

export interface ProfilConnexion {
  role: Role
  libelle: string
  icone: LucideIcon
}

/**
 * Profils affichés en onglets. Indication visuelle uniquement : le rôle réel est
 * déterminé par le serveur à partir du compte (cahier de conception, figure 5).
 */
export const profilsConnexion: ProfilConnexion[] = [
  { role: 'APPRENANT', libelle: 'Apprenant', icone: User },
  { role: 'ENSEIGNANT', libelle: 'Enseignant', icone: Users },
  { role: 'ADMIN', libelle: 'Administrateur', icone: Shield },
]
