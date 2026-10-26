/** Mise en forme des dates et nombres (fr-FR). */

const formatJour = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

/** Date « jour » renvoyée par l'API (ex. 2026-11-02T00:00:00.000Z) → « 2 nov. 2026 » */
export function formaterJour(iso: string | null | undefined): string {
  return iso ? formatJour.format(new Date(iso)) : '—'
}

/** Période d'une classe : « Du 2 nov. 2026 au 30 janv. 2027 » ou « À partir du 2 nov. 2026 » */
export function formaterPeriode(debut: string, fin: string | null): string {
  return fin ? `Du ${formaterJour(debut)} au ${formaterJour(fin)}` : `À partir du ${formaterJour(debut)}`
}

/** Valeur pour <input type="date"> (AAAA-MM-JJ) */
export function versChampDate(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : ''
}

export function pluriel(nombre: number, singulier: string, plurielForme = `${singulier}s`): string {
  return `${nombre} ${nombre > 1 ? plurielForme : singulier}`
}
