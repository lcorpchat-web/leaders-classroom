import { Outlet } from 'react-router'
import { Header } from '@/components/layout/Header'

/** Mise en page des pages visiteur (non connecté). */
export function PublicLayout() {
  return (
    <>
      <a href="#contenu" className="skip-link">
        Aller au contenu
      </a>
      <Header />
      <main id="contenu">
        <Outlet />
      </main>
    </>
  )
}
