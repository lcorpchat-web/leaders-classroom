/**
 * Export CSV ouvert directement par Excel en français : séparateur « ; » et BOM UTF-8
 * pour conserver les accents.
 */
export function telechargerCsv(nomFichier: string, entetes: string[], lignes: Array<Array<string | number>>) {
  const echapper = (valeur: string | number) => {
    const texte = String(valeur)
    return /[";\n]/.test(texte) ? `"${texte.replace(/"/g, '""')}"` : texte
  }
  const contenu = [entetes, ...lignes].map((ligne) => ligne.map(echapper).join(';')).join('\r\n')
  const url = URL.createObjectURL(new Blob(['﻿', contenu], { type: 'text/csv;charset=utf-8' }))
  const lien = document.createElement('a')
  lien.href = url
  lien.download = nomFichier
  lien.click()
  URL.revokeObjectURL(url)
}

/** Nom de fichier sans caractères problématiques */
export const nomFichierSur = (texte: string) =>
  texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
