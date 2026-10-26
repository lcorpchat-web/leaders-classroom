/**
 * URL des images servies par l'API après authentification. Le nom du fichier change à chaque
 * remplacement : il sert de version et permet la mise en cache par le navigateur.
 */
export const urlPhoto = (utilisateurId: string, photo: string | null | undefined) =>
  photo ? `/api/utilisateurs/${utilisateurId}/photo?v=${encodeURIComponent(photo)}` : null

export const urlImageClasse = (classeId: string, image: string | null | undefined) =>
  image ? `/api/classes/${classeId}/image?v=${encodeURIComponent(image)}` : null
