const siteInstitutionnelUrl = (
  import.meta.env.VITE_SITE_INSTITUTIONNEL_URL || 'https://www.institutleaderscorporation.com'
).replace(/\/$/, '')

/** Informations générales de l'application, configurables par variables d'environnement. */
export const site = {
  nom: 'Leaders Classroom',
  institut: "Institut Leader's Corporation",
  siteInstitutionnelUrl,
  videoPresentationUrl: import.meta.env.VITE_VIDEO_PRESENTATION_URL || siteInstitutionnelUrl,
  /**
   * Les comptes sont créés par l'administration (cahier des charges, point 5) :
   * « S'inscrire » mène vers la page de contact du site institutionnel.
   */
  inscriptionUrl: `${siteInstitutionnelUrl}/contact`,
} as const
