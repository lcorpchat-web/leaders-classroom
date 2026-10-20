import { Navigate, Outlet, useLocation } from 'react-router'
import { routes } from '@/config/routes'
import type { Role } from './auth.types'
import { useAuth } from './useAuth'

/**
 * Route protégée : redirige vers la connexion si aucune session n'est ouverte.
 * L'affichage est un confort : les droits sont toujours vérifiés par l'API (section 12).
 */
export function RequireAuth({ roles }: { roles?: Role[] }) {
  const { statut, utilisateur } = useAuth()
  const location = useLocation()

  if (statut === 'chargement') {
    return (
      <p role="status" style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
        Chargement…
      </p>
    )
  }

  if (!utilisateur) {
    return <Navigate to={routes.connexion} replace state={{ depuis: location.pathname }} />
  }

  if (roles && !roles.includes(utilisateur.role)) {
    return <Navigate to={routes.tableauDeBord} replace />
  }

  return <Outlet />
}
