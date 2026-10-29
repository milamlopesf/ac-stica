import type { CronogramaEtapa } from '@/lib/types/database'

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
