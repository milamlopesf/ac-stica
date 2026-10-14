import type { FluxoProjetoEtapa } from '@/lib/types/database'

export function etapaAtrasada(etapa: FluxoProjetoEtapa, hoje: string) {
  return Boolean(etapa.data_limite) && etapa.data_limite! < hoje && etapa.status !== 'concluido'
}

/** Soma dias a uma data no formato ISO (YYYY-MM-DD), em UTC pra evitar problema de fuso. */
export function somarDias(dataISO: string, dias: number): string {
  const [ano, mes, dia] = dataISO.split('-').map(Number)
  const data = new Date(Date.UTC(ano, mes - 1, dia))
  data.setUTCDate(data.getUTCDate() + dias)
  return data.toISOString().slice(0, 10)
}
