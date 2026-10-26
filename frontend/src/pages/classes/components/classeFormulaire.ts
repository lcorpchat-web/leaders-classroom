import type { ClasseDetail, ClasseSaisie } from '@/features/classes'
import { versChampDate } from '@/lib/format'

/** Saisie du formulaire de classe (valeurs textuelles des champs) */
export interface ChampsClasseValeurs {
  nom: string
  description: string
  dateDebut: string
  dateFin: string
  capaciteMax: string
}

export const champsClasseVides: ChampsClasseValeurs = {
  nom: '',
  description: '',
  dateDebut: '',
  dateFin: '',
  capaciteMax: '',
}

export function depuisClasse(classe: ClasseDetail): ChampsClasseValeurs {
  return {
    nom: classe.nom,
    description: classe.description ?? '',
    dateDebut: versChampDate(classe.dateDebut),
    dateFin: versChampDate(classe.dateFin),
    capaciteMax: classe.capaciteMax?.toString() ?? '',
  }
}

/** Contrôles côté client ; l'API applique les mêmes règles. */
export function validerChampsClasse(v: ChampsClasseValeurs): Record<string, string> {
  const erreurs: Record<string, string> = {}
  if (!v.nom.trim()) erreurs.nom = 'Nom requis'
  if (!v.dateDebut) erreurs.dateDebut = 'Date de début requise'
  if (v.dateFin && v.dateDebut && v.dateFin < v.dateDebut) erreurs.dateFin = 'La date de fin doit suivre la date de début'
  if (v.capaciteMax && (!Number.isInteger(Number(v.capaciteMax)) || Number(v.capaciteMax) < 1)) {
    erreurs.capaciteMax = 'Nombre entier supérieur à 0'
  }
  return erreurs
}

export function versClasseSaisie(v: ChampsClasseValeurs): ClasseSaisie {
  return {
    nom: v.nom.trim(),
    description: v.description.trim(),
    dateDebut: v.dateDebut,
    dateFin: v.dateFin || null,
    capaciteMax: v.capaciteMax ? Number(v.capaciteMax) : null,
  }
}
