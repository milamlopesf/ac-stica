import type { NivelRisco } from '@/lib/types/database'

const PESO: Record<NivelRisco, number> = { Baixo: 1, Médio: 2, Alto: 3 }

/** Cruza probabilidade x impacto numa matriz de risco simples (1-9) e classifica em Baixo/Médio/Alto. */
export function calcularCriticidade(
  probabilidade: NivelRisco | null,
  impacto: NivelRisco | null
): NivelRisco | null {
  if (!probabilidade || !impacto) return null
  const score = PESO[probabilidade] * PESO[impacto]
  if (score <= 2) return 'Baixo'
  if (score <= 4) return 'Médio'
  return 'Alto'
}
