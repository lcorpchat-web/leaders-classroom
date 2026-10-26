/** Couleur stable par classe pour le calendrier (vert, bleu, orange, violet, jaune… comme la maquette 05). */
const PALETTE = [
  { fond: '#dcfae6', texte: '#085d3a', accent: '#12b76a' },
  { fond: '#e0ecff', texte: '#1849a9', accent: '#2e90fa' },
  { fond: '#ffe9d6', texte: '#93370d', accent: '#fe7401' },
  { fond: '#ebe9fe', texte: '#4a1fb8', accent: '#7a5af8' },
  { fond: '#fef7c3', texte: '#713b12', accent: '#eaaa08' },
  { fond: '#fce7f6', texte: '#851651', accent: '#ee46bc' },
]

export type CouleurClasse = (typeof PALETTE)[number]

export function couleurClasse(classeId: string): CouleurClasse {
  const code = [...classeId].reduce((somme, c) => somme + c.charCodeAt(0), 0)
  return PALETTE[code % PALETTE.length]!
}
