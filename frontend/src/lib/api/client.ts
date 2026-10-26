/** Erreur renvoyée par l'API (format { error: { code, message, champs? } }). */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly champs?: Array<{ champ: string; message: string }>

  constructor(status: number, code: string, message: string, champs?: Array<{ champ: string; message: string }>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.champs = champs
  }
}

export const EVENEMENT_SESSION_EXPIREE = 'lc:session-expiree'

/** Message d'erreur affichable à partir de n'importe quelle erreur. */
export function messageErreur(erreur: unknown, defaut = 'Une erreur est survenue. Réessayez plus tard.'): string {
  return erreur instanceof ApiError ? erreur.message : defaut
}

/** Erreurs par champ renvoyées par l'API (400), indexées par nom de champ. */
export function erreursChamps(erreur: unknown): Record<string, string> {
  if (!(erreur instanceof ApiError) || !erreur.champs) return {}
  return Object.fromEntries(erreur.champs.map(({ champ, message }) => [champ, message]))
}

/** Construit une query string en ignorant les valeurs vides. */
export function query(params: Record<string, string | number | boolean | undefined | null>): string {
  const recherche = new URLSearchParams()
  for (const [cle, valeur] of Object.entries(params)) {
    if (valeur !== undefined && valeur !== null && valeur !== '') recherche.set(cle, String(valeur))
  }
  const texte = recherche.toString()
  return texte ? `?${texte}` : ''
}

/** Réponse paginée de l'API */
export interface Page<T> {
  donnees: T[]
  total: number
  page: number
  parPage: number
}

interface OptionsRequete {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  /** Objet envoyé en JSON, ou FormData pour un dépôt de fichier */
  body?: unknown
}

/**
 * Appelle l'API REST (préfixe /api, même origine que le site).
 * Le cookie de session httpOnly est envoyé automatiquement par le navigateur.
 */
export async function apiRequest<T>(chemin: string, { method = 'GET', body }: OptionsRequete = {}): Promise<T> {
  let reponse: Response
  try {
    const formulaire = body instanceof FormData
    reponse = await fetch(`/api${chemin}`, {
      method,
      credentials: 'same-origin',
      // FormData : le navigateur fixe lui-même le Content-Type multipart
      headers: body === undefined || formulaire ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : formulaire ? body : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'RESEAU', 'Impossible de joindre le serveur. Vérifiez votre connexion internet.')
  }

  if (reponse.status === 204) return undefined as T

  const donnees: unknown = await reponse.json().catch(() => null)

  if (!reponse.ok) {
    const erreur = (donnees as { error?: { code?: string; message?: string; champs?: ApiError['champs'] } } | null)
      ?.error
    // Session expirée ou compte désactivé pendant la navigation : l'AuthProvider se déconnecte
    if (reponse.status === 401 && erreur?.code === 'NON_AUTHENTIFIE') {
      window.dispatchEvent(new Event(EVENEMENT_SESSION_EXPIREE))
    }
    throw new ApiError(
      reponse.status,
      erreur?.code ?? 'ERREUR',
      erreur?.message ?? 'Une erreur est survenue. Réessayez plus tard.',
      erreur?.champs,
    )
  }

  return donnees as T
}
