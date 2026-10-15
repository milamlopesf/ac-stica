import type { CronogramaEtapa } from '@/lib/types/database'

/**
 * Data de publicação planejada da etapa pendente mais próxima (a que ainda
 * não tem publicação realizada) — usada pra manter projetos.entrega
 * sincronizada com o cronograma. Retorna null se não houver nenhuma etapa
 * pendente com data planejada.
 */
export function proximaEntregaPendente(etapas: CronogramaEtapa[]): string | null {
  const pendentes = etapas
    .filter((e) => e.publicacao_planejado && !e.publicacao_realizado)
    .map((e) => e.publicacao_planejado as string)
    .sort()
  return pendentes[0] ?? null
}
