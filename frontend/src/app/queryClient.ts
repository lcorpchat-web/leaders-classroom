import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/api/client'

/** Cache des données de l'API (React Query). */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Pas de nouvelle tentative pour les erreurs du client (droits, introuvable…)
      retry: (tentatives, erreur) =>
        !(erreur instanceof ApiError && erreur.status >= 400 && erreur.status < 500) && tentatives < 2,
    },
  },
})
