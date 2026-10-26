import { apiRequest } from '@/lib/api/client'

export interface Support {
  id: string
  titre: string
  nomFichier: string
  typeMime: string
  tailleOctets: number
  deposeLe: string
  classe: { id: string; nom: string }
  seance: { id: string; titre: string; debut: string } | null
  deposePar: { id: string; nom: string; prenom: string } | null
}

export const supportsApi = {
  lister: async (classeId: string) => (await apiRequest<{ supports: Support[] }>(`/classes/${classeId}/supports`)).supports,

  deposer: async (classeId: string, donnees: { fichier: File; titre: string; seanceId?: string }) => {
    const formulaire = new FormData()
    formulaire.append('titre', donnees.titre)
    if (donnees.seanceId) formulaire.append('seanceId', donnees.seanceId)
    formulaire.append('fichier', donnees.fichier)
    return (await apiRequest<{ support: Support }>(`/classes/${classeId}/supports`, { method: 'POST', body: formulaire })).support
  },

  supprimer: (id: string) => apiRequest<void>(`/supports/${id}`, { method: 'DELETE' }),
}

/** Lien de téléchargement (le cookie de session est envoyé : contrôle des droits côté serveur) */
export const urlFichier = (id: string, apercu = false) => `/api/supports/${id}/fichier${apercu ? '?apercu=1' : ''}`

/** Formats acceptés à la sélection du fichier (le serveur vérifie aussi) */
export const formatsAcceptes =
  '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.odt,.odp,.ods,.txt,.png,.jpg,.jpeg,.webp,.mp3,.mp4'

export const typesApercu = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'audio/mpeg', 'video/mp4', 'text/plain']

export function formaterTaille(octets: number): string {
  if (octets < 1024) return `${octets} o`
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`
  return `${(octets / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`
}
