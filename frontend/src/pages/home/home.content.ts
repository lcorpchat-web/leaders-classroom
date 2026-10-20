import type { LucideIcon } from 'lucide-react'
import { BookOpen, ClipboardList, FileText, Globe, Smartphone, User, Users, Video } from 'lucide-react'

/**
 * Contenu éditorial de la page d'accueil (maquette 01-page-accueil).
 * Modifier les textes et chiffres ici, sans toucher aux composants.
 */

interface Icone {
  icone: LucideIcon
  /** Icône pleine (true) ou au trait (false), comme sur la maquette */
  pleine?: boolean
}

export interface AtoutHero extends Icone {
  titre: string
  complement: string
}

export interface Fonctionnalite extends Icone {
  titre: string
  description: string
}

export interface Statistique extends Icone {
  valeur: string
  libelle: string
}

export const atoutsHero: AtoutHero[] = [
  { icone: Video, pleine: true, titre: 'Classes', complement: 'en direct' },
  { icone: Users, pleine: true, titre: 'Enseignants', complement: 'qualifiés' },
  { icone: ClipboardList, titre: 'Tableau blanc', complement: 'et partage de documents' },
  { icone: Smartphone, titre: 'Accessible', complement: 'sur tous vos appareils' },
]

export const fonctionnalites: Fonctionnalite[] = [
  {
    icone: Video,
    pleine: true,
    titre: 'Cours en direct',
    description: 'Participez à des classes interactives avec audio, vidéo et chat.',
  },
  {
    icone: Users,
    pleine: true,
    titre: 'Tableau blanc',
    description: 'Écrivez, dessinez et annotez en temps réel.',
  },
  {
    icone: FileText,
    titre: 'Partage de documents',
    description: 'Présentez et commentez vos supports (PDF, PPT, etc.).',
  },
  {
    icone: Smartphone,
    titre: 'Accessible partout',
    description: 'Sur ordinateur, tablette et mobile, où que vous soyez.',
  },
]

// Chiffres de la maquette, à confirmer par l'Institut avant la mise en ligne.
export const statistiques: Statistique[] = [
  { icone: Users, valeur: '+ 1 500', libelle: 'Apprenants inscrits' },
  { icone: User, pleine: true, valeur: '+ 50', libelle: 'Enseignants qualifiés' },
  { icone: BookOpen, pleine: true, valeur: '+ 200', libelle: 'Cours en ligne' },
  { icone: Globe, valeur: '95 %', libelle: 'Taux de satisfaction' },
]
