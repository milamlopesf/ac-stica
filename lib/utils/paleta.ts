// Paleta categórica validada (dataviz skill) — ordem fixa, nunca ciclada arbitrariamente.
export const PALETA_CATEGORICA = [
  '#2a78d6', // blue
  '#008300', // green
  '#e87ba4', // magenta
  '#eda100', // yellow
  '#1baf7a', // aqua
  '#eb6834', // orange
  '#4a3aa7', // violet
  '#e34948', // red
]

export function corCategorica(indice: number): string {
  return PALETA_CATEGORICA[indice % PALETA_CATEGORICA.length]
}
