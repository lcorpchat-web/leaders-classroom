import { Navigate, Outlet, useLocation } from 'react-router'
import { Chargement } from '@/components/ui/Feedback'
import { routes } from '@/config/routes'
import type { Role } from './auth.types'
import { useAuth } from './useAuth'

/**
 * Route protégée : redirige vers la connexion si aucune session n'est ouverte,
 * et impose le changement d'un mot de passe provisoire avant toute autre page.
 * L'affichage est un confort : les droits sont toujours vérifiés par l'API (section 12).
 */
export function RequireAuth({ roles }: { roles?: Role[] }) {
  const { statut, utilisateur } = useAuth()
  const location = useLocation()

  if (statut === 'chargement') return <Chargement />

  if (!utilisateur) {
    return <Navigate to={routes.connexion} replace state={{ depuis: location.pathname }} />
  }

  if (utilisateur.doitChangerMotDePasse && location.pathname !== routes.motDePasse) {
    return <Navigate to={routes.motDePasse} replace />
  }

  if (roles && !roles.includes(utilisateur.role)) {
    return <Navigate to={routes.tableauDeBord} replace />
  }

  return <Outlet />
}
