import type { CronogramaEtapa } from '@/lib/types/database'

export type StatusCronograma = 'concluido_prazo' | 'concluido_atraso' | 'atrasado' | 'planejado'

export const COR_STATUS_CRONOGRAMA: Record<StatusCronograma, string> = {
  concluido_prazo: '#22c55e',
  concluido_atraso: '#f59e0b',
  atrasado: '#ef4444',
  planejado: '#94a3b8',
}

export const LABEL_STATUS_CRONOGRAMA: Record<StatusCronograma, string> = {
  concluido_prazo: 'Concluída no prazo',
  concluido_atraso: 'Concluída em atraso',
  atrasado: 'Atrasada',
  planejado: 'Planejada',
}

/** Mesma lógica usada na barra do Gantt (aba Cronograma) e no Calendário. */
export function statusCronograma(etapa: CronogramaEtapa, hoje: string): StatusCronograma {
  if (etapa.concluido) {
    return etapa.data_fim && etapa.data_conclusao && etapa.data_conclusao > etapa.data_fim
      ? 'concluido_atraso'
      : 'concluido_prazo'
  }
  if (etapa.data_fim && etapa.data_fim < hoje) return 'atrasado'
  return 'planejado'
}

/**
 * Data final da etapa pendente mais próxima (a que ainda não foi marcada
 * concluída) — usada pra manter projetos.entrega sincronizada com o
 * cronograma. Retorna null se não houver nenhuma etapa pendente com data.
 */
export function proximaEntregaPendente(etapas: CronogramaEtapa[]): string | null {
  const pendentes = etapas
    .filter((e) => e.data_fim && !e.concluido)
    .map((e) => e.data_fim as string)
    .sort()
  return pendentes[0] ?? null
}
