import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import styles from './AppLayout.module.css'

/** Mise en page de l'espace connecté : barre latérale + barre supérieure (maquettes 02, 03, 04). */
export function AppLayout() {
  const [menuOuvert, setMenuOuvert] = useState(false)
  const { pathname } = useLocation()
  const [cheminPrecedent, setCheminPrecedent] = useState(pathname)

  // Changement de page : on referme le menu mobile (ajustement d'état pendant le rendu)
  if (pathname !== cheminPrecedent) {
    setCheminPrecedent(pathname)
    setMenuOuvert(false)
  }

  // Touche Échap : ferme le menu mobile
  useEffect(() => {
    if (!menuOuvert) return
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOuvert(false)
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuOuvert])

  return (
    <div className={styles.shell}>
      <a href="#contenu" className="skip-link">
        Aller au contenu
      </a>
      <Sidebar ouvert={menuOuvert} onFermer={() => setMenuOuvert(false)} />
      {menuOuvert && <div className={styles.voile} onClick={() => setMenuOuvert(false)} aria-hidden />}

      <div className={styles.principal}>
        <Topbar onOuvrirMenu={() => setMenuOuvert(true)} />
        <main id="contenu" className={styles.contenu}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
