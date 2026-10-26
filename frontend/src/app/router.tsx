import { createBrowserRouter } from 'react-router'
import { BadgeCheck, MessageSquareText, SquareCheckBig } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { routes } from '@/config/routes'
import { RequireAuth } from '@/features/auth'
import { CalendrierPage } from '@/pages/calendrier/CalendrierPage'
import { ClasseDetailPage } from '@/pages/classes/ClasseDetailPage'
import { ClassesPage } from '@/pages/classes/ClassesPage'
import { NouvelleClassePage } from '@/pages/classes/NouvelleClassePage'
import { LoginPage } from '@/pages/connexion/LoginPage'
import { DocumentsPage } from '@/pages/espace/DocumentsPage'
import { EtudiantsPage } from '@/pages/espace/EtudiantsPage'
import { MesCoursPage } from '@/pages/espace/MesCoursPage'
import { ModuleEnPreparationPage } from '@/pages/espace/ModuleEnPreparationPage'
import { HomePage } from '@/pages/home/HomePage'
import { MotDePassePage } from '@/pages/mon-compte/MotDePassePage'
import { ParametresPage } from '@/pages/mon-compte/ParametresPage'
import { ProfilPage } from '@/pages/mon-compte/ProfilPage'
import { NotFoundPage } from '@/pages/not-found/NotFoundPage'
import { MesPresencesPage } from '@/pages/presences/MesPresencesPage'
import { PresencesPage } from '@/pages/presences/PresencesPage'
import { SallePage } from '@/pages/salle/SallePage'
import { TableauDeBordPage } from '@/pages/tableau-de-bord/TableauDeBordPage'
import { UtilisateursPage } from '@/pages/utilisateurs/UtilisateursPage'

export const router = createBrowserRouter([
  // Page plein écran, sans en-tête (maquette 08)
  { path: routes.connexion, element: <LoginPage /> },

  // Espace connecté : barre latérale selon le rôle (maquettes 02 à 06)
  {
    element: <RequireAuth />,
    children: [
      // Salle de classe virtuelle en plein écran (maquette 07)
      { path: routes.salle(':id'), element: <SallePage /> },
      {
        element: <AppLayout />,
        children: [
          { path: routes.tableauDeBord, element: <TableauDeBordPage /> },
          { path: routes.motDePasse, element: <MotDePassePage /> },
          { path: routes.profil, element: <ProfilPage /> },
          { path: routes.parametres, element: <ParametresPage /> },
          { path: routes.classes, element: <ClassesPage /> },
          { path: routes.classe(':id'), element: <ClasseDetailPage /> },
          { path: routes.mesCours, element: <MesCoursPage /> },
          { path: routes.calendrier, element: <CalendrierPage /> },
          { path: routes.documents, element: <DocumentsPage /> },
          {
            path: routes.evaluations,
            element: (
              <ModuleEnPreparationPage
                titre="Évaluations"
                icone={SquareCheckBig}
                description="Les devoirs, quiz et évaluations notées arriveront dans une prochaine version de Leaders Classroom."
              />
            ),
          },
          {
            path: routes.messages,
            element: (
              <ModuleEnPreparationPage
                titre="Messages"
                icone={MessageSquareText}
                description="La messagerie entre enseignants, apprenants et administration arrivera dans une prochaine version. En séance, utilisez le chat de la classe virtuelle."
              />
            ),
          },
          {
            path: routes.certificats,
            element: (
              <ModuleEnPreparationPage
                titre="Certificats"
                icone={BadgeCheck}
                description="Les attestations et certificats de fin de formation arriveront dans une prochaine version de Leaders Classroom."
              />
            ),
          },
          {
            element: <RequireAuth roles={['ADMIN', 'ENSEIGNANT']} />,
            children: [
              { path: routes.presences, element: <PresencesPage /> },
              { path: routes.etudiants, element: <EtudiantsPage /> },
            ],
          },
          {
            element: <RequireAuth roles={['APPRENANT']} />,
            children: [{ path: routes.mesPresences, element: <MesPresencesPage /> }],
          },
          {
            // Administration uniquement (l'API vérifie aussi les droits)
            element: <RequireAuth roles={['ADMIN']} />,
            children: [
              { path: routes.utilisateurs, element: <UtilisateursPage /> },
              { path: routes.nouvelleClasse, element: <NouvelleClassePage /> },
            ],
          },
        ],
      },
    ],
  },

  // Site visiteur
  {
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
