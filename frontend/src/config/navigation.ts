import { routes } from './routes'
import { site } from './site'

/** Lien de navigation : page interne (to) ou adresse externe/ancre (href). */
export type NavItem =
  | { label: string; to: string; href?: never; external?: never }
  | { label: string; href: string; external?: boolean; to?: never }

/** Menu principal de l'espace visiteur (maquette 01-page-accueil). */
export const navigationPublique: NavItem[] = [
  { label: 'Accueil', to: routes.accueil },
  { label: 'Formations', href: `${site.siteInstitutionnelUrl}/formations`, external: true },
  { label: 'Cours en ligne', href: '#fonctionnalites' },
  { label: 'À propos', href: `${site.siteInstitutionnelUrl}/a-propos`, external: true },
  { label: 'Contact', href: `${site.siteInstitutionnelUrl}/contact`, external: true },
]
