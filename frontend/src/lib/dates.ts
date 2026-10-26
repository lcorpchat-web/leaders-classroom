/** Calculs de dates du calendrier (heure locale du navigateur, semaine commençant le lundi). */

const JOUR_MS = 24 * 3600 * 1000

export const nomsJours = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

export function debutJour(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function ajouterJours(date: Date, jours: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + jours, date.getHours(), date.getMinutes())
}

export function debutMois(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function ajouterMois(date: Date, mois: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + mois, 1)
}

export function memeJour(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/** Lundi de la semaine contenant la date */
export function debutSemaine(date: Date): Date {
  const jour = (date.getDay() + 6) % 7 // lundi = 0
  return ajouterJours(debutJour(date), -jour)
}

/** Jours affichés dans la grille d'un mois : semaines complètes du lundi au dimanche */
export function grilleMois(mois: Date): Date[] {
  const premier = debutSemaine(debutMois(mois))
  const dernierDuMois = new Date(mois.getFullYear(), mois.getMonth() + 1, 0)
  const nbJours = Math.round((debutSemaine(dernierDuMois).getTime() - premier.getTime()) / JOUR_MS) + 7
  return Array.from({ length: nbJours }, (_, i) => ajouterJours(premier, i))
}

const formatMois = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })
const formatHeure = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })
const formatJourLong = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
const formatJourCourt = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })

const majuscule = (texte: string) => texte.charAt(0).toUpperCase() + texte.slice(1)

export const formaterMois = (date: Date) => majuscule(formatMois.format(date))
export const formaterHeure = (date: Date) => formatHeure.format(date)
export const formaterJourLong = (date: Date) => majuscule(formatJourLong.format(date))
export const formaterJourCourt = (date: Date) => majuscule(formatJourCourt.format(date))

/** « 14:00 - 16:00 » */
export function formaterCreneau(debut: Date, dureeMinutes: number): string {
  return `${formaterHeure(debut)} - ${formaterHeure(new Date(debut.getTime() + dureeMinutes * 60_000))}`
}

/** « 2 h », « 1 h 30 », « 45 min » */
export function formaterDuree(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`
}

/** Date locale « AAAA-MM-JJ » pour <input type="date"> */
export function versChampJour(date: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`
}

/** Heure locale « HH:MM » pour <input type="time"> */
export function versChampHeure(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

/** Combine les champs date et heure (heure locale) en instant ISO pour l'API */
export function versInstantISO(jour: string, heure: string): string {
  return new Date(`${jour}T${heure}`).toISOString()
}
