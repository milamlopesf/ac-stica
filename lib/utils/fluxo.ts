import type { FluxoProjetoEtapa } from '@/lib/types/database'

/** O prazo é único para o fluxo inteiro (mesmo valor em todas as etapas da instância). */
export function fluxoAtrasado(etapas: FluxoProjetoEtapa[], hoje: string) {
  const dataLimite = etapas[0]?.data_limite_total
  if (!dataLimite) return false
  const concluido = etapas.length > 0 && etapas.every((e) => e.status === 'concluido')
  return dataLimite < hoje && !concluido
}

/** Soma dias a uma data no formato ISO (YYYY-MM-DD), em UTC pra evitar problema de fuso. */
export function somarDias(dataISO: string, dias: number): string {
  const [ano, mes, dia] = dataISO.split('-').map(Number)
  const data = new Date(Date.UTC(ano, mes - 1, dia))
  data.setUTCDate(data.getUTCDate() + dias)
  return data.toISOString().slice(0, 10)
}
