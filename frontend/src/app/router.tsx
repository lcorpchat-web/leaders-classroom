import { createBrowserRouter } from 'react-router'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { routes } from '@/config/routes'
import { RequireAuth } from '@/features/auth'
import { LoginPage } from '@/pages/connexion/LoginPage'
import { HomePage } from '@/pages/home/HomePage'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'
import { TableauDeBordPage } from '@/pages/tableau-de-bord/TableauDeBordPage'

export const router = createBrowserRouter([
  // Page plein écran, sans en-tête (maquette 08)
  { path: routes.connexion, element: <LoginPage /> },
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        // Pages réservées aux utilisateurs connectés
        element: <RequireAuth />,
        children: [{ path: routes.tableauDeBord, element: <TableauDeBordPage /> }],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
