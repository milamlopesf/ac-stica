export type StatusCobertura = 'sim' | 'nao'

export const LABEL_STATUS_COBERTURA: Record<StatusCobertura, string> = {
  sim: 'Sim',
  nao: 'Não',
}

export const CLASSE_STATUS_COBERTURA: Record<StatusCobertura, string> = {
  sim: 'border-green-300 bg-green-50 text-green-700',
  nao: 'border-red-300 bg-red-50 text-red-700',
}
