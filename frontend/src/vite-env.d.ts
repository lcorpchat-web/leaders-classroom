/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_INSTITUTIONNEL_URL?: string
  readonly VITE_VIDEO_PRESENTATION_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
