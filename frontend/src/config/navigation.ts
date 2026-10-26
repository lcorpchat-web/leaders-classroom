import type { LucideIcon } from 'lucide-react'
import {
  BadgeCheck,
  BookOpen,
  CalendarDays,
  ChartColumn,
  CirclePlus,
  FileText,
  House,
  MessageSquareText,
  School,
  SquareCheckBig,
  Target,
  UserRound,
  Users,
  UsersRound,
} from 'lucide-react'
import type { Role } from '@/features/auth'
import { routes } from './routes'
import { site } from './site'

/** Lien de la barre latérale de l'espace connecté */
export interface NavEspaceItem {
  label: string
  to: string
  icone: LucideIcon
}

/**
 * Menu de l'espace connecté, identique aux maquettes : 02 (apprenant), 03 à 06 (enseignant).
 * La création de classe est réservée à l'administration. Paramètres et Déconnexion sont ajoutés
 * en bas de la barre latérale.
 */
export const navigationEspace: Record<Role, NavEspaceItem[]> = {
  ADMIN: [
    { label: 'Tableau de bord', to: routes.tableauDeBord, icone: House },
    { label: 'Utilisateurs', to: routes.utilisateurs, icone: Users },
    { label: 'Classes', to: routes.classes, icone: UsersRound },
    { label: 'Créer une classe', to: routes.nouvelleClasse, icone: CirclePlus },
    { label: 'Calendrier des séances', to: routes.calendrier, icone: CalendarDays },
    { label: 'Documents', to: routes.documents, icone: FileText },
    { label: 'Présences', to: routes.presences, icone: ChartColumn },
    { label: 'Messages', to: routes.messages, icone: MessageSquareText },
  ],
  ENSEIGNANT: [
    { label: 'Tableau de bord', to: routes.tableauDeBord, icone: House },
    { label: 'Mes classes', to: routes.classes, icone: UsersRound },
    { label: 'Mes cours', to: routes.mesCours, icone: BookOpen },
    { label: 'Calendrier des séances', to: routes.calendrier, icone: CalendarDays },
    { label: 'Mes étudiants', to: routes.etudiants, icone: UserRound },
    { label: 'Mes documents', to: routes.documents, icone: FileText },
    { label: 'Présences', to: routes.presences, icone: ChartColumn },
    { label: 'Évaluations', to: routes.evaluations, icone: SquareCheckBig },
    { label: 'Messages', to: routes.messages, icone: MessageSquareText },
    { label: 'Certificats', to: routes.certificats, icone: BadgeCheck },
    { label: 'Mon profil', to: routes.profil, icone: UserRound },
  ],
  APPRENANT: [
    { label: 'Tableau de bord', to: routes.tableauDeBord, icone: House },
    { label: 'Mes cours', to: routes.mesCours, icone: BookOpen },
    { label: 'Calendrier', to: routes.calendrier, icone: CalendarDays },
    { label: 'Mes classes', to: routes.classes, icone: UsersRound },
    { label: 'Mes évaluations', to: routes.evaluations, icone: SquareCheckBig },
    { label: 'Mes documents', to: routes.documents, icone: FileText },
    { label: 'Mes présences', to: routes.mesPresences, icone: Target },
    { label: 'Messages', to: routes.messages, icone: MessageSquareText },
    { label: 'Certificats', to: routes.certificats, icone: BadgeCheck },
  ],
}

/** Devise en bas de la barre latérale (maquette 02 pour l'apprenant, 03 pour les autres) */
export const deviseEspace: Record<Role, [string, string]> = {
  APPRENANT: ['Apprenez aujourd’hui', 'pour un meilleur avenir'],
  ENSEIGNANT: ['Former aujourd’hui', 'les leaders de demain'],
  ADMIN: ['Former aujourd’hui', 'les leaders de demain'],
}

/** Raccourcis du tableau de bord administrateur */
export const raccourcisAdmin = [
  { to: routes.utilisateurs, libelle: 'Gérer les utilisateurs', icone: Users },
  { to: routes.nouvelleClasse, libelle: 'Créer une classe', icone: CirclePlus },
  { to: routes.classes, libelle: 'Toutes les classes', icone: School },
  { to: routes.presences, libelle: 'Suivi des présences', icone: ChartColumn },
]

/** Lien de navigation : page interne (to) ou adresse externe/ancre (href). */
export type NavItem =
  | { label: string; to: string; href?: never; external?: never }
  | { label: string; href: string; external?: boolean; to?: never }

/** Menu principal de l'espace visiteur (maquette 01-page-accueil). */
export const navigationPublique: NavItem[] = [
  { label: 'Accueil', to: routes.accueil },
  { label: 'Formations', href: `${site.siteInstitutionnelUrl}/formations`, external: true },
  { label: 'Cours en ligne', href: '#fonctionnalites' },
  { label: 'À propos', href: `${site.siteInstitutionnelUrl}/a-propos`, external: true },
  { label: 'Contact', href: `${site.siteInstitutionnelUrl}/contact`, external: true },
]
