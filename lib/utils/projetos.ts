import type { Projeto } from '@/lib/types/database'

export function estaAtrasado(projeto: Projeto, hoje: string) {
  return Boolean(projeto.entrega) && projeto.entrega! < hoje && projeto.status !== 'Concluído'
}
