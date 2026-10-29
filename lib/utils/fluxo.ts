import type { FluxoInstancia, FluxoProjetoEtapa } from '@/lib/types/database'

/** O prazo é único para o fluxo inteiro (fluxo_instancias.data_limite_total). */
export function fluxoAtrasado(instancia: FluxoInstancia, etapas: FluxoProjetoEtapa[], hoje: string) {
  if (!instancia.data_limite_total) return false
  const concluido = etapas.length > 0 && etapas.every((e) => e.status === 'concluido')
  return instancia.data_limite_total < hoje && !concluido
}

/** Soma dias a uma data no formato ISO (YYYY-MM-DD), em UTC pra evitar problema de fuso. */
export function somarDias(dataISO: string, dias: number): string {
  const [ano, mes, dia] = dataISO.split('-').map(Number)
  const data = new Date(Date.UTC(ano, mes - 1, dia))
  data.setUTCDate(data.getUTCDate() + dias)
  return data.toISOString().slice(0, 10)
}
