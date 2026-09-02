export type StatusCobertura = 'sim' | 'nao' | 'pendente' | 'nao_localizado'

export const LABEL_STATUS_COBERTURA: Record<StatusCobertura, string> = {
  sim: 'Sim',
  nao: 'Não',
  pendente: 'Pendente',
  nao_localizado: 'Não localizado',
}

export const CLASSE_STATUS_COBERTURA: Record<StatusCobertura, string> = {
  sim: 'border-green-300 bg-green-50 text-green-700',
  nao: 'border-red-300 bg-red-50 text-red-700',
  pendente: 'border-amber-300 bg-amber-50 text-amber-700',
  nao_localizado: 'border-gray-300 bg-gray-50 text-gray-500',
}

/** Extrai e normaliza o código "NNNN.NN" de dentro de uma referência ou nome de projeto. */
export function extrairCodigo(texto: string): string | null {
  const m = texto.match(/(\d+)[./](\d+)/)
  if (!m) return null
  return `${m[1]}.${m[2]}`
}

/** "Contratado (acústica)": Sim para qualquer projetista externo, Não só para "Interno". */
export function calcularContratado(
  projetista: string | null | undefined,
  encontrado: boolean
): StatusCobertura {
  if (!encontrado) return 'nao_localizado'
  const valor = projetista?.trim()
  if (!valor) return 'pendente'
  return valor === 'Interno' ? 'nao' : 'sim'
}

/** "Acompanhamento interno": Sim sempre que já existir QUALQUER projetista definido. */
export function calcularAcompanhamento(
  projetista: string | null | undefined,
  encontrado: boolean
): StatusCobertura {
  if (!encontrado) return 'nao_localizado'
  const valor = projetista?.trim()
  return valor ? 'sim' : 'pendente'
}
