import { useEffect, useState } from 'react'

/** Valeur retardée : évite d'appeler l'API à chaque frappe dans un champ de recherche. */
export function useDebounce<T>(valeur: T, delai = 300): T {
  const [retardee, setRetardee] = useState(valeur)
  useEffect(() => {
    const minuteur = setTimeout(() => setRetardee(valeur), delai)
    return () => clearTimeout(minuteur)
  }, [valeur, delai])
  return retardee
}
