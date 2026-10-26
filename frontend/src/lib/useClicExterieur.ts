import { useEffect, type RefObject } from 'react'

/** Ferme un menu déroulant au clic en dehors ou à la touche Échap. */
export function useClicExterieur(ref: RefObject<HTMLElement | null>, actif: boolean, onFermer: () => void) {
  useEffect(() => {
    if (!actif) return
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onFermer()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onFermer()
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [ref, actif, onFermer])
}
