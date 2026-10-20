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

interface OptionsRequete {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  body?: unknown
}

/**
 * Appelle l'API REST (préfixe /api, même origine que le site).
 * Le cookie de session httpOnly est envoyé automatiquement par le navigateur.
 */
export async function apiRequest<T>(chemin: string, { method = 'GET', body }: OptionsRequete = {}): Promise<T> {
  let reponse: Response
  try {
    reponse = await fetch(`/api${chemin}`, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'RESEAU', 'Impossible de joindre le serveur. Vérifiez votre connexion internet.')
  }

  if (reponse.status === 204) return undefined as T

  const donnees: unknown = await reponse.json().catch(() => null)

  if (!reponse.ok) {
    const erreur = (donnees as { error?: { code?: string; message?: string; champs?: ApiError['champs'] } } | null)
      ?.error
    throw new ApiError(
      reponse.status,
      erreur?.code ?? 'ERREUR',
      erreur?.message ?? 'Une erreur est survenue. Réessayez plus tard.',
      erreur?.champs,
    )
  }

  return donnees as T
}
